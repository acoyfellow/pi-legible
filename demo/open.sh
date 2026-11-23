#!/bin/sh
MODE="$1"
DEMO_DIR=/tmp/pi-legible-demo
REPO=$(cd "$(dirname "$0")/.." && pwd)
SESSION="$DEMO_DIR/session-$MODE.jsonl"

mkdir -p "$DEMO_DIR/agent-$MODE" /tmp/shop
node "$REPO/demo/build-session.mjs" "$SESSION"

export PI_CODING_AGENT_DIR="$DEMO_DIR/agent-$MODE"
export PI_OFFLINE=1
export PI_SKIP_VERSION_CHECK=1
printf '{"quietStartup": true, "defaultProvider": "demo", "defaultModel": "your-model"}\n' > "$PI_CODING_AGENT_DIR/settings.json"
printf '{"providers":{"demo":{"baseUrl":"http://127.0.0.1:9/v1","api":"openai-completions","apiKey":"none","models":[{"id":"your-model"}]}}}\n' > "$PI_CODING_AGENT_DIR/models.json"
cd /tmp/shop
clear
if [ "$MODE" = "after" ]; then
  exec pi --session "$SESSION" --no-extensions --no-skills --no-context-files -e "$REPO"
fi
exec pi --session "$SESSION" --no-extensions --no-skills --no-context-files
