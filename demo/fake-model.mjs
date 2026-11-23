import { createServer } from "node:http";

const PORT = Number(process.env.DEMO_MODEL_PORT ?? 8917);
const CHUNK = 4;
const CHUNK_MS = 18;

const COMMAND = [
  "cd /tmp/shop && python3 -m unittest -q 2>&1 | tail -3;",
  "grep -n fee cart.py | head -3",
].join(" ");

const REPLY = [
  "Items with qty 0 still add their fee. Fix:",
  "",
  "```python",
  "def cart_total(items):",
  "  return sum([i['price']*i['qty']+i.get('fee',0) for i in items if i.get('qty',0)>0])",
  "```",
  "",
  "Orders to refund:",
  "",
  "```sql",
  "select o.id,sum(i.fee) as refund from orders o join items i on i.order_id=o.id where i.qty=0 group by o.id order by refund desc",
  "```",
].join("\n");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chunk(response, delta, finish = null) {
  const body = { id: "demo", object: "chat.completion.chunk", created: 0, model: "your-model", choices: [{ index: 0, delta, finish_reason: finish }] };
  response.write(`data: ${JSON.stringify(body)}\n\n`);
}

async function streamToolCall(response) {
  chunk(response, { role: "assistant", tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "bash", arguments: "" } }] });
  const args = JSON.stringify({ command: COMMAND, timeout: 60 });
  for (let at = 0; at < args.length; at += CHUNK) {
    chunk(response, { tool_calls: [{ index: 0, function: { arguments: args.slice(at, at + CHUNK) } }] });
    await sleep(CHUNK_MS);
  }
  chunk(response, {}, "tool_calls");
}

async function streamText(response) {
  chunk(response, { role: "assistant", content: "" });
  for (let at = 0; at < REPLY.length; at += CHUNK) {
    chunk(response, { content: REPLY.slice(at, at + CHUNK) });
    await sleep(CHUNK_MS);
  }
  chunk(response, {}, "stop");
}

createServer((request, response) => {
  let raw = "";
  request.on("data", (part) => (raw += part));
  request.on("end", async () => {
    const body = raw ? JSON.parse(raw) : {};
    const hasToolResult = (body.messages ?? []).some((message) => message.role === "tool");
    response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
    await sleep(500);
    await (hasToolResult ? streamText(response) : streamToolCall(response));
    response.write("data: [DONE]\n\n");
    response.end();
  });
}).listen(PORT, "127.0.0.1", () => console.log(`demo model on ${PORT}`));
