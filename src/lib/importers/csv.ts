import Papa from "papaparse";

export interface CsvResult {
  data: Record<string, string>[];
  errors: { message: string }[];
}

/** Thin wrapper so every importer parses CSV the same way. */
export function parseCsv(csvText: string): CsvResult {
  const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  return { data, errors };
}
