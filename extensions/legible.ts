import type { ExtensionAPI, ToolRenderers } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { formatCode, formatScript } from "./languages";
import { formatMarkdownCode } from "./markdown";

type CallFormatter = { readonly prompt: string; readonly field: string; readonly format: (code: string) => string };

const CALLS: Record<string, CallFormatter> = {
  bash: { prompt: "$", field: "command", format: (code) => formatCode(code, "shell") },
  powershell: { prompt: ">", field: "command", format: (code) => formatCode(code, "shell") },
  codemode: { prompt: "js", field: "code", format: formatScript },
};

const CODE_BLOCK_INDENT = 4;

const WRITING_RULE = `
## Legible code

The user reads every tool call and code block. Write code a human can scan:
- Shell: one step per line. Put each \`&&\` or \`|\` continuation on its own line. More than three steps, or any loop or branch: write a script file, then run it.
- No inline Python, jq or node over about five lines; write a file instead.
- Name things once: \`MODEL_DIR=...\` before use, not repeated long paths.
- Code blocks in replies: tag the language and use normal formatting, one statement per line.
`;

function argumentsSettled(context: { argsComplete?: boolean; executionStarted?: boolean; isPartial?: boolean }): boolean {
  return Boolean(context.argsComplete || context.executionStarted || context.isPartial === false);
}

function legibleCall(next: ToolRenderers | undefined, call: CallFormatter): ToolRenderers {
  return {
    ...next,
    renderCall(args, theme, context) {
      const source = typeof args?.[call.field] === "string" ? (args[call.field] as string) : "";
      if (!source || !argumentsSettled(context)) {
        return next?.renderCall ? next.renderCall(args, theme, context) : new Text(source, 0, 0);
      }
      next?.renderCall?.(args, theme, { ...context, lastComponent: undefined });
      const [first, ...rest] = call.format(source).split("\n");
      const timeout = args?.timeout ? theme.fg("muted", ` (timeout ${args.timeout}s)`) : "";
      const head = theme.fg("toolTitle", theme.bold(`${call.prompt} ${first}`));
      const body = rest.map((line) => theme.fg("toolTitle", `  ${line}`)).join("\n");
      const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
      component.setText(body ? `${head}\n${body}${timeout}` : `${head}${timeout}`);
      return component;
    },
  };
}

export default function legible(pi: ExtensionAPI) {
  pi.registerToolRenderer((toolName, next) => {
    const call = CALLS[toolName];
    return call ? legibleCall(next(), call) : next();
  });

  pi.registerMarkdownTransformer((markdown, context) => (context.isStreaming ? markdown : formatMarkdownCode(markdown, context.availableWidth - CODE_BLOCK_INDENT)));

  pi.on("before_agent_start", async (event) => ({ systemPrompt: `${event.systemPrompt}\n${WRITING_RULE}` }));
}
