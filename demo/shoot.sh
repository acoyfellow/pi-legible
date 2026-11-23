#!/bin/sh
MODE="$1"
WINDOW=A9ECC026-CF32-48AD-A2E5-6C8FE3DAB504
WORKSPACE=workspace:1000040055
REPO=/Users/jcoeyman/cloudflare/pi-legible
WIDTH=1000
HEIGHT=1040
SIDEBAR=236
TAB_BAR=60
FOOTER=170

cmux resize-window --window $WINDOW --width $WIDTH --height $HEIGHT >/dev/null
cmux send-key --workspace $WORKSPACE ctrl+c >/dev/null
cmux send-key --workspace $WORKSPACE ctrl+c >/dev/null
sleep 1
cmux send --workspace $WORKSPACE "sh $REPO/demo/open.sh $MODE" >/dev/null
cmux send-key --workspace $WORKSPACE Enter >/dev/null
sleep 5

REGION="$SIDEBAR,$TAB_BAR,$((WIDTH - SIDEBAR)),$((HEIGHT - TAB_BAR - FOOTER))"
cmux shot --window $WINDOW --region "$REGION" --out "$REPO/docs/$MODE.png"
