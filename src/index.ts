/** Options for {@link csvToJson}. */
export interface CsvOptions {
  /** Field separator. Default `,`. */
  delimiter?: string;
  /** Treat the first row as column names (default `true`). When `false`, rows are returned as arrays. */
  header?: boolean;
  /** Trim spaces around unquoted values (default `false`). */
  trim?: boolean;
}

/** One parsed row: an object keyed by column name, or an array when `header` is `false`. */
export type CsvRow = Record<string, string> | string[];

/** Thrown for CSV that can't be parsed; the message says where and how to fix it. */
export class CsvError extends Error {
  constructor(message: string, readonly line: number) {
    super(`Line ${line}: ${message}`);
    this.name = "CsvError";
  }
}

/**
 * Split CSV text into rows of fields (RFC 4180): quoted fields may contain the delimiter,
 * line breaks and doubled quotes (`""`). Handles `\n` and `\r\n` line endings.
 */
export function parseCsv(text: string, delimiter = ","): string[][] {
  if (typeof text !== "string") throw new TypeError('parseCsv(text): text must be a string, for example parseCsv("a,b\\n1,2").');
  if (delimiter.length !== 1 || delimiter === '"' || delimiter === "\n" || delimiter === "\r") {
    throw new TypeError(`delimiter must be one character other than a quote or line break, got ${JSON.stringify(delimiter)}.`);
  }
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let quoteLine = 1;
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // drop a UTF-8 BOM

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === "\n") line++;
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      if (field !== "") throw new CsvError(`a quote appears in the middle of an unquoted value. Wrap the whole value in quotes and double the inner quote ("").`, line);
      inQuotes = true;
      quoteLine = line;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      line++;
    } else {
      field += ch;
    }
  }
  if (inQuotes) throw new CsvError("a quoted value is never closed. Add the missing closing quote.", quoteLine);
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Ignore completely empty lines (for example a blank line at the end of the file).
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/**
 * Convert CSV text to JSON-ready rows.
 * @example csvToJson("name,age\nAda,36") // [{ name: "Ada", age: "36" }]
 */
export function csvToJson(text: string, options: CsvOptions = {}): CsvRow[] {
  const { delimiter = ",", header = true, trim = false } = options;
  const rows = parseCsv(text, delimiter).map((r) => (trim ? r.map((v) => v.trim()) : r));
  if (!header) return rows;
  const [columns, ...data] = rows;
  if (!columns) return [];
  const seen = new Set<string>();
  columns.forEach((name, index) => {
    if (name === "") throw new CsvError(`column ${index + 1} has no name. Give every header column a name, or use header: false.`, 1);
    if (seen.has(name)) throw new CsvError(`the column name "${name}" appears twice. Column names must be unique, or use header: false.`, 1);
    seen.add(name);
  });
  return data.map((values, index) => {
    if (values.length !== columns.length) {
      throw new CsvError(`expected ${columns.length} values (one per column) but found ${values.length}. Check for a missing or extra delimiter.`, index + 2);
    }
    return Object.fromEntries(columns.map((name, i) => [name, values[i] ?? ""]));
  });
}
