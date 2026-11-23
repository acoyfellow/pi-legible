#!/bin/sh
MODE="$1"
WINDOW="$2"
WORKSPACE="$3"
REPO=$(cd "$(dirname "$0")/.." && pwd)
WIDTH=1000
HEIGHT=1040
SIDEBAR=236
TAB_BAR=60
FOOTER=170
NAME=without
[ "$MODE" = "after" ] && NAME=with

if [ -z "$MODE" ] || [ -z "$WINDOW" ] || [ -z "$WORKSPACE" ]; then
  echo "usage: demo/shoot.sh before|after <cmux-window-id> <cmux-workspace-ref>"
  exit 1
fi

cmux resize-window --window $WINDOW --width $WIDTH --height $HEIGHT >/dev/null
cmux send-key --workspace $WORKSPACE ctrl+c >/dev/null
cmux send-key --workspace $WORKSPACE ctrl+c >/dev/null
sleep 1
cmux send --workspace $WORKSPACE "sh $REPO/demo/open.sh $MODE" >/dev/null
cmux send-key --workspace $WORKSPACE Enter >/dev/null
sleep 5

REGION="$SIDEBAR,$TAB_BAR,$((WIDTH - SIDEBAR)),$((HEIGHT - TAB_BAR - FOOTER))"
cmux shot --window "$WINDOW" --region "$REGION" --out "$REPO/docs/$NAME.png"
python3 "$REPO/demo/trim.py" "$REPO/docs/$NAME.png"
[ "$MODE" = "after" ] && python3 "$REPO/demo/hero.py" "$REPO/docs"
