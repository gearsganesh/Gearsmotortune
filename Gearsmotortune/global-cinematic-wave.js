/*
 * Gearsmotortune version of the Varadaraja Cinemas global cinematic wave.
 * Source: gearsganesh/Varadarajacinemas/assets/global-cinematic-wave.js
 * Palette adapted from Varadaraja GOLD to Gearsmotortune orange/amber.
 */
(function () {
  if (document.getElementById("gearsmotortune-cinematic-wave-canvas")) return;

  const canvas = document.createElement("canvas");
  canvas.id = "gearsmotortune-cinematic-wave-canvas";
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100vw", height: "100vh",
    zIndex: "1", pointerEvents: "none", display: "block"
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d", { alpha: true });
  let W = innerWidth, H = innerHeight;
  let dpr = Math.min(devicePixelRatio || 1, 1.5);
  const isMobile = matchMedia("(max-width:700px)").matches || matchMedia("(pointer:coarse)").matches;
  const reduced = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const pointer = { x:0, y:0, tx:0, ty:0, vx:0, vy:0 };
  let scrollY = window.scrollY || 0;
  let scrollVelocity = 0;
  let lastScroll = scrollY;

  function resizeCanvas() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, isMobile ? 1.15 : 1.5);
    canvas.width = Math.floor(W*dpr);
    canvas.height = Math.floor(H*dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resizeCanvas();
  addEventListener("resize", resizeCanvas, { passive:true });
  addEventListener("pointermove", e => {
    if (isMobile) return;
    pointer.tx = (e.clientX/W-.5)*2;
    pointer.ty = -(e.clientY/H-.5)*2;
  }, { passive:true });
  addEventListener("scroll", () => {
    const n = window.scrollY;
    scrollVelocity = Math.max(-50, Math.min(50, n-lastScroll));
    scrollY = n;
    lastScroll = n;
  }, { passive:true });

  function drawFallback(now) {
    const motion = reduced ? 0.12 : 1;
    const t = now * 0.00034 * motion;
    const dx = pointer.tx-pointer.x, dy = pointer.ty-pointer.y;
    pointer.x += dx*.075; pointer.y += dy*.075;
    pointer.vx = pointer.vx*.88 + dx*.18;
    pointer.vy = pointer.vy*.88 + dy*.18;
    ctx.clearRect(0,0,W,H);

    const glowColor="255,107,0", particleColor="255,162,74", dustColor="184,103,43";
    const gx=W*(.5+pointer.x*.11), gy=H*(.54-pointer.y*.10);
    const g=ctx.createRadialGradient(gx,gy,0,gx,gy,Math.max(W,H)*.70);
    g.addColorStop(0,`rgba(${glowColor},.11)`);
    g.addColorStop(.28,`rgba(${glowColor},.05)`);
    g.addColorStop(.62,`rgba(${glowColor},.014)`);
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    const cols=isMobile?40:92, rows=isMobile?30:56, centerY=H*.58;
    const scrollForce=Math.max(-1.6,Math.min(1.6,scrollVelocity*.045));
    for(let z=0;z<rows;z++){
      const depth=z/(rows-1), perspective=.18+.82*depth, yBase=centerY+(depth-.5)*H*.82;
      for(let x=0;x<cols;x++){
        const u=x/(cols-1)-.5;
        const px0=W*.5+u*W*1.48*perspective;
        const waveA=Math.sin(u*7.2+t*4.5+depth*3.8)*H*.050;
        const waveB=Math.sin(u*15.0-t*3.0-depth*7.0)*H*.023;
        const waveC=Math.cos((u*2.2+depth*1.7)*10+t*2.0)*H*.016;
        const travelling=Math.sin((u-depth*.72)*18+t*5.7)*H*.012;
        const du=u-pointer.x*.72, dd=depth-(.5-pointer.y*.16);
        const cursorD=Math.sqrt(du*du+dd*dd), cursorWake=Math.exp(-cursorD*cursorD*10.0);
        const cursorLift=(pointer.vy*H*.055+pointer.y*H*.018)*cursorWake;
        const cursorSide=pointer.vx*W*.035*cursorWake*(.4+depth);
        const ripple=Math.sin(cursorD*16.0-t*10.0)*Math.exp(-cursorD*3.3)*H*.025;
        const scrollWave=Math.sin(depth*15-t*7+scrollY*.012)*scrollForce*H*.022;
        const py=yBase+waveA+waveB+waveC+travelling+cursorLift+ripple+scrollWave+pointer.y*H*.018;
        const px=px0+cursorSide+pointer.x*W*(.025+.045*depth);
        const centreDensity=Math.exp(-Math.pow(u*2.8,2));
        const crest=Math.max(0,Math.sin(u*5.5+t*2.4+depth*4));
        const density=.32+.62*centreDensity+.18*crest;
        const hash=Math.abs(Math.sin((x+1)*12.9898+(z+1)*78.233))*43758.5453;
        if((hash-Math.floor(hash))>Math.min(.98,density)) continue;
        const brightness=.32+.55*centreDensity+.25*Math.max(0,crest);
        const radius=(.55+depth*1.55)*(1+cursorWake*.9+Math.max(0,crest)*.35);
        ctx.fillStyle=`rgba(${particleColor},${Math.min(.95,.18+brightness*.62)})`;
        ctx.beginPath(); ctx.arc(px,py,radius,0,Math.PI*2); ctx.fill();
      }
    }
    const dustCount=isMobile?130:360;
    for(let i=0;i<dustCount;i++){
      const seed=i*17.371, bx=Math.sin(seed)*.5+.5, by=Math.cos(seed*1.7)*.5+.5;
      const x=(bx*W+pointer.x*28*(.2+bx))%W, y=(by*H+Math.sin(t*1.7+seed)*18+pointer.y*20)%H;
      ctx.fillStyle=`rgba(${dustColor},${.035+.15*((i%9)/9)})`;
      ctx.beginPath(); ctx.arc(x,y,.45+(i%5)*.33,0,Math.PI*2); ctx.fill();
    }
    scrollVelocity*=.91;
    requestAnimationFrame(drawFallback);
  }

  async function startThree() {
    try {
      const THREE=await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
      const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,isMobile?1.15:1.5));
      renderer.setSize(W,H,false); renderer.setClearColor(0x000000,0); renderer.outputColorSpace=THREE.SRGBColorSpace;
      const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x050608,.048);
      const camera=new THREE.PerspectiveCamera(55,W/H,.1,140); camera.position.set(0,2.6,15); camera.lookAt(0,0,0);
      const cols=isMobile?48:88, rows=isMobile?32:56, count=cols*rows;
      const positions=new Float32Array(count*3), base=new Float32Array(count*3), depth=new Float32Array(count);
      for(let z=0;z<rows;z++){
        const zz=(z/(rows-1)-.5)*22;
        for(let x=0;x<cols;x++){
          const xx=(x/(cols-1)-.5)*25, i=z*cols+x, j=i*3;
          positions[j]=base[j]=xx; positions[j+1]=base[j+1]=.35*Math.sin(xx*.5)+.16*Math.cos(zz*.7); positions[j+2]=base[j+2]=zz; depth[i]=z/(rows-1);
        }
      }
      const geo=new THREE.BufferGeometry(); geo.setAttribute("position",new THREE.BufferAttribute(positions,3));
      const mat=new THREE.PointsMaterial({color:0xffa24a,size:isMobile?.095:.075,transparent:true,opacity:.78,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
      const wave=new THREE.Points(geo,mat); wave.rotation.x=-.13; scene.add(wave);

      const dustCount=isMobile?320:900, dustPos=new Float32Array(dustCount*3);
      for(let i=0;i<dustCount;i++){dustPos[i*3]=(Math.random()-.5)*32;dustPos[i*3+1]=(Math.random()-.5)*16;dustPos[i*3+2]=-10+Math.random()*28;}
      const dg=new THREE.BufferGeometry(); dg.setAttribute("position",new THREE.BufferAttribute(dustPos,3));
      const dm=new THREE.PointsMaterial({color:0xb8672b,size:isMobile?.04:.048,transparent:true,opacity:.34,depthWrite:false,blending:THREE.AdditiveBlending});
      const dust=new THREE.Points(dg,dm); scene.add(dust);
      scene.add(new THREE.AmbientLight(0xffffff,.18));
      const warm=new THREE.PointLight(0xff6b00,11,35,2); warm.position.set(-7,5,8); scene.add(warm);
      const orange=new THREE.PointLight(0xffa24a,5,30,2); orange.position.set(7,-2,3); scene.add(orange);
      const glow=new THREE.Mesh(new THREE.PlaneGeometry(22,12),new THREE.MeshBasicMaterial({color:0x5a2108,transparent:true,opacity:.060,depthWrite:false,blending:THREE.AdditiveBlending})); glow.position.set(0,.8,-5); scene.add(glow);
      const glow2=new THREE.Mesh(new THREE.PlaneGeometry(15,8),new THREE.MeshBasicMaterial({color:0xff6b00,transparent:true,opacity:.030,depthWrite:false,blending:THREE.AdditiveBlending})); glow2.position.set(0,1.2,-4.2); scene.add(glow2);

      function animate(now){
        requestAnimationFrame(animate); const motion=reduced?.12:1, t=now*.00042*motion;
        const pDx=pointer.tx-pointer.x,pDy=pointer.ty-pointer.y; pointer.x+=pDx*.075; pointer.y+=pDy*.075; pointer.vx=pointer.vx*.88+pDx*.18; pointer.vy=pointer.vy*.88+pDy*.18;
        const pos=geo.attributes.position.array;
        for(let z=0;z<rows;z++)for(let x=0;x<cols;x++){
          const i=z*cols+x,j=i*3,xx=base[j],zz=base[j+2],a=xx*.47+t*2.8+zz*.12,b=xx*.2-t*1.45-zz*.18;
          let y=base[j+1]+Math.sin(a)*.6+Math.cos(b)*.3+Math.sin((xx+zz)*.16+t*1.8)*.17;
          const dx=xx*.095-pointer.x*1.8,dz=zz*.07-pointer.y*.85,d=Math.sqrt(dx*dx+dz*dz),cursorWake=Math.exp(-d*d*1.55);
          y+=cursorWake*(pointer.vy*.75+pointer.y*.55); y+=Math.sin(d*7.5-t*8)*Math.exp(-d*1.8)*.22;
          y+=Math.sin(zz*.33+t*7+scrollVelocity*.05)*Math.min(.34,Math.abs(scrollVelocity)*.008)*motion;
          pos[j+1]=y; pos[j]=xx+pointer.x*(.08+depth[i]*.06);
        }
        geo.attributes.position.needsUpdate=true;
        wave.position.x+=(pointer.x*.62-wave.position.x)*.045; wave.position.y+=(pointer.y*.28-wave.position.y)*.045; wave.rotation.z+=(pointer.x*.018-wave.rotation.z)*.035;
        camera.position.x+=(pointer.x*1.15-camera.position.x)*.04; camera.position.y+=((2.6+pointer.y*.55)-camera.position.y)*.04; camera.position.z+=((15-Math.min(2.8,scrollY*.0010))-camera.position.z)*.045;
        dust.rotation.y+=.00028*motion+pointer.x*.00055; dust.rotation.x=Math.sin(t*.55)*.045+pointer.y*.025;
        glow.material.opacity=.060+Math.sin(t*2.6)*.008*motion; glow2.material.opacity=.030+Math.sin(t*2.2+.8)*.005*motion;
        scrollVelocity*=.965; renderer.render(scene,camera);
      }
      addEventListener("resize",()=>{renderer.setPixelRatio(Math.min(devicePixelRatio||1,isMobile?1.15:1.5));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();},{passive:true});
      requestAnimationFrame(animate);
    } catch(error) {
      console.warn("Three.js background unavailable, using Canvas fallback:",error);
      requestAnimationFrame(drawFallback);
    }
  }
  startThree();
})();
