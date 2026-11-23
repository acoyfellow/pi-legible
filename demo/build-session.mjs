import { writeFileSync } from "node:fs";

const out = process.argv[2];
const cwd = "/tmp/shop";
let clock = Date.parse("2026-11-23T09:00:00.000Z");
let previous = null;
let counter = 0;
const lines = [{ type: "session", version: 3, id: "0b7d2c1e-legible-demo", timestamp: new Date(clock).toISOString(), cwd }];

function entry(message) {
  clock += 2000;
  counter += 1;
  const id = counter.toString(16).padStart(8, "0");
  lines.push({ type: "message", id, parentId: previous, timestamp: new Date(clock).toISOString(), message: { ...message, timestamp: clock } });
  previous = id;
}

const assistant = (content) => ({
  role: "assistant",
  content,
  api: "openai-completions",
  provider: "demo",
  model: "your-model",
  usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
  stopReason: "stop",
});

const command = `cd ~/shop && git pull --rebase && npm ci; npm test -- --reporter=dot 2>&1 | tail -4; git log --oneline -3 | cat`;

entry({ role: "user", content: "Pull, run the tests, and fix the cart total if it is wrong." });
entry(assistant([{ type: "toolCall", id: "call_bash", name: "bash", arguments: { command, timeout: 120 } }]));
entry({
  role: "toolResult",
  toolCallId: "call_bash",
  toolName: "bash",
  content: [{ type: "text", text: "Already up to date.\n  ...F...\n  1 failing: cart total counts items with qty 0\n4a1c9e2 Add cart page\n77d03b1 Seed products" }],
  isError: false,
});
entry(
  assistant([
    {
      type: "text",
      text: [
        "One test fails: the total counts items with a quantity of 0. Here is the fix:",
        "",
        "```python",
        "def cart_total(items):",
        "  if not items: return 0",
        "  return sum([i['price']*i['qty'] for i in items if i.get('qty',0)>0])",
        "```",
        "",
        "And the query I used to find affected orders:",
        "",
        "```sql",
        "select o.id,o.total,count(i.id) as items from orders o join items i on i.order_id=o.id where i.qty=0 group by o.id,o.total order by o.total desc",
        "```",
      ].join("\n"),
    },
  ]),
);

writeFileSync(out, lines.map((line) => JSON.stringify(line)).join("\n") + "\n");
