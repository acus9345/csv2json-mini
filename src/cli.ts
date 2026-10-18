#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { csvToJson, CsvError } from "./index.js";

const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

const HELP = `Usage: csv2json-mini [file.csv] [options]

Reads CSV from a file (or from standard input when no file is given) and prints JSON.

Options:
  -d, --delimiter <char>  Field separator (default ","). Use "tab" for tab-separated files
      --no-header         Output arrays instead of objects
      --trim              Trim spaces around unquoted values
      --compact           Print JSON on one line
  -h, --help              Show this help
  -v, --version           Show the version

Examples:
  csv2json-mini people.csv
  csv2json-mini data.tsv --delimiter tab --compact
  type people.csv | csv2json-mini         (Windows cmd)
  Get-Content people.csv | csv2json-mini  (PowerShell)`;

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}
if (args.includes("--version") || args.includes("-v")) {
  console.log(version);
  process.exit(0);
}

let file: string | undefined;
let delimiter = ",";
let header = true;
let trim = false;
let compact = false;
for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;
  if (arg === "-d" || arg === "--delimiter") {
    const value = args[++i];
    if (value === undefined) fail(`${arg} needs a value, for example ${arg} ";".`);
    delimiter = value === "tab" || value === "\\t" ? "\t" : value;
  } else if (arg === "--no-header") header = false;
  else if (arg === "--trim") trim = true;
  else if (arg === "--compact") compact = true;
  else if (arg.startsWith("-")) fail(`unknown option ${arg}. Run csv2json-mini --help for the options.`);
  else if (file === undefined) file = arg;
  else fail(`only one file can be converted at a time, got "${file}" and "${arg}".`);
}

if (file === undefined && process.stdin.isTTY) {
  fail("no input. Pass a CSV file (csv2json-mini people.csv) or pipe CSV into it. Run csv2json-mini --help for examples.");
}

let text: string;
try {
  text = readFileSync(file ?? 0, "utf8");
} catch (error) {
  const code = (error as NodeJS.ErrnoException).code;
  fail(code === "ENOENT" ? `file not found: ${file}. Check the path.` : `could not read ${file ?? "standard input"}: ${(error as Error).message}`);
}

try {
  console.log(JSON.stringify(csvToJson(text, { delimiter, header, trim }), null, compact ? 0 : 2));
} catch (error) {
  if (error instanceof CsvError || error instanceof TypeError) fail(error.message);
  throw error;
}
