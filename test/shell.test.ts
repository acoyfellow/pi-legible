import { describe, expect, test } from "bun:test";
import { formatCommand, splitTopLevel } from "../extensions/shell";

describe("splitTopLevel", () => {
  test("splits on ; && || and | at the top level", () => {
    expect(splitTopLevel("a; b && c || d | e").map((p) => [p.text, p.joiner])).toEqual([
      ["a", ";"], ["b", "&&"], ["c", "||"], ["d", "|"], ["e", ""],
    ]);
  });
  test("never splits inside quotes", () => {
    expect(splitTopLevel(`jq -r '.a | .b; .c' file && echo "x && y"`).map((p) => p.text)).toEqual([`jq -r '.a | .b; .c' file`, `echo "x && y"`]);
  });
  test("never splits inside subshells or braces", () => {
    expect(splitTopLevel("x=$(a | b); { c; d; }").map((p) => p.text)).toEqual(["x=$(a | b)", "{ c; d; }"]);
  });
  test("keeps heredoc bodies whole", () => {
    const command = "python3 - <<'EOF'\nprint(1); print(2)\nEOF\necho done";
    expect(splitTopLevel(command).map((p) => p.text)).toEqual(["python3 - <<'EOF'\nprint(1); print(2)\nEOF", "echo done"]);
  });
  test("leaves redirects and case terminators alone", () => {
    expect(splitTopLevel("a 2>&1 >| f").map((p) => p.text)).toEqual(["a 2>&1 >| f"]);
  });
});

describe("formatCommand", () => {
  test("short single commands are unchanged", () => {
    expect(formatCommand("ls -la")).toBe("ls -la");
  });
  test("one step per line, continuations indented", () => {
    expect(formatCommand("cd ~/x && bun test | tail -3; echo ok")).toBe("cd ~/x &&\n  bun test |\n  tail -3\necho ok");
  });
  test("the screenshot blob becomes readable", () => {
    const blob = `sleep 2; tmux send-keys -t login -l "/quit"; tmux send-keys -t login Enter; sleep 3; tmux kill-session -t login 2>/dev/null; jq -r '."app" | "token_s=\\((.expires/1000|floor) - (now|floor))"' ~/tokens.json; cd ~/app && Q="How many zones?"; node evals/talker.mjs app/talker "$Q"`;
    const lines = formatCommand(blob).split("\n");
    expect(lines[0]).toBe("sleep 2");
    expect(lines).toContain(`tmux send-keys -t login -l "/quit"`);
    expect(lines.some((l) => l.startsWith(`jq -r '."app" | "token_s=`))).toBe(true);
    expect(lines).toContain("cd ~/app &&");
    expect(lines).toContain(`  Q="How many zones?"`);
    expect(lines.length).toBe(9);
  });
  test("formatting never changes what runs once lines are rejoined", () => {
    const command = "a && b | c; d";
    expect(formatCommand(command).replace(/\n\s*/g, " ")).toBe("a && b | c d");
  });
});
