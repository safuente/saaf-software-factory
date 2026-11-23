/** Test support for the design and theme tests: reads docs/design.md, its level-2 sections
 * and their first Markdown table. Not imported by any app module (F05 AC-2 d). */

/** The body of the `## <heading>` section, up to the next level-2 heading; "" if missing. */
export function section(markdown: string, heading: string): string {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return "";
  const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join("\n")
    .trim();
}

/** The first table of a section as one record per row, keyed by the header cells. */
export function sectionTable(markdown: string, heading: string): Record<string, string>[] {
  const rows = section(markdown, heading)
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .map((line) =>
      line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    );
  const [header, separator, ...body] = rows;
  if (!header || !separator) return [];
  return body.map((cells) => Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""])));
}
