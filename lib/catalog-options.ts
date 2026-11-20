export type CatalogAttributes = Record<string, string>;

export function parseSpecificationLines(value: string): { attributes: CatalogAttributes; invalidLines: string[] } {
  const attributes: CatalogAttributes = {};
  const invalidLines: string[] = [];

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 1 || separator === line.length - 1) {
      invalidLines.push(line);
      continue;
    }
    const key = line.slice(0, separator).trim().slice(0, 60);
    const entry = line.slice(separator + 1).trim().slice(0, 200);
    if (!key || !entry) invalidLines.push(line);
    else attributes[key] = entry;
  }

  return { attributes, invalidLines };
}

export function attributesToSpecificationLines(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  return Object.entries(value)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1].trim()))
    .map(([key, entry]) => `${key}: ${entry}`)
    .join("\n");
}

export function variantAttributes(input: { color?: string; size?: string; material?: string }): CatalogAttributes {
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [key, value?.trim()] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

export function variantOptionSummary(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  return ["color", "size", "material"]
    .map(key => (value as Record<string, unknown>)[key])
    .filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()))
    .join(" · ");
}
