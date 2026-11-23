#!/bin/sh
MODE="$1"
WINDOW="$2"
WORKSPACE="$3"
REPO=$(cd "$(dirname "$0")/.." && pwd)
OUT="$REPO/docs/raw-$MODE.mp4"
WIDTH=1100
HEIGHT=900
SIDEBAR=236
TAB_BAR=60
FOOTER=20
PROMPT="Run the tests and fix the cart total."

cmux resize-window --window "$WINDOW" --width $WIDTH --height $HEIGHT >/dev/null
cmux send-key --workspace "$WORKSPACE" ctrl+c >/dev/null
cmux send-key --workspace "$WORKSPACE" ctrl+c >/dev/null
sleep 1
sh "$REPO/demo/shop.sh" >/dev/null 2>&1
cmux send --workspace "$WORKSPACE" "sh $REPO/demo/live.sh $MODE" >/dev/null
cmux send-key --workspace "$WORKSPACE" Enter >/dev/null
sleep 3

REGION="$SIDEBAR,$TAB_BAR,$((WIDTH - SIDEBAR)),$((HEIGHT - TAB_BAR - FOOTER))"
cmux record start --window "$WINDOW" --region "$REGION" --fps 24 --max-seconds 20 --no-captions --out "$OUT" >/dev/null
sleep 1
cmux send --workspace "$WORKSPACE" "$PROMPT" >/dev/null
sleep 1
cmux send-key --workspace "$WORKSPACE" Enter >/dev/null
sleep 12
cmux record stop
