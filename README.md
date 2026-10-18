# csv2json-mini

Tiny dependency-free CSV to JSON converter with a CLI.

It handles quoted values, delimiters and line breaks inside quotes, doubled quotes (`""`), `\r\n` line endings and a UTF-8 BOM. Errors say which line is wrong and how to fix it.

## Install

You need [Node.js](https://nodejs.org) 22 or newer.

```sh
npm install csv2json-mini
```

For the command everywhere:

```sh
npm install -g csv2json-mini
```

Or run it without installing: `npx csv2json-mini --help`.

## Quick start

Command line (PowerShell, cmd, bash):

```sh
csv2json-mini people.csv
```

Pipe CSV in (PowerShell):

```sh
echo "name,age" "Ada,36" | csv2json-mini --compact
```

That prints `[{"name":"Ada","age":"36"}]`.

From JavaScript:

```js
import { csvToJson } from "csv2json-mini";

console.log(csvToJson("name,age\nAda,36")); // [ { name: 'Ada', age: '36' } ]
```

The package is ESM. `require("csv2json-mini")` also works on Node 22.12 or newer.

## Options

| CLI | Library | Default | What it does |
| --- | --- | --- | --- |
| `-d, --delimiter <char>` | `delimiter` | `,` | Field separator. `tab` means a tab character. |
| `--no-header` | `header: false` | header on | Return arrays instead of objects. |
| `--trim` | `trim: true` | off | Trim spaces around values. |
| `--compact` | (n/a) | off | Print JSON on one line. |

Also exported: `parseCsv(text, delimiter)` returns the raw rows as arrays of strings, and `CsvError` is the error type for bad CSV.

## Troubleshooting

- **`csv2json-mini` isn't recognized**: install it globally (`npm install -g csv2json-mini`) or use `npx csv2json-mini`.
- **`Line N: expected 3 values … found 2`**: that row has a missing or extra delimiter. Values containing the delimiter must be in quotes.
- **`a quoted value is never closed`**: a value starts with `"` but has no closing quote.
- **Wrong columns with semicolon files**: pass `--delimiter ";"`.
- **`ERR_REQUIRE_ESM` from `require()`**: use `import`, or upgrade to Node 22.12 or newer.

## Build from source

```sh
git clone https://github.com/acus9345/csv2json-mini.git
cd csv2json-mini
npm install
npm test
```

## License

MIT
