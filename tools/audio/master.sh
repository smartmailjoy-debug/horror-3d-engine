#!/bin/bash
# vo_mix + fx_mix -> master.m4a (~ -15 LUFS, peak < -0.5 dBFS)
P=engine/public/t13
ffmpeg -v error -y -i $P/vo_mix.wav -i $P/fx_mix.wav -filter_complex "[0][1]amix=inputs=2:normalize=0,alimiter=limit=0.89:level=false,loudnorm=I=-14:TP=-2:LRA=11,alimiter=limit=0.9:level=false" -ar 48000 -c:a aac -b:a 256k $P/master.m4a
ffmpeg -hide_banner -i $P/master.m4a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|Peak:" | tail -2
