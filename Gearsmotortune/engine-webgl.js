/* Gearsmotortune WebGL engine background.
 * 20-frame WebP sequence, GPU crossfade, scroll-scrubbed behind the original hero content.
 */
(() => {
  'use strict';
  const canvas=document.getElementById('gmt-engine-canvas');
  const stage=document.getElementById('gmt-engine-stage');
  if(!canvas||!stage)return;
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'high-performance'})||canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'high-performance'});
  if(!gl)return;

  const FRAME_COUNT=20;
  const BASE_PATH='Engine-frames/';
  const PAD=3;
  const EXT='webp';
  const SCROLL_EASE=.16;
  const PIXEL_RATIO=1.35;

  const vertexSource='attribute vec2 a_position;attribute vec2 a_uv;varying vec2 v_uv;void main(){v_uv=a_uv;gl_Position=vec4(a_position,0.0,1.0);}';
  const fragmentSource='precision mediump float;varying vec2 v_uv;uniform sampler2D u_a;uniform sampler2D u_b;uniform float u_mix;uniform vec2 u_canvas;uniform vec2 u_image;void main(){float cr=u_canvas.x/max(u_canvas.y,1.0);float ir=u_image.x/max(u_image.y,1.0);vec2 cover=vec2(1.0);if(ir>cr)cover.x=ir/cr;else cover.y=cr/ir;vec2 uv=(v_uv-.5)*cover+.5;if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)discard;vec2 t=vec2(uv.x,1.0-uv.y);vec4 a=texture2D(u_a,t);vec4 b=texture2D(u_b,t);gl_FragColor=mix(a,b,u_mix);}';

  function compile(type,source){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(shader));gl.deleteShader(shader);return null}
    return shader;
  }

  const vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
  if(!vs||!fs)return;
  const program=gl.createProgram();
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  gl.useProgram(program);

  const positionBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const aPosition=gl.getAttribLocation(program,'a_position');
  gl.enableVertexAttribArray(aPosition);gl.vertexAttribPointer(aPosition,2,gl.FLOAT,false,0,0);

  const uvBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);
  const aUv=gl.getAttribLocation(program,'a_uv');
  gl.enableVertexAttribArray(aUv);gl.vertexAttribPointer(aUv,2,gl.FLOAT,false,0,0);

  const textures=[gl.createTexture(),gl.createTexture()];
  textures.forEach(texture=>{
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  });

  const uA=gl.getUniformLocation(program,'u_a'),uB=gl.getUniformLocation(program,'u_b'),uMix=gl.getUniformLocation(program,'u_mix'),uCanvas=gl.getUniformLocation(program,'u_canvas'),uImage=gl.getUniformLocation(program,'u_image');
  gl.uniform1i(uA,0);gl.uniform1i(uB,1);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

  const images=new Map(),pending=new Map();
  let target=0,current=0,pairA=-1,pairB=-1,imageW=1920,imageH=1080,raf=0,scrollQueued=false;
  const frameUrl=i=>`${BASE_PATH}frame_${String(i+1).padStart(PAD,'0')}_converted.${EXT}`;

  function loadFrame(index,priority=false){
    if(index<0||index>=FRAME_COUNT)return Promise.resolve(null);
    if(images.has(index))return Promise.resolve(images.get(index));
    if(pending.has(index))return pending.get(index);
    const promise=new Promise(resolve=>{
      const img=new Image();
      img.decoding='async';
      try{img.fetchPriority=priority?'high':'low'}catch(e){}
      img.onload=()=>{images.set(index,img);pending.delete(index);resolve(img)};
      img.onerror=()=>{pending.delete(index);console.warn('Gearsmotortune: failed to load',frameUrl(index));resolve(null)};
      img.src=frameUrl(index);
    });
    pending.set(index,promise);return promise;
  }

  function warmWindow(center){
    const base=Math.floor(center);
    for(let d=-5;d<=6;d++){
      const index=base+d;
      if(index>=0&&index<FRAME_COUNT)loadFrame(index,Math.abs(d)<=1);
    }
  }

  function upload(slot,img,index){
    if(!img)return;
    gl.activeTexture(gl.TEXTURE0+slot);
    gl.bindTexture(gl.TEXTURE_2D,textures[slot]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    if(slot===0)pairA=index;else pairB=index;
  }

  function draw(){
    const frame=Math.max(0,Math.min(FRAME_COUNT-1,current));
    const aIndex=Math.floor(frame);
    const bIndex=Math.min(FRAME_COUNT-1,aIndex+1);
    const mix=frame-aIndex;
    const a=images.get(aIndex),b=images.get(bIndex)||a;
    if(!a||!b)return;
    if(pairA!==aIndex)upload(0,a,aIndex);
    if(pairB!==bIndex)upload(1,b,bIndex);
    imageW=a.naturalWidth||imageW;imageH=a.naturalHeight||imageH;
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uCanvas,canvas.clientWidth,canvas.clientHeight);
    gl.uniform2f(uImage,imageW,imageH);
    gl.uniform1f(uMix,mix);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }

  function resize(){
    const dpr=Math.min(window.devicePixelRatio||1,PIXEL_RATIO);
    const w=Math.max(1,Math.floor(canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    draw();
  }

  function setTarget(){
    const scrollArea=stage.parentElement;
    const rect=scrollArea.getBoundingClientRect();
    const travel=Math.max(1,scrollArea.offsetHeight-window.innerHeight);
    const progress=Math.min(1,Math.max(0,-rect.top/travel));
    const eased=progress*progress*(3-2*progress);
    target=eased*(FRAME_COUNT-1);
    warmWindow(target);
  }

  function onScroll(){
    if(scrollQueued)return;
    scrollQueued=true;
    requestAnimationFrame(()=>{setTarget();scrollQueued=false});
  }

  function tick(){
    current+=(target-current)*SCROLL_EASE;
    if(Math.abs(target-current)<.003)current=target;
    draw();
    raf=requestAnimationFrame(tick);
  }

  async function start(){
    await Promise.all([0,1,2,3,4,5,6,7].map(index=>loadFrame(index,true)));
    resize();
    warmWindow(0);
    tick();
  }

  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('scroll',onScroll,{passive:true});
  setTarget();
  start();
  window.addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
})();
