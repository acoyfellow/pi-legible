import type { ExtensionAPI, ToolRenderers } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { formatCommand } from "./format";

const SHELL_TOOLS = new Set(["bash", "powershell"]);

const WRITING_RULE = `
## Legible shell commands

The user reads every bash call in the transcript. Write commands a human can scan:
- One step per line. Use newlines between steps, not long chains of \`;\`.
- Put each \`&&\` or \`|\` continuation on its own line.
- Over three steps, or any loop or branching: write a script file with \`write\`, then run it.
- No inline Python or jq over about five lines; write a file instead.
- Name things: \`MODEL_DIR=...\` before use, not repeated long paths.
`;

function legibleCall(next: ToolRenderers | undefined, prompt: string): ToolRenderers {
  return {
    ...next,
    renderCall(args, theme, context) {
      const command = typeof args?.command === "string" ? args.command : "";
      if (!command) return next?.renderCall ? next.renderCall(args, theme, context) : new Text("", 0, 0);
      const formatted = formatCommand(command);
      const [first, ...rest] = formatted.split("\n");
      const timeout = args?.timeout ? theme.fg("muted", ` (timeout ${args.timeout}s)`) : "";
      const head = theme.fg("toolTitle", theme.bold(`${prompt} ${first}`));
      const body = rest.map((line) => theme.fg("toolTitle", `  ${line}`)).join("\n");
      const component = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
      component.setText(body ? `${head}\n${body}${timeout}` : `${head}${timeout}`);
      next?.renderCall?.(args, theme, { ...context, lastComponent: new Text("", 0, 0) });
      return component;
    },
  };
}

export default function legibleBash(pi: ExtensionAPI) {
  pi.registerToolRenderer((toolName, next) => {
    if (!SHELL_TOOLS.has(toolName)) return next();
    return legibleCall(next(), toolName === "powershell" ? ">" : "$");
  });

  pi.on("before_agent_start", async (event) => ({ systemPrompt: `${event.systemPrompt}\n${WRITING_RULE}` }));
}
