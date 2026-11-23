import * as biome from "@wasm-fmt/biome_fmt";
import * as go from "@wasm-fmt/gofmt";
import * as ruff from "@wasm-fmt/ruff_fmt";
import * as sql from "@wasm-fmt/sql_fmt";
import * as yaml from "@wasm-fmt/yamlfmt";
import { formatCommand } from "./shell";

export type Language = "shell" | "typescript" | "javascript" | "tsx" | "jsx" | "json" | "python" | "go" | "sql" | "yaml";

type Formatter = (code: string) => string;

const SPACES = { indentStyle: "space", indentWidth: 2, lineWidth: 100 } as const;
const MAX_INPUT = 20_000;

const ALIASES: Record<string, Language> = {
  sh: "shell", bash: "shell", zsh: "shell", shell: "shell", console: "shell",
  ts: "typescript", typescript: "typescript", mts: "typescript", cts: "typescript",
  js: "javascript", javascript: "javascript", mjs: "javascript", cjs: "javascript",
  tsx: "tsx", jsx: "jsx",
  json: "json", jsonc: "json",
  py: "python", python: "python",
  go: "go", golang: "go",
  sql: "sql",
  yml: "yaml", yaml: "yaml",
};

const EXTENSIONS: Record<string, string> = { typescript: "a.ts", javascript: "a.js", tsx: "a.tsx", jsx: "a.jsx", json: "a.json" };

function biomeFormat(language: Language): Formatter {
  return (code) => biome.format(code, EXTENSIONS[language], SPACES);
}

function scriptBody(language: Language): Formatter {
  const wrapperName = "__legible_body__";
  return (code) => {
    const wrapped = `async function ${wrapperName}() {\n${code}\n}\n`;
    const formatted = biome.format(wrapped, EXTENSIONS[language], SPACES).trimEnd().split("\n");
    if (formatted[0] !== `async function ${wrapperName}() {` || formatted.at(-1) !== "}") throw new Error("unwrapped");
    return formatted.slice(1, -1).map((line) => line.replace(/^ {2}/, "")).join("\n");
  };
}

const FORMATTERS: Record<Language, Formatter> = {
  shell: formatCommand,
  typescript: biomeFormat("typescript"),
  javascript: biomeFormat("javascript"),
  tsx: biomeFormat("tsx"),
  jsx: biomeFormat("jsx"),
  json: (code) => JSON.stringify(JSON.parse(code), null, 2),
  python: (code) => ruff.format(code, null, { indent_width: 4, line_width: 100 }),
  go: (code) => go.format(code),
  sql: (code) => sql.format(code, {}),
  yaml: (code) => yaml.format(code, {}),
};

export function languageOf(tag: string | undefined): Language | null {
  if (!tag) return null;
  return ALIASES[tag.trim().toLowerCase().split(/[\s{]/)[0]] ?? null;
}

function sameTokens(before: string, after: string): boolean {
  const squash = (text: string) => text.replace(/[\s;,()]/g, "").replace(/["'`]/g, "'");
  return squash(before) === squash(after);
}

export function formatCode(code: string, language: Language | null): string {
  if (!language || code.length > MAX_INPUT || !code.trim()) return code;
  try {
    const formatted = FORMATTERS[language](code).replace(/\n+$/, "");
    if (!formatted.trim()) return code;
    if (language !== "shell" && language !== "sql" && !sameTokens(code, formatted)) return code;
    return formatted;
  } catch {
    return code;
  }
}

export function formatScript(code: string): string {
  if (code.length > MAX_INPUT || !code.trim()) return code;
  try {
    const formatted = scriptBody("typescript")(code);
    return sameTokens(code, formatted) ? formatted : code;
  } catch {
    return code;
  }
}
