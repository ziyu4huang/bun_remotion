export interface TableRow {
  [key: string]: string;
}

export interface ParsedTable {
  headers: string[];
  rows: TableRow[];
}

export function parseMarkdownTable(body: string): ParsedTable {
  const lines = body.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0]
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const dataLines = lines.slice(2);
  const rows = dataLines.map((line) => {
    const cells = line
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    const row: TableRow = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] || "";
    });
    return row;
  });

  return { headers, rows };
}

export function serializeMarkdownTable(headers: string[], rows: TableRow[]): string {
  const headerLine = "| " + headers.join(" | ") + " |";
  const sepLine = "| " + headers.map(() => "---").join(" | ") + " |";
  const dataLines = rows.map(
    (row) => "| " + headers.map((h) => row[h] ?? "").join(" | ") + " |"
  );
  return [headerLine, sepLine, ...dataLines].join("\n");
}

export function replaceSectionInMarkdown(
  fullMarkdown: string,
  sectionTitle: string,
  newBody: string
): string {
  const heading = `## ${sectionTitle}`;
  const headingIdx = fullMarkdown.indexOf(heading);
  if (headingIdx === -1) return fullMarkdown;

  const bodyStart = headingIdx + heading.length;
  let bodyEnd = fullMarkdown.length;

  const nextSection = fullMarkdown.indexOf("\n## ", bodyStart);
  if (nextSection !== -1) bodyEnd = nextSection;

  const before = fullMarkdown.slice(0, bodyStart);
  const after = fullMarkdown.slice(bodyEnd);

  return before + "\n\n" + newBody.trim() + "\n" + after;
}

export function isMarkdownTable(body: string): boolean {
  const lines = body.split("\n").filter((l) => l.trim().startsWith("|"));
  return lines.length >= 2;
}
