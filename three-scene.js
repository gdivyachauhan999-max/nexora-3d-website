/* ===================================================================
   NEXORA — Three.js Scene Module (Premium Upgrade)
   Holographic neural core · Energy rings · Glow trails · Mouse distortion
=================================================================== */

(function () {
  'use strict';

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const isNarrow = window.innerWidth < 760;

  // -- Fibonacci sphere distribution (even coverage) --
  function fibonacciSpherePositions(count, radius) {
    const positions = new Float32Array(count * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      positions[i * 3] = Math.cos(theta) * r * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(theta) * r * radius;
    }
    return positions;
  }

  // -- Gradient color ramp: violet → mint with slight randomness --
  function buildColorAttribute(positions, count) {
    const colors = new Float32Array(count * 3);
    const violet = new THREE.Color(0x6d5bff);
    const mint = new THREE.Color(0x00f0c0);
    const mid = new THREE.Color(0xb48fff);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      const t = (y + 1) / 2;
      const noise = Math.random() * 0.2 - 0.1;
      tmp.copy(violet).lerp(t > 0.5 ? mint : mid, (t + noise) * 0.8);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    return colors;
  }

  // -- Loader canvas animation (small spinning neural net) --
  function initLoaderCanvas() {
    const canvas = document.getElementById('loaderCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = 120, h = 120, cx = 60, cy = 60;
    const nodes = Array.from({ length: 8 }, (_, i) => ({
      x: cx + Math.cos((i / 8) * Math.PI * 2) * 40,
      y: cy + Math.sin((i / 8) * Math.PI * 2) * 40,
      phase: i * (Math.PI * 2 / 8)
    }));
    let frame = 0;
    const raf = () => {
      if (!document.getElementById('loader')) return;
      ctx.clearRect(0, 0, w, h);
      frame++;
      const t = frame * 0.02;
      // connections
      nodes.forEach((a, i) => {
        nodes.forEach((b, j) => {
          if (j <= i) return;
          const alpha = 0.08 + 0.06 * Math.sin(t + i + j);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(109,91,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        });
      });
      // nodes
      nodes.forEach((n, i) => {
        const pulse = 0.7 + 0.3 * Math.sin(t * 2 + n.phase);
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 8 * pulse);
        grd.addColorStop(0, `rgba(139,124,255,${pulse * 0.9})`);
        grd.addColorStop(1, 'rgba(0,240,192,0)');
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(n.x, n.y, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(139,124,255,${pulse})`;
        ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      // center pulse
      const cp = 0.5 + 0.5 * Math.sin(t * 3);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 * (1 + cp * 0.3));
      cg.addColorStop(0, `rgba(0,240,192,${cp * 0.8})`);
      cg.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.fillStyle = cg;
      ctx.arc(cx, cy, 18 * (1 + cp * 0.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0,240,192,0.9)';
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      requestAnimationFrame(raf);
    };
    raf();
  }

  // ---------------------------------------------------------------
  // SCENE 1 — HERO (holographic neural core with energy rings)
  // ---------------------------------------------------------------
  function initHeroScene() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || !window.THREE) return null;

    const heroEl = canvas.closest('.hero');
    const nodeCount = isCoarsePointer || isNarrow ? 1200 : 2400;
    const radius = 2.4;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, heroEl.clientWidth / heroEl.clientHeight, 0.1, 100);
    camera.position.z = 6.5;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isNarrow, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(heroEl.clientWidth, heroEl.clientHeight);

    // === Particle sphere ===
    const positions = fibonacciSpherePositions(nodeCount, radius);
    const colors = buildColorAttribute(positions, nodeCount);
    const basePos = positions.slice();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: isNarrow ? 0.026 : 0.034,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // === Wireframe shell ===
    const shellGeo = new THREE.IcosahedronGeometry(radius * 1.002, 3);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x6d5bff, wireframe: true, transparent: true, opacity: 0.05,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shell);

    // === Energy rings ===
    const ringGroup = new THREE.Group();
    const ringAngles = [0, Math.PI / 3, Math.PI * 2 / 3];
    const ringColors = [0x6d5bff, 0x00f0c0, 0x8b7cff];
    const rings = ringAngles.map((angle, i) => {
      const ringGeo = new THREE.TorusGeometry(radius * 1.06, 0.006, 8, 120);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[i], transparent: true, opacity: 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = angle;
      ring.rotation.y = angle * 0.5;
      ring.userData = { baseAngleX: angle, baseAngleY: angle * 0.5, speed: 0.003 + i * 0.002 };
      ringGroup.add(ring);
      return ring;
    });
    scene.add(ringGroup);

    // === Accent orbiting nodes ===
    const accentGroup = new THREE.Group();
    const accentGeo = new THREE.OctahedronGeometry(0.06, 0);
    for (let i = 0; i < 8; i++) {
      const mat2 = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f0c0 : 0x8b7cff,
        transparent: true,
        opacity: 0.75,
      });
      const mesh = new THREE.Mesh(accentGeo, mat2);
      const a = (i / 8) * Math.PI * 2;
      const orbitR = radius * (1.35 + Math.random() * 0.4);
      mesh.userData = { angle: a, speed: 0.12 + Math.random() * 0.12, orbitR, yOff: (Math.random() - 0.5) * 2.4 };
      accentGroup.add(mesh);
    }
    scene.add(accentGroup);

    // === Glow trail particles ===
    const trailCount = 300;
    const trailPositions = new Float32Array(trailCount * 3);
    const trailOpacities = new Float32Array(trailCount).fill(0);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.PointsMaterial({
      size: 0.05, color: 0x00f0c0, transparent: true, opacity: 0.6,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    scene.add(trailPoints);

    // Mouse state
    const targetRotation = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };

    if (!isCoarsePointer) {
      window.addEventListener('pointermove', (e) => {
        targetRotation.y = ((e.clientX / window.innerWidth) * 2 - 1) * 0.5;
        targetRotation.x = ((e.clientY / window.innerHeight) * 2 - 1) * 0.28;
      }, { passive: true });
    }

    // Visibility pause
    let isVisible = true;
    const obs = new IntersectionObserver(
      (entries) => { isVisible = entries[0].isIntersecting; },
      { threshold: 0.01 }
    );
    obs.observe(heroEl);

    const scrollState = { progress: 0 };
    const clock = new THREE.Clock();
    let trailIdx = 0;

    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible) return;
      const elapsed = clock.getElapsedTime();

      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.035;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.035;

      points.rotation.y = elapsed * 0.04 + currentRotation.y;
      points.rotation.x = currentRotation.x * 0.45;
      shell.rotation.copy(points.rotation);

      // Animate energy rings
      rings.forEach((ring, i) => {
        ring.rotation.x = ring.userData.baseAngleX + elapsed * ring.userData.speed;
        ring.rotation.y = ring.userData.baseAngleY + elapsed * ring.userData.speed * 0.7;
        ring.material.opacity = 0.25 + 0.2 * Math.sin(elapsed * 0.8 + i * 1.2);
      });

      // Orbit accents
      accentGroup.children.forEach((mesh) => {
        const d = mesh.userData;
        d.angle += d.speed * 0.012;
        mesh.position.set(
          Math.cos(d.angle) * d.orbitR,
          d.yOff + Math.sin(elapsed * 0.5 + d.angle) * 0.4,
          Math.sin(d.angle) * d.orbitR
        );
        mesh.rotation.x += 0.012;
        mesh.rotation.y += 0.018;
      });

      // Breathing effect on particle size
      mat.size = (isNarrow ? 0.026 : 0.034) * (1 + 0.08 * Math.sin(elapsed * 0.6));

      // Glow trail: write positions from accent nodes every few frames
      if (Math.floor(elapsed * 60) % 3 === 0) {
        const src = accentGroup.children[trailIdx % accentGroup.children.length];
        const ti = (trailIdx % trailCount) * 3;
        trailPositions[ti] = src.position.x;
        trailPositions[ti + 1] = src.position.y;
        trailPositions[ti + 2] = src.position.z;
        trailGeo.attributes.position.needsUpdate = true;
        trailIdx++;
      }

      // Scroll parallax
      camera.position.z = 6.5 - scrollState.progress * 1.8;
      camera.position.y = scrollState.progress * -0.5;

      renderer.render(scene, camera);
    }

    if (!isReducedMotion) {
      animate();
    } else {
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
      const w = heroEl.clientWidth, h = heroEl.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    return { scrollState, points };
  }

  // ---------------------------------------------------------------
  // SCENE 2 — INTERACTIVE DEMO SPHERE
  // ---------------------------------------------------------------
  function initDemoScene() {
    const canvas = document.getElementById('demoCanvas');
    const stage = document.getElementById('demoStage');
    if (!canvas || !stage || !window.THREE) return null;

    const nodeCount = isCoarsePointer || isNarrow ? 1600 : 2800;
    const radius = 2.8;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, stage.clientWidth / stage.clientHeight, 0.1, 100);
    camera.position.z = 7.5;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight);

    const positions = fibonacciSpherePositions(nodeCount, radius);
    const colors = buildColorAttribute(positions, nodeCount);
    const basePositions = positions.slice();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.025, vertexColors: true, transparent: true, opacity: 0.92,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const shellGeo = new THREE.IcosahedronGeometry(radius * 1.003, 3);
    const shellMat = new THREE.MeshBasicMaterial({ color: 0x8b7cff, wireframe: true, transparent: true, opacity: 0.04 });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shell);

    // Energy rings for demo sphere
    const demoRings = [0, 1, 2].map((i) => {
      const rg = new THREE.TorusGeometry(radius * 1.07, 0.007, 8, 100);
      const rm = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x6d5bff : 0x00f0c0, transparent: true, opacity: 0.35 });
      const r = new THREE.Mesh(rg, rm);
      r.rotation.x = (i / 3) * Math.PI;
      r.userData = { speed: 0.004 + i * 0.003, phase: i };
      scene.add(r);
      return r;
    });

    // Drag interaction
    let isDragging = false, prevPointer = { x: 0, y: 0 };
    const rotVel = { x: 0, y: 0.0014 };
    let speedReadout = 0.4;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: cx - rect.left, y: cy - rect.top };
    };

    canvas.addEventListener('pointerdown', (e) => { isDragging = true; prevPointer = getPos(e); stage.style.cursor = 'grabbing'; });
    window.addEventListener('pointerup', () => { isDragging = false; stage.style.cursor = 'grab'; });
    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const pos = getPos(e);
      const dx = pos.x - prevPointer.x;
      const dy = pos.y - prevPointer.y;
      rotVel.y = dx * 0.0007;
      rotVel.x = dy * 0.0007;
      prevPointer = pos;
      speedReadout = Math.min(3, Math.abs(dx) * 0.012 + 0.4);
    }, { passive: true });

    canvas.addEventListener('touchstart', (e) => { isDragging = true; prevPointer = getPos(e); }, { passive: true });
    window.addEventListener('touchend', () => { isDragging = false; });
    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const pos = getPos(e);
      const dx = pos.x - prevPointer.x;
      const dy = pos.y - prevPointer.y;
      rotVel.y = dx * 0.0007;
      rotVel.x = dy * 0.0007;
      prevPointer = pos;
      speedReadout = Math.min(3, Math.abs(dx) * 0.012 + 0.4);
    }, { passive: true });

    // Raycaster for hover ripple
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.09;
    const ndcMouse = new THREE.Vector2(-10, -10);
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      ndcMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndcMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }, { passive: true });

    let isVisible = false;
    const obs = new IntersectionObserver((entries) => { isVisible = entries[0].isIntersecting; }, { threshold: 0.1 });
    obs.observe(stage);

    const nodeCountEl = document.getElementById('demoNodeCount');
    const velEl = document.getElementById('demoVelocity');
    if (nodeCountEl) nodeCountEl.textContent = nodeCount.toLocaleString();

    const clock = new THREE.Clock();
    let frame = 0;

    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible) return;
      frame++;

      const elapsed = clock.getElapsedTime();

      points.rotation.y += rotVel.y;
      points.rotation.x += rotVel.x;
      points.rotation.x = Math.max(-1.2, Math.min(1.2, points.rotation.x));

      if (!isDragging) {
        rotVel.y += (0.0014 - rotVel.y) * 0.022;
        rotVel.x += (0 - rotVel.x) * 0.045;
        speedReadout += (0.4 - speedReadout) * 0.022;
      }

      shell.rotation.copy(points.rotation);

      demoRings.forEach((r) => {
        r.rotation.x += r.userData.speed;
        r.rotation.y += r.userData.speed * 0.6;
        r.material.opacity = 0.2 + 0.18 * Math.sin(elapsed * 0.9 + r.userData.phase * 1.4);
      });

      // Particle ripple / hover distortion
      if (frame % 2 === 0) {
        raycaster.setFromCamera(ndcMouse, camera);
        const intersects = raycaster.intersectObject(points);
        const posAttr = geo.attributes.position;
        for (let i = 0; i < nodeCount; i++) {
          const ix = i * 3;
          posAttr.array[ix] += (basePositions[ix] - posAttr.array[ix]) * 0.09;
          posAttr.array[ix + 1] += (basePositions[ix + 1] - posAttr.array[ix + 1]) * 0.09;
          posAttr.array[ix + 2] += (basePositions[ix + 2] - posAttr.array[ix + 2]) * 0.09;
        }
        if (intersects.length) {
          const idx = intersects[0].index;
          const ix = idx * 3;
          const dir = new THREE.Vector3(basePositions[ix], basePositions[ix + 1], basePositions[ix + 2]).normalize();
          const intensity = 0.32 + 0.12 * Math.sin(elapsed * 4);
          posAttr.array[ix] += dir.x * intensity;
          posAttr.array[ix + 1] += dir.y * intensity;
          posAttr.array[ix + 2] += dir.z * intensity;
          // Spread to neighbors
          for (let n = Math.max(0, idx - 12); n < Math.min(nodeCount, idx + 12); n++) {
            const nx = n * 3;
            const nd = new THREE.Vector3(basePositions[nx], basePositions[nx + 1], basePositions[nx + 2]).normalize();
            const falloff = 1 - Math.abs(n - idx) / 12;
            posAttr.array[nx] += nd.x * intensity * falloff * 0.5;
            posAttr.array[nx + 1] += nd.y * intensity * falloff * 0.5;
            posAttr.array[nx + 2] += nd.z * intensity * falloff * 0.5;
          }
        }
        posAttr.needsUpdate = true;
      }

      if (velEl) velEl.textContent = speedReadout.toFixed(2);
      renderer.render(scene, camera);
    }

    if (!isReducedMotion) {
      animate();
    } else {
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    return { points };
  }

  window.NexoraScenes = { initHeroScene, initDemoScene, initLoaderCanvas };
})();