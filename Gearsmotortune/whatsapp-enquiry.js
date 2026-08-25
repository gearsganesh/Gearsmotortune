(() => {
  const WHATSAPP_NUMBER = '918072432675';
  const FRAME_COUNT = 120;
  const FRAME_BASE = '/engine-frames/frame_';
  const FRAME_EXT = '.webp';
  const FRAME_WIDTH = 720;
  const FRAME_HEIGHT = 405;

  function prettyLabel(name) {
    return String(name || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, ch => ch.toUpperCase())
      .trim();
  }

  function showStatus(form, message, isError = false) {
    const status = form.querySelector('.form-status') || document.getElementById('formStatus');
    if (!status) return;
    status.textContent = message;
    status.className = `form-status ${isError ? 'error' : 'success'}`;
    status.style.display = 'block';
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function addWebGLStyles() {
    if (document.getElementById('gmt-webgl-styles')) return;
    const style = document.createElement('style');
    style.id = 'gmt-webgl-styles';
    style.textContent = `
      html, body { background:#000 !important; }
      body { position:relative; }
      #gmt-engine-canvas {
        position:fixed !important; inset:0 !important;
        width:100vw !important; height:100vh !important;
        display:block !important; z-index:0 !important;
        pointer-events:none !important;
      }
      #gmt-engine-loader {
        position:fixed; inset:0; z-index:2000; display:grid; place-items:center;
        background:#000; transition:opacity .6s ease, visibility .6s ease;
        font-family:Inter,Arial,sans-serif;
      }
      #gmt-engine-loader.gmt-loaded { opacity:0; visibility:hidden; pointer-events:none; }
      .gmt-loader-inner { width:min(360px,72vw); text-align:center; }
      .gmt-loader-kicker { color:#ff6b00; font-size:11px; letter-spacing:3px; font-weight:800; text-transform:uppercase; margin-bottom:16px; }
      .gmt-loader-track { height:3px; background:rgba(255,255,255,.12); overflow:hidden; }
      .gmt-loader-bar { height:100%; width:0; background:#ff6b00; box-shadow:0 0 18px rgba(255,107,0,.7); transition:width .15s ease; }
      .gmt-loader-percent { color:#88929b; font-size:11px; letter-spacing:1px; margin-top:10px; }
      .gmt-webgl-ready .hero {
        min-height:400vh !important;
        align-items:flex-start !important;
        background:transparent !important;
        background-image:none !important;
      }
      .gmt-webgl-ready .hero-content {
        position:sticky !important; top:0 !important;
        min-height:100vh; padding-top:110px !important;
        display:flex; flex-direction:column; justify-content:center;
        z-index:3 !important;
      }
      .gmt-webgl-ready .grid-bg { background-color:rgba(7,8,9,.78) !important; }
      .gmt-webgl-ready main, .gmt-webgl-ready section, .gmt-webgl-ready footer { position:relative; z-index:1; }
      .gmt-webgl-ready header { z-index:1000 !important; }
      .gmt-webgl-ready .hero:after { z-index:1; }
      @media (max-width:700px) {
        .gmt-webgl-ready .hero { min-height:300vh !important; }
        .gmt-webgl-ready .hero-content { padding-top:95px !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        #gmt-engine-canvas { opacity:.45; }
      }
    `;
    document.head.appendChild(style);
  }

  function addLoader() {
    if (document.getElementById('gmt-engine-loader')) return;
    const loader = document.createElement('div');
    loader.id = 'gmt-engine-loader';
    loader.innerHTML = `
      <div class="gmt-loader-inner">
        <div class="gmt-loader-kicker">Loading engineering sequence</div>
        <div class="gmt-loader-track"><div class="gmt-loader-bar" id="gmt-loader-bar"></div></div>
        <div class="gmt-loader-percent" id="gmt-loader-percent">0%</div>
      </div>`;
    document.body.appendChild(loader);
  }

  function updateLoader(done, total) {
    const bar = document.getElementById('gmt-loader-bar');
    const percent = document.getElementById('gmt-loader-percent');
    const value = Math.round((done / total) * 100);
    if (bar) bar.style.width = `${value}%`;
    if (percent) percent.textContent = `${value}%`;
  }

  function finishLoader() {
    const loader = document.getElementById('gmt-engine-loader');
    if (loader) loader.classList.add('gmt-loaded');
  }

  async function initWebGL() {
    addWebGLStyles();
    addLoader();

    try {
      await Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.min.js'),
        loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'),
        loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js')
      ]);
    } catch (error) {
      finishLoader();
      return;
    }

    if (!window.THREE || !window.gsap || !window.ScrollTrigger) {
      finishLoader();
      return;
    }

    const THREE = window.THREE;
    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    const canvas = document.createElement('canvas');
    canvas.id = 'gmt-engine-canvas';
    document.body.prepend(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uTextureSize: { value: new THREE.Vector2(FRAME_WIDTH, FRAME_HEIGHT) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uOpacity: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D uTexture;
        uniform vec2 uTextureSize;
        uniform vec2 uResolution;
        uniform float uOpacity;
        varying vec2 vUv;

        void main() {
          vec2 scale = uResolution / uTextureSize;
          float coverScale = max(scale.x, scale.y);
          vec2 scaled = uTextureSize * coverScale;
          vec2 offset = (scaled - uResolution) / (2.0 * scaled);
          vec2 uv = vUv * (uResolution / scaled) + offset;

          vec4 tex = texture2D(uTexture, uv);
          float lum = dot(tex.rgb, vec3(.2126, .7152, .0722));
          float keep = smoothstep(.025, .17, lum);
          vec3 chrome = mix(vec3(0.0), tex.rgb * 1.08, keep);

          float edge = smoothstep(1.12, .25, length(vUv - .5) * 1.25);
          chrome *= mix(.58, 1.0, edge);

          gl_FragColor = vec4(chrome, uOpacity);
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const images = new Array(FRAME_COUNT);
    const textures = new Array(FRAME_COUNT);
    let loaded = 0;

    const loadFrame = (index) => new Promise(resolve => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        images[index] = img;
        const texture = new THREE.Texture(img);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
        textures[index] = texture;
        loaded++;
        updateLoader(loaded, FRAME_COUNT);
        resolve(true);
      };
      img.onerror = () => {
        loaded++;
        updateLoader(loaded, FRAME_COUNT);
        resolve(false);
      };
      img.src = `${FRAME_BASE}${String(index + 1).padStart(4, '0')}${FRAME_EXT}`;
    });

    for (let start = 0; start < FRAME_COUNT; start += 8) {
      await Promise.all(Array.from({length: Math.min(8, FRAME_COUNT - start)}, (_, k) => loadFrame(start + k)));
    }

    const validTextures = textures.filter(Boolean);
    if (!validTextures.length) {
      canvas.remove();
      finishLoader();
      return;
    }

    document.body.classList.add('gmt-webgl-ready');
    material.uniforms.uTexture.value = validTextures[0];
    finishLoader();

    let currentFrame = 0;
    let targetFrame = 0;
    let lastTextureIndex = -1;

    function nearestValid(index) {
      if (textures[index]) return index;
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (index - d >= 0 && textures[index - d]) return index - d;
        if (index + d < FRAME_COUNT && textures[index + d]) return index + d;
      }
      return 0;
    }

    function setFrame(index) {
      const safe = nearestValid(Math.max(0, Math.min(FRAME_COUNT - 1, index)));
      if (safe === lastTextureIndex) return;
      material.uniforms.uTexture.value = textures[safe];
      material.uniforms.uTexture.value.needsUpdate = true;
      lastTextureIndex = safe;
    }

    window.ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: self => {
        targetFrame = self.progress * (FRAME_COUNT - 1);
      }
    });

    function tick() {
      currentFrame += (targetFrame - currentFrame) * 0.12;
      setFrame(Math.round(currentFrame));
      renderer.render(scene, camera);
    }
    gsap.ticker.add(tick);

    function resize() {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    window.addEventListener('pagehide', () => {
      gsap.ticker.remove(tick);
      textures.forEach(t => t && t.dispose());
      renderer.dispose();
    }, { once: true });
  }

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== 'enquiryForm' && form.id !== 'automotiveEnquiryForm') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(form);
    const lines = [
      'Hello Gearsmotortune, I would like to make an enquiry.',
      ''
    ];

    for (const [name, rawValue] of formData.entries()) {
      const value = String(rawValue).trim();
      if (!value || name === 'bot-field') continue;
      lines.push(`${prettyLabel(name)}: ${value}`);
    }

    const message = lines.join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    showStatus(form, 'WhatsApp is opening with your enquiry ready to send.');
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) window.location.href = url;
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWebGL, { once: true });
  } else {
    initWebGL();
  }
})();
