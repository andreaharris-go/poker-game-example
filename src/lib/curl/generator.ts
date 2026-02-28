export function generateCurl(
  baseUrl: string,
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: object,
): string {
  const url = `${baseUrl}${path}`;
  const parts: string[] = ["curl"];

  if (method.toUpperCase() !== "GET") {
    parts.push(`-X ${method.toUpperCase()}`);
  }

  parts.push(`'${url}'`);

  for (const [key, value] of Object.entries(headers)) {
    const escaped = value.replace(/'/g, "'\\''");
    parts.push(`-H '${key}: ${escaped}'`);
  }

  if (body) {
    const json = JSON.stringify(body);
    const escaped = json.replace(/'/g, "'\\''");
    parts.push(`-d '${escaped}'`);
  }

  return parts.join(" \\\n  ");
}
