import { writeFileSync } from "node:fs";

const out = process.argv[2];
const cwd = "/tmp/shop";
let clock = Date.parse("2026-11-23T09:00:00.000Z");
let previous = null;
let counter = 0;
const lines = [{ type: "session", version: 3, id: "0b7d2c1e-legible-thinking", timestamp: new Date(clock).toISOString(), cwd }];

function entry(message) {
  clock += 2000;
  counter += 1;
  const id = counter.toString(16).padStart(8, "0");
  lines.push({ type: "message", id, parentId: previous, timestamp: new Date(clock).toISOString(), message: { ...message, timestamp: clock } });
  previous = id;
}

const THINKING = [
  "The fee is added even when qty is 0. Something like this should work:",
  "",
  "```python",
  "def cart_total(items):",
  "  return sum([i['price']*i['qty']+i.get('fee',0) for i in items if i.get('qty',0)>0])",
  "```",
  "",
  "Untagged block, should stay as written:",
  "",
  "```",
  "a&&b;c|d",
  "```",
  "",
  "Inline: `cd x && make | tail -3` should stay inline.",
].join("\n");

entry({ role: "user", content: "Why is the cart total wrong?" });
entry({
  role: "assistant",
  content: [
    { type: "thinking", thinking: THINKING },
    { type: "text", text: "Items with qty 0 still add their fee." },
  ],
  api: "openai-completions",
  provider: "demo",
  model: "your-model",
  usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
  stopReason: "stop",
});

writeFileSync(out, lines.map((line) => JSON.stringify(line)).join("\n") + "\n");
