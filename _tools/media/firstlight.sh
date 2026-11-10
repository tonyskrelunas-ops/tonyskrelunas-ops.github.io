#!/usr/bin/env bash
# firstlight.sh — turn a raw clip into a web-ready, early-morning ("first light") loop.
# One look for every clip on the site: cool shadows, a warm first-light edge in the highlights,
# real contrast (not a flat blue wash), soft bloom, fine grain. Makes a seamless loop and a poster.
#
#   _tools/media/firstlight.sh IN.mp4 OUT_BASENAME [options]
#     --look dawn|deepdawn|day|lift|keep   dawn = cool early morning (default); deepdawn = the same, darker; day = neutral daylight polish;
#                            lift = put contrast back into a clip that was already graded flat; keep = no colour change
#     --slow N               slow-motion factor with motion interpolation (default 1 = real speed)
#     --loop xfade|pingpong|none   xfade = dissolve the end into the start (water); pingpong = forward then back (light, leaves)
#     --size WxH             output size (default: same as input, never upscaled)
#     --crf N                quality, lower is better (default 24)
#     --grain                bake fine film grain into the file (bigger file; the site adds grain itself, so usually leave off)
#     --from S --to S        use only this part of the source, in seconds
#
# Writes OUT_BASENAME.mp4 (H.264, plays everywhere) and OUT_BASENAME-poster.jpg.
set -euo pipefail
in="$1"; out="$2"; shift 2
look=dawn; slow=1; loop=xfade; size=""; crf=24; from=""; to=""; grain=""
while [ $# -gt 0 ]; do case "$1" in
  --look) look="$2"; shift 2;; --slow) slow="$2"; shift 2;; --loop) loop="$2"; shift 2;;
  --size) size="$2"; shift 2;; --grain) grain=",noise=alls=5:allf=t"; shift;; --crf) crf="$2"; shift 2;; --from) from="$2"; shift 2;; --to) to="$2"; shift 2;;
  *) echo "unknown option $1" >&2; exit 2;; esac; done

case "$look" in
  dawn) grade="eq=brightness=-0.07:contrast=1.06:saturation=0.78,curves=r='0/0 0.3/0.22 0.7/0.70 1/0.97':g='0/0.01 0.3/0.26 0.7/0.71 1/0.97':b='0/0.05 0.3/0.33 0.7/0.72 1/0.93'";;
  deepdawn) grade="eq=brightness=-0.13:contrast=1.08:saturation=0.70,curves=r='0/0 0.3/0.21 0.7/0.68 1/0.95':g='0/0.01 0.3/0.25 0.7/0.70 1/0.96':b='0/0.05 0.3/0.33 0.7/0.72 1/0.94'";;
  day)  grade="eq=contrast=1.05:saturation=0.94,curves=r='0/0 0.5/0.51 1/1':b='0/0.02 0.5/0.49 1/0.97'";;
  lift) grade="eq=contrast=1.22:brightness=0.03:saturation=1.08,curves=r='0/0 0.7/0.74 1/1':b='0/0 0.7/0.68 1/0.95'";;
  keep) grade="null";;
  *) echo "unknown look $look" >&2; exit 2;; esac
finish="format=gbrp,split[fa][fb];[fb]gblur=sigma=18[fbl];[fa][fbl]blend=all_mode=screen:all_opacity=0.20,vignette=PI/5${grain},format=yuv420p"   # blend in RGB: blending YUV planes tints highlights purple

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
trim=(); [ -n "$from" ] && trim+=(-ss "$from"); [ -n "$to" ] && trim+=(-to "$to")
pre="fps=30"; [ -n "$size" ] && pre="$pre,scale=${size/x/:}:flags=lanczos"
if [ "$slow" != "1" ]; then pre="$pre,setpts=${slow}*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"; fi
ffmpeg -v error -y ${trim[@]+"${trim[@]}"} -i "$in" -an -vf "$pre,$grade,$finish" -c:v libx264 -crf 14 -preset fast "$tmp/a.mp4"
L=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp/a.mp4")
case "$loop" in
  xfade)
    X=1.2; off=$(python3 -c "print(round($L-2*$X,3))")
    ffmpeg -v error -y -i "$tmp/a.mp4" -filter_complex "[0]trim=start=$X,setpts=PTS-STARTPTS[m];[0]trim=end=$X,setpts=PTS-STARTPTS[h];[m][h]xfade=transition=fade:duration=$X:offset=$off,format=yuv420p" -c:v libx264 -crf "$crf" -preset slow -maxrate 4500k -bufsize 9000k -movflags +faststart "$out.mp4";;
  pingpong)
    ffmpeg -v error -y -i "$tmp/a.mp4" -filter_complex "[0]split[f][r0];[r0]reverse[r];[f][r]concat=n=2:v=1,format=yuv420p" -c:v libx264 -crf "$crf" -preset slow -maxrate 4500k -bufsize 9000k -movflags +faststart "$out.mp4";;
  none)
    ffmpeg -v error -y -i "$tmp/a.mp4" -c:v libx264 -crf "$crf" -preset slow -maxrate 4500k -bufsize 9000k -movflags +faststart "$out.mp4";;
esac
ffmpeg -v error -y -ss 0.5 -i "$out.mp4" -frames:v 1 -q:v 3 "$out-poster.jpg"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height:format=duration,size -of csv=p=0 "$out.mp4" | tr '\n' ' '; echo " $out.mp4"
