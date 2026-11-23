#!/bin/sh
REPO=$(cd "$(dirname "$0")/.." && pwd)
DOCS="$REPO/docs"
WORK=/tmp/pi-legible-demo
HALF_WIDTH=800
TRIM_START=2.6
TRIM_END=12
HOLD=3
BAR=64

mkdir -p "$WORK"
python3 "$REPO/demo/labels.py" "$WORK" $HALF_WIDTH $BAR

PANE="trim=$TRIM_START:$TRIM_END,setpts=PTS-STARTPTS,scale=$HALF_WIDTH:-2,tpad=stop_mode=clone:stop_duration=$HOLD"
ffmpeg -loglevel error -y \
  -i "$DOCS/raw-without.mp4" \
  -i "$DOCS/raw-with.mp4" \
  -loop 1 -i "$WORK/label-without.png" \
  -loop 1 -i "$WORK/label-with.png" \
  -filter_complex "[0:v]$PANE[a];[1:v]$PANE[b];[2:v][a]vstack=2:shortest=1[la];[3:v][b]vstack=2:shortest=1[lb];[la][lb]hstack=2,pad=iw+6:ih:3:0:color=0x000000[v]" \
  -map "[v]" -r 24 -c:v libx264 -pix_fmt yuv420p -crf 26 -preset slow -movflags +faststart -an \
  "$DOCS/demo.mp4"

ffmpeg -loglevel error -y -i "$DOCS/demo.mp4" -vf "fps=12,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=none:diff_mode=rectangle" -loop 0 "$DOCS/demo.gif"
ls -la "$DOCS/demo.mp4" "$DOCS/demo.gif"
