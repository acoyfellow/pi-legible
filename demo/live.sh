#!/bin/sh
MODE="$1"
REPO=$(cd "$(dirname "$0")/.." && pwd)
DEMO_DIR=/tmp/pi-legible-demo
PORT=${DEMO_MODEL_PORT:-8917}

export PI_CODING_AGENT_DIR="$DEMO_DIR/live-$MODE"
export PI_OFFLINE=1
export PI_SKIP_VERSION_CHECK=1

mkdir -p "$PI_CODING_AGENT_DIR"
printf '{"quietStartup": true, "defaultProvider": "demo", "defaultModel": "your-model"}\n' > "$PI_CODING_AGENT_DIR/settings.json"
printf '{"providers":{"demo":{"baseUrl":"http://127.0.0.1:%s/v1","api":"openai-completions","apiKey":"none","models":[{"id":"your-model"}]}}}\n' "$PORT" > "$PI_CODING_AGENT_DIR/models.json"

cd /tmp/shop
clear
if [ "$MODE" = "with" ]; then
  exec pi --no-session --no-extensions --no-skills --no-context-files --tools bash -e "$REPO"
fi
exec pi --no-session --no-extensions --no-skills --no-context-files --tools bash
