/* Gearsmotortune Engine Background v4
 * WebP frame sequence + two-texture GPU crossfade.
 * The engine remains behind the page content; hero content stays in front
 * at 90% opacity so the background remains visible without washing out text.
 */
(() => {
  'use strict';

  const canvas = document.getElementById('gmt-engine-canvas');
  const stage = document.getElementById('gmt-engine-stage');
  if (!canvas || !stage) return;

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance'
  }) || canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance'
  });
  if (!gl) return;

  const FRAME_COUNT = 120;
  const BASE_PATH = 'engine-frames/';
  const PAD = 3;
  const EXT = 'webp';
  const SCROLL_EASE = 0.16;
  const PIXEL_RATIO = 1.35;

  /* Keep the visual hierarchy explicit: engine = background, page = foreground. */
  const style = document.createElement('style');
  style.id = 'gmt-engine-v4-style';
  style.textContent = `
    #gmt-engine-stage { position:sticky!important; top:0; isolation:isolate; overflow:hidden!important; background:#030405!important; }
    #gmt-engine-canvas { position:absolute!important; inset:0!important; width:100%!important; height:100%!important; z-index:0!important; display:block!important; opacity:1!important; pointer-events:none!important; }
    #gmt-engine-stage:before { z-index:1!important; background:radial-gradient(circle at 62% 50%,rgba(255,107,0,.055),transparent 38%),linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.34))!important; pointer-events:none!important; }
    #gmt-engine-stage:after { z-index:2!important; background:linear-gradient(90deg,rgba(0,0,0,.74),rgba(0,0,0,.18) 44%,rgba(0,0,0,.06) 100%),linear-gradient(0deg,rgba(0,0,0,.34),transparent 48%,rgba(0,0,0,.08))!important; pointer-events:none!important; }
    #gmt-engine-stage .gmt-engine-content { position:absolute!important; inset:0!important; z-index:5!important; opacity:.90!important; pointer-events:none!important; }
    #gmt-engine-stage .gmt-engine-content > * { pointer-events:auto; }
    #gmt-engine-stage .gmt-engine-scroll-label,
    #gmt-engine-stage .gmt-engine-progress,
    #gmt-engine-stage .gmt-engine-status { z-index:6!important; }
    header { z-index:1000!important; opacity:.90; }
  `;
  document.head.appendChild(style);

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
    uniform sampler2D u_a;
    uniform sampler2D u_b;
    uniform float u_mix;
    uniform vec2 u_canvas;
    uniform vec2 u_image;

    void main(){
      float cr = u_canvas.x / max(u_canvas.y, 1.0);
      float ir = u_image.x / max(u_image.y, 1.0);
      vec2 cover = vec2(1.0);
      if (ir > cr) cover.x = ir / cr;
      else cover.y = cr / ir;

      // Slight enlargement makes the engine itself dominant while preserving
      // the original composition inside the source WebP frames.
      float zoom = 1.045;
      vec2 uv = (v_uv - 0.5) * cover / zoom + 0.5;
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

      vec2 t = vec2(uv.x, 1.0 - uv.y);
      vec4 a = texture2D(u_a, t);
      vec4 b = texture2D(u_b, t);
      gl_FragColor = mix(a, b, u_mix);
    }
  `;

  function compile(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vertexSource);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1, 1,-1, -1,1,
    -1,1, 1,-1, 1,1
  ]), gl.STATIC_DRAW);
  const aPosition = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0,0, 1,0, 0,1,
    0,1, 1,0, 1,1
  ]), gl.STATIC_DRAW);
  const aUv = gl.getAttribLocation(program, 'a_uv');
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

  const textures = [gl.createTexture(), gl.createTexture()];
  textures.forEach(t => {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  });

  const uA = gl.getUniformLocation(program, 'u_a');
  const uB = gl.getUniformLocation(program, 'u_b');
  const uMix = gl.getUniformLocation(program, 'u_mix');
  const uCanvas = gl.getUniformLocation(program, 'u_canvas');
  const uImage = gl.getUniformLocation(program, 'u_image');
  gl.uniform1i(uA, 0);
  gl.uniform1i(uB, 1);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const images = new Map();
  const pending = new Map();
  let target = 0;
  let current = 0;
  let pairA = -1;
  let pairB = -1;
  let imageW = 1920;
  let imageH = 1080;
  let raf = 0;
  let scrollQueued = false;

  const frameUrl = i => `${BASE_PATH}frame_${String(i + 1).padStart(PAD, '0')}_converted.${EXT}`;

  function loadFrame(index, priority = false) {
    if (index < 0 || index >= FRAME_COUNT) return Promise.resolve(null);
    if (images.has(index)) return Promise.resolve(images.get(index));
    if (pending.has(index)) return pending.get(index);

    const promise = new Promise(resolve => {
      const img = new Image();
      img.decoding = 'async';
      img.fetchPriority = priority ? 'high' : 'low';
      img.onload = () => {
        images.set(index, img);
        pending.delete(index);
        resolve(img);
      };
      img.onerror = () => {
        pending.delete(index);
        console.warn('Gearsmotortune: failed to load', frameUrl(index));
        resolve(null);
      };
      img.src = frameUrl(index);
    });
    pending.set(index, promise);
    return promise;
  }

  function warmWindow(center) {
    const base = Math.floor(center);
    for (let d = -7; d <= 9; d++) {
      const i = base + d;
      if (i >= 0 && i < FRAME_COUNT) loadFrame(i, Math.abs(d) <= 1);
    }
  }

  function upload(slot, img, index) {
    if (!img) return;
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, textures[slot]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    if (slot === 0) pairA = index;
    else pairB = index;
  }

  function draw() {
    const f = Math.max(0, Math.min(FRAME_COUNT - 1, current));
    const aIndex = Math.floor(f);
    const bIndex = Math.min(FRAME_COUNT - 1, aIndex + 1);
    const mix = f - aIndex;
    const a = images.get(aIndex);
    const b = images.get(bIndex) || a;
    if (!a || !b) return;

    if (pairA !== aIndex) upload(0, a, aIndex);
    if (pairB !== bIndex) upload(1, b, bIndex);

    imageW = a.naturalWidth || imageW;
    imageH = a.naturalHeight || imageH;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uCanvas, canvas.clientWidth, canvas.clientHeight);
    gl.uniform2f(uImage, imageW, imageH);
    gl.uniform1f(uMix, mix);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, PIXEL_RATIO);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    draw();
  }

  function setTarget() {
    const r = stage.getBoundingClientRect();
    const travel = Math.max(1, stage.parentElement.offsetHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, -r.top / travel));
    // Keep the first and last states calm, with the main movement through the middle.
    const eased = p * p * (3 - 2 * p);
    target = eased * (FRAME_COUNT - 1);
    warmWindow(target);
  }

  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      setTarget();
      scrollQueued = false;
    });
  }

  function tick() {
    current += (target - current) * SCROLL_EASE;
    if (Math.abs(target - current) < 0.003) current = target;
    draw();
    raf = requestAnimationFrame(tick);
  }

  async function start() {
    // First paint: only the first few frames. The rest are requested around scroll.
    await Promise.all([0,1,2,3,4,5,6,7].map(i => loadFrame(i, true)));
    stage.classList.add('gmt-engine-ready');
    resize();
    warmWindow(0);
    tick();
  }

  window.addEventListener('resize', resize, {passive:true});
  window.addEventListener('scroll', onScroll, {passive:true});
  setTarget();
  start();
  window.addEventListener('pagehide', () => cancelAnimationFrame(raf), {once:true});
})();
