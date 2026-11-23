import { formatCode, languageOf } from "./languages";

const FENCE = /^( {0,3})(`{3,}|~{3,})([^\n`]*)\n([\s\S]*?)\n\1\2[ \t]*$/gm;

export function formatMarkdownCode(markdown: string, width?: number): string {
  if (!markdown.includes("```") && !markdown.includes("~~~")) return markdown;
  return markdown.replace(FENCE, (whole, indent: string, fence: string, info: string, body: string) => {
    const formatted = formatCode(body, languageOf(info), width);
    return formatted === body ? whole : `${indent}${fence}${info}\n${formatted}\n${indent}${fence}`;
  });
}
