import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

/**
 * Gearsmotortune cinematic 3D background.
 * Adapted from the Varadaraja Cinemas background module.
 * The original page content remains in front of this canvas.
 */
export function createCinematicBackground(container, options = {}) {
  if (!container) return null;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)");

  const settings = {
    particleCount: options.particleCount ?? (isTouch.matches ? 180 : 520),
    maxPixelRatio: options.maxPixelRatio ?? 1.35,
    bloomStrength: options.bloomStrength ?? 0.34,
    bloomRadius: options.bloomRadius ?? 0.52,
    bloomThreshold: options.bloomThreshold ?? 0.82,
    reelOpacity: options.reelOpacity ?? 0.28,
    filmOpacity: options.filmOpacity ?? 0.085,
    ...options
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050608, 0.055);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(0, 0.15, 8.5);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.maxPixelRatio));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  Object.assign(renderer.domElement.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    pointerEvents: "none",
    zIndex: "0"
  });

  const computed = getComputedStyle(container);
  if (computed.position === "static") container.style.position = "relative";
  if (computed.overflow === "visible") container.style.overflow = "hidden";
  container.prepend(renderer.domElement);

  Array.from(container.children).forEach((child) => {
    if (child !== renderer.domElement && child instanceof HTMLElement) {
      if (getComputedStyle(child).position === "static") child.style.position = "relative";
      child.style.zIndex = child.style.zIndex || "2";
    }
  });

  const ambient = new THREE.AmbientLight(0x4a3a30, 0.32);
  scene.add(ambient);

  const projector = new THREE.PointLight(0xff6b00, 7.5, 18, 2);
  projector.position.set(-3.8, 1.6, 2.2);
  scene.add(projector);

  const rim = new THREE.PointLight(0xffb15a, 3.0, 14, 2);
  rim.position.set(4.5, -0.6, -1.5);
  scene.add(rim);

  const particlePositions = new Float32Array(settings.particleCount * 3);
  const particleSizes = new Float32Array(settings.particleCount);
  for (let i = 0; i < settings.particleCount; i++) {
    const i3 = i * 3;
    particlePositions[i3] = (Math.random() - 0.5) * 15;
    particlePositions[i3 + 1] = (Math.random() - 0.5) * 7;
    particlePositions[i3 + 2] = (Math.random() - 0.5) * 14;
    particleSizes[i] = 0.45 + Math.random() * 1.25;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(particleSizes, 1));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffa24a,
    size: 0.035,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.position.z = -1.5;
  scene.add(particles);

  function createReel(scale = 1) {
    const reel = new THREE.Group();
    reel.scale.setScalar(scale);

    const metal = new THREE.MeshStandardMaterial({
      color: 0x6a6f74,
      metalness: 0.82,
      roughness: 0.34,
      transparent: true,
      opacity: settings.reelOpacity
    });
    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x24272a,
      metalness: 0.75,
      roughness: 0.42,
      transparent: true,
      opacity: settings.reelOpacity * 0.92
    });

    reel.add(new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.11, 16, 96), metal));
    reel.add(new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.08, 12, 64), darkMetal));

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 48), metal);
    hub.rotation.x = Math.PI / 2;
    reel.add(hub);

    const spokeGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.075, 0.11), darkMetal);
      spoke.rotation.z = (i * Math.PI) / 4;
      spokeGroup.add(spoke);
    }
    reel.add(spokeGroup);

    const holeMaterial = new THREE.MeshBasicMaterial({
      color: 0x07090a,
      transparent: true,
      opacity: settings.reelOpacity * 0.9
    });
    const holes = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 20), holeMaterial);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(Math.cos(a) * 1.38, Math.sin(a) * 1.38, 0);
      holes.add(hole);
    }
    reel.add(holes);
    return reel;
  }

  const reelLeft = createReel(0.92);
  reelLeft.position.set(-3.6, 0.7, -2.8);
  reelLeft.rotation.set(0.18, -0.26, -0.18);
  scene.add(reelLeft);

  const reelRight = createReel(0.68);
  reelRight.position.set(3.7, -0.45, -4.3);
  reelRight.rotation.set(-0.15, 0.35, 0.25);
  scene.add(reelRight);

  function createTechnicalRibbon() {
    const group = new THREE.Group();
    const points = [];
    const length = 14;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const x = -7 + t * length;
      const y = 1.5 + Math.sin(t * Math.PI * 1.8) * 0.85 - t * 2.4;
      const z = -4.8 - Math.sin(t * Math.PI) * 1.2;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    group.add(new THREE.Mesh(
      new THREE.TubeGeometry(curve, 96, 0.035, 6, false),
      new THREE.MeshBasicMaterial({ color: 0xff6b00, transparent: true, opacity: settings.filmOpacity })
    ));

    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffa24a, transparent: true, opacity: settings.filmOpacity * 1.8 });
    for (let i = 4; i < 76; i += 4) {
      const t = i / 80;
      const p = curve.getPointAt(t);
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.045), markerMaterial);
      marker.position.copy(p);
      marker.rotation.z = Math.sin(t * Math.PI * 2) * 0.35;
      group.add(marker);
    }
    return group;
  }

  const technicalRibbon = createTechnicalRibbon();
  scene.add(technicalRibbon);

  let composer = null;
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), settings.bloomStrength, settings.bloomRadius, settings.bloomThreshold);
    if (isTouch.matches) bloom.strength *= 0.55;
    composer.addPass(bloom);
  } catch {
    composer = null;
  }

  const pointer = new THREE.Vector2();
  const baseCamera = new THREE.Vector3(0, 0.15, 8.5);
  const targetCamera = baseCamera.clone();

  function onPointerMove(event) {
    if (isTouch.matches) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function onResize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.maxPixelRatio));
    renderer.setSize(width, height, false);
    composer?.setSize(width, height);
  }

  container.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  const clock = new THREE.Clock();
  let raf = 0;
  let stopped = false;

  function animate() {
    if (stopped) return;
    raf = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    const motion = prefersReducedMotion.matches ? 0.15 : 1;

    particles.rotation.y += 0.00018 * motion;
    particles.rotation.x = Math.sin(elapsed * 0.08) * 0.018 * motion;
    reelLeft.rotation.z += 0.0017 * motion;
    reelRight.rotation.z -= 0.0011 * motion;
    technicalRibbon.position.x = Math.sin(elapsed * 0.045) * 0.12 * motion;

    if (!isTouch.matches) {
      targetCamera.x = baseCamera.x + pointer.x * 0.22;
      targetCamera.y = baseCamera.y + pointer.y * 0.13;
    } else {
      targetCamera.copy(baseCamera);
    }
    camera.position.lerp(targetCamera, 0.025);
    projector.intensity = 7.5 + Math.sin(elapsed * 0.7) * 0.35 * motion;

    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  onResize();
  if (!prefersReducedMotion.matches) animate();
  else renderer.render(scene, camera);

  return {
    renderer,
    scene,
    camera,
    destroy() {
      stopped = true;
      cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      particleGeometry.dispose();
      particleMaterial.dispose();
      scene.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach(m => m.dispose?.());
        else object.material?.dispose?.();
      });
      composer?.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
