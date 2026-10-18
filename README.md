# csv2json-mini

Tiny dependency-free CSV to JSON converter with a CLI.

It handles quoted values, delimiters and line breaks inside quotes, doubled quotes (`""`), `\r\n` line endings and a UTF-8 BOM. Errors say which line is wrong and how to fix it.

## Install

This is a private repo, not published to npm. You need [Node.js](https://nodejs.org) 22 or newer and access to the repo.

```sh
git clone https://github.com/acus9345/csv2json-mini.git
cd csv2json-mini
npm install
npm run build
npm link
```

`npm link` makes the `csv2json-mini` command available everywhere. Skip it if you only want to use the library from this folder.

## Quick start

```sh
csv2json-mini --help
```

Convert a file (PowerShell or cmd):

```sh
csv2json-mini people.csv
```

Pipe CSV in:

```sh
echo "name,age" "Ada,36" | csv2json-mini --compact
```

In PowerShell the line above prints `[{"name":"Ada","age":"36"}]`.

From JavaScript, inside this folder after `npm run build`:

```js
import { csvToJson } from "./dist/index.js";

console.log(csvToJson("name,age\nAda,36")); // [ { name: 'Ada', age: '36' } ]
```

## Options

| CLI | Library | Default | What it does |
| --- | --- | --- | --- |
| `-d, --delimiter <char>` | `delimiter` | `,` | Field separator. `tab` means a tab character. |
| `--no-header` | `header: false` | header on | Return arrays instead of objects. |
| `--trim` | `trim: true` | off | Trim spaces around values. |
| `--compact` | (n/a) | off | Print JSON on one line. |

## Troubleshooting

- **`csv2json-mini` isn't recognized**: run `npm link` in the repo folder, or call it directly with `node dist/cli.js`.
- **`Line N: expected 3 values … found 2`**: that row has a missing or extra delimiter. Values containing the delimiter must be in quotes.
- **`a quoted value is never closed`**: a value starts with `"` but has no closing quote.
- **Wrong columns with semicolon files**: pass `--delimiter ";"`.

## Build from source

```sh
npm install
npm test
```

## License

MIT
