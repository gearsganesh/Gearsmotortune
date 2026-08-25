/* Gearsmotortune Engine Scroll Experience
 * High-resolution PNG sequence -> WebGL canvas -> GSAP ScrollTrigger.
 * Frames are blended between adjacent positions so the scroll feels fluid
 * instead of jumping from PNG to PNG.
 */
(() => {
  'use strict';

  const FRAME_COUNT = 20;
  const FRAME_PATH = (i) => `/engine-frames/frame_${String(i).padStart(3, '0')}.png`;
  const HERO_ID = 'home';
  const CANVAS_ID = 'gmt-engine-canvas';
  const LOADER_ID = 'gmt-engine-loader';

  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      const wait = () => window.gsap && window.ScrollTrigger ? resolve() : setTimeout(wait, 25);
      wait();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

  function addStyles() {
    if (document.getElementById('gmt-engine-scroll-style')) return;
    const style = document.createElement('style');
    style.id = 'gmt-engine-scroll-style';
    style.textContent = `
      #${CANVAS_ID}{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;display:block;pointer-events:none;background:#070809}
      #${HERO_ID}{min-height:520vh!important;background:transparent!important;position:relative;isolation:isolate}
      #${HERO_ID}:after{z-index:1!important;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)!important;background-size:48px 48px!important;background-color:rgba(0,0,0,.12)}
      #${HERO_ID} .hero-content{position:sticky!important;top:0;min-height:100vh;height:100vh;display:flex;flex-direction:column;justify-content:center;padding-top:76px!important;z-index:3}
      #${HERO_ID} .scroll-cue{position:sticky;bottom:28px;z-index:4;width:max-content;margin-top:-70px}
      #${HERO_ID} .hero-content>*{text-shadow:0 2px 16px rgba(0,0,0,.5)}
      .gmt-engine-vignette{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at center,transparent 32%,rgba(0,0,0,.56) 100%)}
      #${LOADER_ID}{position:fixed;inset:0;z-index:10002;display:grid;place-items:center;background:#000;color:#fff;transition:opacity .5s ease,visibility .5s ease}
      #${LOADER_ID}.done{opacity:0;visibility:hidden;pointer-events:none}
      .gmt-loader-box{width:min(420px,82vw);text-align:center}
      .gmt-loader-title{font:800 18px/1.1 Inter,Arial,sans-serif;letter-spacing:2px;text-transform:uppercase}
      .gmt-loader-sub{margin-top:9px;color:#8f9aa3;font:500 11px/1.4 Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase}
      .gmt-loader-track{height:3px;margin-top:24px;background:#202326;overflow:hidden}
      .gmt-loader-fill{height:100%;width:0;background:#ff6b00;transition:width .12s linear}
      .gmt-loader-percent{margin-top:10px;color:#ff6b00;font:700 11px/1 Inter,Arial,sans-serif;letter-spacing:1px}
      @media(max-width:600px){#${HERO_ID}{min-height:420vh!important}#${HERO_ID} .hero-content{padding-top:76px!important}.gmt-engine-vignette{background:radial-gradient(ellipse at center,transparent 27%,rgba(0,0,0,.62) 100%)}}
      @media(prefers-reduced-motion:reduce){#${HERO_ID}{min-height:100vh!important}}
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    const canvas = document.createElement('canvas');
    canvas.id = CANVAS_ID;
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const vignette = document.createElement('div');
    vignette.className = 'gmt-engine-vignette';
    document.body.appendChild(vignette);

    const loader = document.createElement('div');
    loader.id = LOADER_ID;
    loader.innerHTML = `
      <div class="gmt-loader-box">
        <div class="gmt-loader-title">Loading Engineering Sequence</div>
        <div class="gmt-loader-sub">Preparing high-resolution engine frames</div>
        <div class="gmt-loader-track"><div class="gmt-loader-fill"></div></div>
        <div class="gmt-loader-percent">0%</div>
      </div>`;
    document.body.appendChild(loader);
    return { canvas, loader };
  }

  function createGL(canvas) {
    const gl = canvas.getContext('webgl', {alpha:false,antialias:false,premultipliedAlpha:false}) || canvas.getContext('experimental-webgl', {alpha:false,antialias:false});
    if (!gl) return null;

    const vs = `attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.0,1.0);}`;
    const fs = `precision mediump float;
      uniform sampler2D u_textureA;
      uniform sampler2D u_textureB;
      uniform vec2 u_scale;
      uniform float u_mix;
      varying vec2 v_uv;
      void main(){
        vec2 uv=(v_uv-.5)*u_scale+.5;
        vec4 a=texture2D(u_textureA,uv);
        vec4 b=texture2D(u_textureB,uv);
        gl_FragColor=mix(a,b,u_mix);
      }`;

    function compile(type, source){
      const shader=gl.createShader(type);
      gl.shaderSource(shader,source);
      gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    }

    const program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);

    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);

    const textureA=gl.createTexture();
    const textureB=gl.createTexture();
    [textureA,textureB].forEach(texture=>{
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    });

    const scaleLoc=gl.getUniformLocation(program,'u_scale');
    const mixLoc=gl.getUniformLocation(program,'u_mix');
    const texALoc=gl.getUniformLocation(program,'u_textureA');
    const texBLoc=gl.getUniformLocation(program,'u_textureB');
    gl.uniform1i(texALoc,0);
    gl.uniform1i(texBLoc,1);

    let frameW=1920,frameH=1080;
    let readyA=false,readyB=false;
    let uploadedA=-1,uploadedB=-1;

    function resize(){
      const dpr=Math.min(window.devicePixelRatio||1,1.5);
      canvas.width=Math.round(innerWidth*dpr);
      canvas.height=Math.round(innerHeight*dpr);
      gl.viewport(0,0,canvas.width,canvas.height);
      const viewportRatio=innerWidth/innerHeight;
      const imageRatio=frameW/frameH;
      let sx=1,sy=1;
      if(viewportRatio>imageRatio) sy=imageRatio/viewportRatio;
      else sx=viewportRatio/imageRatio;
      gl.useProgram(program);
      gl.uniform2f(scaleLoc,sx,sy);
    }

    function uploadTo(texture,image,unit){
      frameW=image.naturalWidth||image.width||1920;
      frameH=image.naturalHeight||image.height||1080;
      gl.activeTexture(unit);
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      resize();
    }

    function ensureFrame(slot,image,index){
      if(!image) return;
      if(slot==='A' && uploadedA!==index){ uploadTo(textureA,image,gl.TEXTURE0); uploadedA=index; readyA=true; }
      if(slot==='B' && uploadedB!==index){ uploadTo(textureB,image,gl.TEXTURE1); uploadedB=index; readyB=true; }
    }

    function draw(mix){
      if(!readyA) return;
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textureA);
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,textureB);
      gl.uniform1f(mixLoc,readyB?Math.max(0,Math.min(1,mix)):0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }

    addEventListener('resize',resize,{passive:true});
    resize();
    return {ensureFrame,draw};
  }

  async function preloadFrames(loader){
    const images=new Array(FRAME_COUNT);
    const fill=loader.querySelector('.gmt-loader-fill');
    const percent=loader.querySelector('.gmt-loader-percent');
    let loaded=0;
    const loadOne=(i)=>new Promise(resolve=>{
      const img=new Image();
      img.decoding='async';
      img.onload=()=>{
        images[i-1]=img;
        loaded++;
        const p=Math.round(loaded/FRAME_COUNT*100);
        fill.style.width=p+'%';
        percent.textContent=p+'%';
        resolve();
      };
      img.onerror=()=>{
        console.warn('Gearsmotortune: missing frame',i);
        loaded++;
        const p=Math.round(loaded/FRAME_COUNT*100);
        fill.style.width=p+'%';
        percent.textContent=p+'%';
        resolve();
      };
      img.src=FRAME_PATH(i);
    });
    const workers=Array.from({length:5},async(_,w)=>{
      for(let i=w+1;i<=FRAME_COUNT;i+=5) await loadOne(i);
    });
    await Promise.all(workers);
    return images;
  }

  async function init(){
    const hero=document.getElementById(HERO_ID);
    if(!hero)return;
    addStyles();
    const {canvas,loader}=createUI();

    try{
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js');

      const gl=createGL(canvas);
      if(!gl)throw new Error('WebGL unavailable');

      const frames=await preloadFrames(loader);
      const validFrames=frames.filter(Boolean);
      if(!validFrames.length)throw new Error('No engine frames loaded');

      gl.ensureFrame('A',validFrames[0],0);
      gl.ensureFrame('B',validFrames[1]||validFrames[0],1);
      gl.draw(0);
      loader.classList.add('done');

      gsap.registerPlugin(ScrollTrigger);
      const state={frame:0};
      let lastA=0,lastB=1;
      let rafPending=false;

      const render=()=>{
        rafPending=false;
        const max=validFrames.length-1;
        const value=Math.max(0,Math.min(max,state.frame));
        const a=Math.floor(value);
        const b=Math.min(max,a+1);
        const mix=value-a;

        if(a!==lastA){
          gl.ensureFrame('A',validFrames[a],a);
          lastA=a;
        }
        if(b!==lastB){
          gl.ensureFrame('B',validFrames[b],b);
          lastB=b;
        }
        gl.draw(mix);
      };

      gsap.to(state,{
        frame:validFrames.length-1,
        ease:'none',
        scrollTrigger:{
          trigger:hero,
          start:'top top',
          end:'bottom bottom',
          scrub:0.45,
          invalidateOnRefresh:true,
          onUpdate:()=>{
            if(!rafPending){
              rafPending=true;
              requestAnimationFrame(render);
            }
          }
        }
      });

      ScrollTrigger.refresh();
      render();
    }catch(err){
      console.error('Gearsmotortune engine background failed:',err);
      loader.querySelector('.gmt-loader-title').textContent='Engine background unavailable';
      loader.querySelector('.gmt-loader-sub').textContent='The website itself remains fully functional.';
      setTimeout(()=>loader.classList.add('done'),1200);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
