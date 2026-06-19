/* ============================================================================
   PAGE-SHELL.JS — the ambient Three.js particle field, extracted once so the
   library and article pages don't each re-declare it. Identical parameters to
   the homepage's initParticleBackground(). Exposes PageShell.initParticles().
============================================================================ */
(function () {
  function initParticles() {
    const canvas = document.getElementById("particle-canvas");
    if (!canvas || !window.THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const particleCount = window.innerWidth < 768 ? 300 : 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorOptions = [
      new THREE.Color(0x0a0a0a),
      new THREE.Color(0x3a3a3a),
      new THREE.Color(0x6e6e6e),
      new THREE.Color(0x8a8a8a),
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      sizes[i] = Math.random() * 0.03 + 0.01;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.04, vertexColors: true, transparent: true,
      opacity: 0.6, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    camera.position.z = 5;

    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    document.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    let scrollY = 0;
    window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      particles.rotation.y = t * 0.05 + targetX * 0.3;
      particles.rotation.x = t * 0.02 + targetY * 0.2;
      particles.position.y = -scrollY * 0.0005;

      const pos = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3, iy = i * 3 + 1;
        pos[iy] += Math.sin(t + pos[ix] * 1.5) * 0.001;
        pos[ix] += Math.cos(t * 0.7 + pos[iy] * 1.2) * 0.0005;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  window.PageShell = { initParticles };
})();
