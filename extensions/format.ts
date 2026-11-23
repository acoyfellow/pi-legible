export type Piece = { readonly text: string; readonly joiner: string };

const JOINERS = ["&&", "||", ";", "|"] as const;
const WRAP_AT = 100;

function heredocDelimiter(command: string, index: number): string | null {
  const match = /^<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/.exec(command.slice(index));
  return match ? match[2] : null;
}

export function splitTopLevel(command: string): Piece[] {
  const pieces: Piece[] = [];
  let current = "";
  let quote: "'" | '"' | "`" | null = null;
  let depth = 0;
  let index = 0;

  const push = (joiner: string) => {
    if (current.trim()) pieces.push({ text: current.trim(), joiner });
    current = "";
  };

  while (index < command.length) {
    const char = command[index];

    if (quote) {
      current += char;
      if (char === "\\" && quote !== "'" && index + 1 < command.length) {
        current += command[index + 1];
        index += 2;
        continue;
      }
      if (char === quote) quote = null;
      index += 1;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      current += char;
      index += 1;
      continue;
    }

    if (char === "<" && command[index + 1] === "<" && command[index + 2] !== "<") {
      const delimiter = heredocDelimiter(command, index);
      const bodyEnd = delimiter ? command.indexOf(`\n${delimiter}`, index) : -1;
      if (delimiter && bodyEnd !== -1) {
        const end = bodyEnd + delimiter.length + 1;
        current += command.slice(index, end);
        index = end;
        continue;
      }
    }

    if (char === "(" || char === "{") depth += 1;
    if ((char === ")" || char === "}") && depth > 0) depth -= 1;

    if (depth === 0) {
      if (char === "\n") {
        push(";");
        index += 1;
        continue;
      }
      const joiner = JOINERS.find((candidate) => command.startsWith(candidate, index));
      const isPipeOr = joiner === "|" && command[index + 1] === "|";
      const isRedirectAmp = joiner === "|" && command[index - 1] === ">";
      if (joiner && !isPipeOr && !isRedirectAmp && !(joiner === ";" && command[index + 1] === ";")) {
        push(joiner);
        index += joiner.length;
        continue;
      }
    }

    current += char;
    index += 1;
  }

  push("");
  return pieces;
}

function wrapLong(text: string, indent: string): string {
  if (text.length <= WRAP_AT || text.includes("\n")) return text;
  const words = text.split(/(?<=\S)\s+(?=-{1,2}[A-Za-z]|"|')/);
  if (words.length < 2) return text;
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + word.length + 1 > WRAP_AT) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  lines.push(line);
  return lines.join(` \\\n${indent}    `);
}

export function formatCommand(command: string): string {
  const pieces = splitTopLevel(command);
  if (pieces.length <= 1 && command.length <= WRAP_AT) return command;

  const lines: string[] = [];
  let indent = "";
  for (const piece of pieces) {
    lines.push(`${indent}${wrapLong(piece.text, indent)}${piece.joiner && piece.joiner !== ";" ? ` ${piece.joiner}` : ""}`);
    indent = piece.joiner === "|" ? "  " : piece.joiner === "&&" || piece.joiner === "||" ? "  " : "";
  }
  return lines.join("\n");
}
