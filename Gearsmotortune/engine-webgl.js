/* Gearsmotortune scroll-scrubbed engine background.
 * Uses the actual frame assets in /engine-frames/ and renders them to a GPU canvas.
 * The frame count is discovered from the asset list below. Add/remove frames without
 * changing the renderer, as long as the numeric naming remains frame_###.png/webp.
 */
(() => {
  'use strict';

  const canvas = document.getElementById('gmt-engine-canvas');
  const stage = document.getElementById('gmt-engine-stage');
  if (!canvas || !stage) return;

  const ctx = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false })
    || canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!ctx) {
    canvas.style.display = 'none';
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frameCount = Number(stage.dataset.frames || 0);
  const basePath = stage.dataset.base || 'engine-frames/';
  const extension = stage.dataset.extension || 'png';
  const pad = Number(stage.dataset.pad || 3);

  if (!frameCount) return;

  const vertexSource = `
    attribute vec2 a_position;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main(){
      v_uv = a_uv;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_texture;
    uniform vec2 u_canvas;
    uniform vec2 u_image;
    uniform float u_alpha;

    void main(){
      // cover fit with a small automotive cinematic crop.
      float canvasRatio = u_canvas.x / max(u_canvas.y, 1.0);
      float imageRatio = u_image.x / max(u_image.y, 1.0);
      vec2 scale = vec2(1.0);
      if (imageRatio > canvasRatio) {
        scale.x = imageRatio / canvasRatio;
      } else {
        scale.y = canvasRatio / imageRatio;
      }
      vec2 uv = (v_uv - 0.5) * scale + 0.5;
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

      vec4 color = texture2D(u_texture, vec2(uv.x, 1.0 - uv.y));
      // Lift the dark background slightly while preserving the engine's metal highlights.
      float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      float vignette = smoothstep(0.9, 0.24, distance(v_uv, vec2(0.50)));
      vec3 graded = mix(color.rgb, color.rgb * 1.10, 0.25 + luminance * 0.25);
      graded *= mix(0.78, 1.0, vignette);
      gl_FragColor = vec4(graded, color.a * u_alpha);
    }
  `;

  function compile(type, source) {
    const shader = ctx.createShader(type);
    ctx.shaderSource(shader, source);
    ctx.compileShader(shader);
    if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
      console.error(ctx.getShaderInfoLog(shader));
      ctx.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vs = compile(ctx.VERTEX_SHADER, vertexSource);
  const fs = compile(ctx.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return;

  const program = ctx.createProgram();
  ctx.attachShader(program, vs);
  ctx.attachShader(program, fs);
  ctx.linkProgram(program);
  if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) return;
  ctx.useProgram(program);

  const positionBuffer = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, positionBuffer);
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1, -1, 1,
    -1,  1,  1, -1,  1, 1
  ]), ctx.STATIC_DRAW);
  const aPosition = ctx.getAttribLocation(program, 'a_position');
  ctx.enableVertexAttribArray(aPosition);
  ctx.vertexAttribPointer(aPosition, 2, ctx.FLOAT, false, 0, 0);

  const uvBuffer = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, uvBuffer);
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([
    0, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 1
  ]), ctx.STATIC_DRAW);
  const aUv = ctx.getAttribLocation(program, 'a_uv');
  ctx.enableVertexAttribArray(aUv);
  ctx.vertexAttribPointer(aUv, 2, ctx.FLOAT, false, 0, 0);

  const texture = ctx.createTexture();
  ctx.bindTexture(ctx.TEXTURE_2D, texture);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);

  const uTexture = ctx.getUniformLocation(program, 'u_texture');
  const uCanvas = ctx.getUniformLocation(program, 'u_canvas');
  const uImage = ctx.getUniformLocation(program, 'u_image');
  const uAlpha = ctx.getUniformLocation(program, 'u_alpha');
  ctx.uniform1i(uTexture, 0);
  ctx.enable(ctx.BLEND);
  ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);

  const images = new Array(frameCount);
  let currentIndex = 0;
  let targetIndex = 0;
  let rafId = 0;
  let loaded = 0;
  let imageWidth = 720;
  let imageHeight = 405;

  function frameUrl(i) {
    const n = String(i + 1).padStart(pad, '0');
    return `${basePath}frame_${n}.${extension}`;
  }

  function draw(index) {
    const image = images[Math.round(index)];
    if (!image || !image.complete || !image.naturalWidth) return;

    imageWidth = image.naturalWidth;
    imageHeight = image.naturalHeight;

    ctx.viewport(0, 0, canvas.width, canvas.height);
    ctx.clearColor(0, 0, 0, 0);
    ctx.clear(ctx.COLOR_BUFFER_BIT);
    ctx.uniform2f(uCanvas, canvas.clientWidth, canvas.clientHeight);
    ctx.uniform2f(uImage, imageWidth, imageHeight);
    ctx.uniform1f(uAlpha, reducedMotion ? 0.82 : 0.98);

    ctx.activeTexture(ctx.TEXTURE0);
    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, image);
    ctx.drawArrays(ctx.TRIANGLES, 0, 6);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    if (images[Math.round(currentIndex)]) draw(currentIndex);
  }

  function animate() {
    const delta = targetIndex - currentIndex;
    if (Math.abs(delta) > 0.015) {
      // Critically damped-ish catch-up gives smooth bidirectional scroll scrubbing.
      currentIndex += delta * (reducedMotion ? 0.35 : 0.18);
      if (Math.abs(targetIndex - currentIndex) < 0.015) currentIndex = targetIndex;
      draw(currentIndex);
    }
    rafId = requestAnimationFrame(animate);
  }

  function setTargetFromScroll() {
    const rect = stage.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / travel));
    // Ease the timeline so most motion happens across the central portion of the scroll.
    const eased = progress * progress * (3 - 2 * progress);
    targetIndex = eased * (frameCount - 1);
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        setTargetFromScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  function loadFrame(index) {
    return new Promise(resolve => {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = frameUrl(index);
      img.onload = () => {
        images[index] = img;
        loaded += 1;
        if (index === 0) {
          currentIndex = targetIndex = 0;
          resize();
        }
        resolve();
      };
      img.onerror = () => resolve();
    });
  }

  // Load every frame, but stagger requests so initial rendering gets priority.
  async function preload() {
    const firstBatch = Math.min(frameCount, 12);
    await Promise.all(Array.from({ length: firstBatch }, (_, i) => loadFrame(i)));
    stage.classList.add('gmt-engine-ready');
    for (let i = firstBatch; i < frameCount; i += 4) {
      await Promise.all([
        loadFrame(i),
        i + 1 < frameCount ? loadFrame(i + 1) : Promise.resolve(),
        i + 2 < frameCount ? loadFrame(i + 2) : Promise.resolve(),
        i + 3 < frameCount ? loadFrame(i + 3) : Promise.resolve()
      ]);
    }
    draw(currentIndex);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  setTargetFromScroll();
  preload();
  animate();

  window.addEventListener('pagehide', () => cancelAnimationFrame(rafId), { once: true });
})();
