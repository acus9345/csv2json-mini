import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { csvToJson, parseCsv, CsvError } from "../dist/index.js";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

test("converts rows to objects keyed by the header", () => {
  assert.deepEqual(csvToJson("name,age\nAda,36\nAlan,41"), [
    { name: "Ada", age: "36" },
    { name: "Alan", age: "41" },
  ]);
});

test("handles quotes, embedded delimiters, line breaks and doubled quotes", () => {
  const csv = 'name,quote\r\n"Lovelace, Ada","She said ""hi""\nthen left"\r\n';
  assert.deepEqual(csvToJson(csv), [{ name: "Lovelace, Ada", quote: 'She said "hi"\nthen left' }]);
});

test("supports other delimiters, no header, trimming, BOM and blank lines", () => {
  assert.deepEqual(csvToJson("a;b\n1;2", { delimiter: ";" }), [{ a: "1", b: "2" }]);
  assert.deepEqual(csvToJson("1,2\n3,4", { header: false }), [["1", "2"], ["3", "4"]]);
  assert.deepEqual(csvToJson("a , b\n 1 , 2 ", { trim: true }), [{ a: "1", b: "2" }]);
  assert.deepEqual(csvToJson("﻿a\n1\n\n"), [{ a: "1" }]);
});

test("empty input gives an empty array", () => {
  assert.deepEqual(csvToJson(""), []);
  assert.deepEqual(csvToJson("a,b"), []);
  assert.deepEqual(parseCsv("\n\n"), []);
});

test("bad input fails with a helpful, located message", () => {
  assert.throws(() => csvToJson('a\n"open'), (e) => e instanceof CsvError && /Line 2: .*never closed/.test(e.message));
  assert.throws(() => csvToJson("a,b\n1"), /Line 2: expected 2 values .* found 1/);
  assert.throws(() => csvToJson("a,a\n1,2"), /appears twice/);
  assert.throws(() => csvToJson('a\nx"y'), /quote appears in the middle/);
  assert.throws(() => parseCsv(42), /must be a string/);
  assert.throws(() => csvToJson("a", { delimiter: '"' }), /delimiter must be one character/);
});

test("large input is fast", () => {
  const rows = Array.from({ length: 100_000 }, (_, i) => `${i},"name ${i}",${i * 2}`);
  const started = Date.now();
  const result = csvToJson(`id,name,double\n${rows.join("\n")}`);
  assert.equal(result.length, 100_000);
  assert.deepEqual(result[99_999], { id: "99999", name: "name 99999", double: "199998" });
  assert.ok(Date.now() - started < 3000, "100k rows should convert in under 3 s");
});

test("CLI converts a file and reads stdin", () => {
  const dir = mkdtempSync(join(tmpdir(), "csv2json-"));
  const file = join(dir, "people.csv");
  writeFileSync(file, "name,age\nAda,36\n");
  assert.deepEqual(JSON.parse(execFileSync(process.execPath, [cli, file], { encoding: "utf8" })), [{ name: "Ada", age: "36" }]);
  const piped = spawnSync(process.execPath, [cli, "--compact", "--delimiter", "tab"], { input: "a\tb\n1\t2\n", encoding: "utf8" });
  assert.equal(piped.stdout.trim(), '[{"a":"1","b":"2"}]');
});

test("CLI explains mistakes without stack traces", () => {
  const missing = spawnSync(process.execPath, [cli, "nope.csv"], { encoding: "utf8" });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /^Error: file not found: nope.csv/);
  const bad = spawnSync(process.execPath, [cli], { input: 'a\n"open', encoding: "utf8" });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /Error: Line 2: .*never closed/);
  assert.doesNotMatch(bad.stderr, /at .*\.js:\d+/);
  const unknown = spawnSync(process.execPath, [cli, "--nope"], { encoding: "utf8" });
  assert.match(unknown.stderr, /unknown option --nope/);
});

test("CLI --help and --version", () => {
  assert.match(execFileSync(process.execPath, [cli, "--help"], { encoding: "utf8" }), /Usage: csv2json-mini/);
  assert.match(execFileSync(process.execPath, [cli, "--version"], { encoding: "utf8" }).trim(), /^\d+\.\d+\.\d+$/);
});
