/* ===================================================================
   NEXORA — AI Neural Command Center (Unique Feature)
   Interactive canvas: command buttons morph the point cloud into
   different formations. Real-time telemetry updates.
=================================================================== */

(function () {
  'use strict';

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  function initNeuralCommandCenter() {
    const canvas = document.getElementById('nccCanvas');
    if (!canvas || !window.THREE) return;

    const wrap = canvas.parentElement;
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;

    const nodeCount = isCoarsePointer ? 1600 : 3200;
    const radius = 2.6;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);

    // ── Base sphere formation ──
    const spherePositions = buildSphere(nodeCount, radius);
    // Target positions buffer (what we're morphing toward)
    const targetPositions = spherePositions.slice();
    // Current positions (lerped each frame)
    const currentPositions = spherePositions.slice();

    const colors = buildColors(currentPositions, nodeCount);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(currentPositions), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.022,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Wireframe shell
    const shellMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius * 1.003, 3),
      new THREE.MeshBasicMaterial({ color: 0x6d5bff, wireframe: true, transparent: true, opacity: 0.04 })
    );
    scene.add(shellMesh);

    // Energy rings
    const rings = [0x6d5bff, 0x00f0c0, 0x8b7cff].map((color, i) => {
      const r = new THREE.Mesh(
        new THREE.TorusGeometry(radius * (1.08 + i * 0.04), 0.007, 8, 100),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3 })
      );
      r.userData = { speed: 0.003 + i * 0.002, phase: i };
      scene.add(r);
      return r;
    });

    // Pulse wave sphere (expands outward on PULSE command)
    const pulseMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x00f0c0, wireframe: true, transparent: true, opacity: 0 })
    );
    scene.add(pulseMesh);

    // State
    let currentCmd = 'idle';
    let morphProgress = 1;
    let lerpSpeed = 0.04;
    let rotVelY = 0.005;
    let energy = 40;
    let pulseCount = 0;
    let pulseWaveRadius = 0;
    let pulseWaveActive = false;
    let morphFrom = spherePositions.slice();

    const clock = new THREE.Clock();
    let isVisible = false;
    const obs = new IntersectionObserver(
      (e) => { isVisible = e[0].isIntersecting; },
      { threshold: 0.05 }
    );
    obs.observe(wrap);

    let degRotation = 0;

    // ── Formation generators ──
    function buildSphere(count, r) {
      const pos = new Float32Array(count * 3);
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const rad = Math.sqrt(1 - y * y);
        const theta = golden * i;
        pos[i * 3] = Math.cos(theta) * rad * r;
        pos[i * 3 + 1] = y * r;
        pos[i * 3 + 2] = Math.sin(theta) * rad * r;
      }
      return pos;
    }

    function buildVortex(count) {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const t = i / count;
        const angle = t * Math.PI * 20;
        const spiralR = (1 - t * 0.7) * radius;
        const height = (t - 0.5) * 5.5;
        pos[i * 3] = Math.cos(angle) * spiralR;
        pos[i * 3 + 1] = height;
        pos[i * 3 + 2] = Math.sin(angle) * spiralR;
      }
      return pos;
    }

    function buildDNA(count) {
      const pos = new Float32Array(count * 3);
      const half = Math.floor(count / 2);
      for (let i = 0; i < count; i++) {
        const t = (i % half) / half;
        const angle = t * Math.PI * 8;
        const height = (t - 0.5) * 5;
        const strand = i < half ? 0 : Math.PI;
        const sr = 1.2;
        pos[i * 3] = Math.cos(angle + strand) * sr;
        pos[i * 3 + 1] = height;
        pos[i * 3 + 2] = Math.sin(angle + strand) * sr;
      }
      return pos;
    }

    function buildCollapse(count) {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.3;
        pos[i * 3] = Math.cos(angle) * r;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
        pos[i * 3 + 2] = Math.sin(angle) * r;
      }
      return pos;
    }

    function buildExplode(count) {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const r = 2.5 + Math.random() * 3;
        pos[i * 3] = Math.sin(theta) * Math.cos(phi) * r;
        pos[i * 3 + 1] = Math.cos(theta) * r;
        pos[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * r;
      }
      return pos;
    }

    function buildPulse(count) {
      // expand sphere outward
      const src = buildSphere(count, radius * 2.2);
      return src;
    }

    function buildColors(positions, count) {
      const c = new Float32Array(count * 3);
      const v = new THREE.Color(0x6d5bff);
      const m = new THREE.Color(0x00f0c0);
      const tmp = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const t = (positions[i * 3 + 1] / (radius * 1.1) + 1) / 2;
        tmp.copy(v).lerp(m, Math.min(1, t + Math.random() * 0.15));
        c[i * 3] = tmp.r; c[i * 3 + 1] = tmp.g; c[i * 3 + 2] = tmp.b;
      }
      return c;
    }

    // ── Command handler ──
    function executeCommand(cmd) {
      currentCmd = cmd;
      morphFrom = new Float32Array(currentPositions);
      morphProgress = 0;

      const formations = {
        sphere: () => buildSphere(nodeCount, radius),
        pulse: () => buildPulse(nodeCount),
        collapse: () => buildCollapse(nodeCount),
        explode: () => buildExplode(nodeCount),
        vortex: () => buildVortex(nodeCount),
        dna: () => buildDNA(nodeCount),
        reset: () => buildSphere(nodeCount, radius),
      };

      const gen = formations[cmd] || formations.sphere;
      const newTarget = gen();
      for (let i = 0; i < targetPositions.length; i++) targetPositions[i] = newTarget[i];

      if (cmd === 'pulse') {
        pulseWaveActive = true;
        pulseWaveRadius = 0;
        pulseCount++;
        energy = Math.min(100, energy + 20);
      } else if (cmd === 'collapse') {
        energy = Math.max(5, energy - 20);
      } else if (cmd === 'explode') {
        energy = Math.min(100, energy + 35);
      } else if (cmd === 'reset') {
        energy = 40;
      }

      updateTelemetry(cmd);
      addLog(cmd);
    }

    // ── Telemetry UI updates ──
    const stateEl = document.getElementById('nccState');
    const energyEl = document.getElementById('nccEnergyFill');
    const pulseCountEl = document.getElementById('nccPulseCount');
    const rotEl = document.getElementById('nccRotation');
    const activeLabel = document.getElementById('nccActiveLabel');

    const stateNames = {
      pulse: 'PULSING', collapse: 'COLLAPSING', explode: 'SCATTERING',
      vortex: 'VORTEX', dna: 'HELIX FORM', reset: 'RESETTING', idle: 'IDLE',
    };

    function updateTelemetry(cmd) {
      if (stateEl) {
        stateEl.textContent = stateNames[cmd] || 'ACTIVE';
        stateEl.className = 'ncc-stat-value mint';
      }
      if (energyEl) energyEl.style.width = energy + '%';
      if (pulseCountEl) pulseCountEl.textContent = pulseCount;
      if (activeLabel) {
        activeLabel.textContent = `NEURAL SPHERE — ${(stateNames[cmd] || 'ACTIVE').toUpperCase()}`;
      }
    }

    const logEl = document.getElementById('nccLog');
    let logStartTime = Date.now();

    function addLog(cmd) {
      if (!logEl) return;
      const elapsed = Math.floor((Date.now() - logStartTime) / 1000);
      const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const ss = String(elapsed % 60).padStart(2, '0');
      const entry = document.createElement('div');
      entry.className = 'ncc-log-entry mint';
      entry.innerHTML = `<span class="ncc-log-time">${mm}:${ss}</span><span>CMD: ${cmd.toUpperCase()}</span>`;
      logEl.appendChild(entry);
      logEl.scrollTop = logEl.scrollHeight;
      // cap log at 20 entries
      while (logEl.children.length > 20) logEl.removeChild(logEl.firstChild);
    }

    // ── Bind command buttons ──
    const cmdButtons = document.querySelectorAll('.ncc-cmd');
    cmdButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        cmdButtons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        executeCommand(btn.dataset.cmd);
        setTimeout(() => {
          if (btn.dataset.cmd !== 'reset') btn.classList.remove('is-active');
        }, 2000);
      });
    });

    // ── Animate ──
    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Lerp current → target positions
      if (morphProgress < 1) {
        morphProgress = Math.min(1, morphProgress + lerpSpeed);
        const ease = easeInOutCubic(morphProgress);
        const posAttr = geo.attributes.position;
        for (let i = 0; i < nodeCount * 3; i++) {
          const val = morphFrom[i] + (targetPositions[i] - morphFrom[i]) * ease;
          posAttr.array[i] = val;
          currentPositions[i] = val;
        }
        posAttr.needsUpdate = true;

        // Return to sphere after pulse/explode
        if (morphProgress >= 1 && (currentCmd === 'pulse' || currentCmd === 'explode')) {
          setTimeout(() => executeCommand('reset'), 1400);
        }
      }

      // Steady rotation
      points.rotation.y += rotVelY;
      degRotation = (degRotation + rotVelY * (180 / Math.PI)) % 360;
      shellMesh.rotation.y = points.rotation.y;
      shellMesh.rotation.x = Math.sin(elapsed * 0.2) * 0.12;

      // DNA / vortex get faster rotation
      if (currentCmd === 'dna') rotVelY = 0.014;
      else if (currentCmd === 'vortex') rotVelY = 0.02;
      else rotVelY += (0.005 - rotVelY) * 0.03;

      // Energy rings
      rings.forEach((r, i) => {
        r.rotation.x += r.userData.speed;
        r.rotation.y += r.userData.speed * 0.65;
        r.material.opacity = (0.15 + 0.18 * Math.sin(elapsed * 0.9 + r.userData.phase * 1.4));
        if (currentCmd === 'pulse' && morphProgress < 0.5) {
          r.material.opacity *= (1 + morphProgress * 3);
        }
      });

      // Pulse wave expansion
      if (pulseWaveActive) {
        pulseWaveRadius += 0.06;
        pulseMesh.scale.setScalar(pulseWaveRadius);
        pulseMesh.material.opacity = Math.max(0, 0.7 - pulseWaveRadius * 0.12);
        if (pulseWaveRadius > 6) {
          pulseWaveActive = false;
          pulseWaveRadius = 0;
          pulseMesh.material.opacity = 0;
        }
      }

      // Rotation telemetry
      if (rotEl) rotEl.textContent = Math.round(degRotation) + '°';

      renderer.render(scene, camera);
    }

    if (!isReducedMotion) {
      animate();
    } else {
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
      const nw = wrap.clientWidth, nh = wrap.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  window.NexoraNCC = { init: initNeuralCommandCenter };
})();