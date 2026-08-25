# WebGL Engine Frames

Place the supplied 120-frame WebP package in this folder as `frame_0001.webp` through `frame_0120.webp`.

The Vercel site loads these same-origin assets from `/engine-frames/` and preloads them before enabling scroll-driven playback.

Recommended generated set: 720x405 WebP, 120 frames sampled from source frames 0..220 of the supplied `videoplayback.mp4` so scroll-down reaches the exploded/disassembled state and scroll-up reverses it.
