/**
 * AuthRos Biomedical 3D Molecular Simulation Suite
 * Models: DNA Double Helix, Immunoglobulin Antibody, Tertiary Protein Fold,
 * CRISPR-Cas9 Cleavage Loop, Phospholipid Bilayer Membrane, Quantum Conformation Torus.
 */

(function(window, document) {
  'use strict';

  const Bio3D = {
    instances: new Map(),
    observer: null,

    init: function() {
      if (typeof THREE === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => this.bindAll();
        document.head.appendChild(script);
      } else {
        this.bindAll();
      }
    },

    bindAll: function() {
      if (typeof document === 'undefined') return;

      // Lazy viewport observer to ensure 60fps and zero background CPU usage
      if ('IntersectionObserver' in window && !this.observer) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const instance = this.instances.get(entry.target);
            if (instance) {
              instance.isVisible = entry.isIntersecting;
              if (entry.isIntersecting && !instance.isRunning) {
                instance.start();
              }
            }
          });
        }, { threshold: 0.05 });
      }

      document.querySelectorAll('canvas[data-bio-3d]').forEach(canvas => {
        if (!this.instances.has(canvas)) {
          const type = canvas.getAttribute('data-bio-3d') || 'dna';
          this.createInstance(canvas, type);
        }
      });
    },

    createInstance: function(canvas, modelType) {
      if (typeof THREE === 'undefined') return;
      if (this.instances.has(canvas)) return;

      const getCanvasSize = () => {
        const rect = canvas.getBoundingClientRect();
        return {
          width: Math.max(rect.width || canvas.clientWidth || 120, 100),
          height: Math.max(rect.height || canvas.clientHeight || 120, 100)
        };
      };

      const { width, height } = getCanvasSize();

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

      // Model-specific camera distances to ensure no clipping
      const cameraDistances = {
        dna: 26,
        'dna-backdrop': 24,
        protein: 22,
        cleavage: 20,
        antibody: 21,
        membrane: 21,
        torus: 20
      };
      camera.position.z = cameraDistances[modelType] || 22;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        });
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      } catch(e) {
        return;
      }

      // Lighting Rig
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
      scene.add(ambientLight);

      const light1 = new THREE.DirectionalLight(0x10b981, 1.8);
      light1.position.set(15, 15, 20);
      scene.add(light1);

      const light2 = new THREE.PointLight(0x06b6d4, 2.2, 80);
      light2.position.set(-15, -15, 15);
      scene.add(light2);

      const light3 = new THREE.PointLight(0xf59e0b, 1.6, 60);
      light3.position.set(0, -18, -10);
      scene.add(light3);

      const group = new THREE.Group();
      scene.add(group);

      // ======================================================================
      // 3D BIOMODEL ARCHITECTURES
      // ======================================================================
      if (modelType === 'dna' || modelType === 'dna-backdrop') {
        // DNA DOUBLE HELIX
        const isBackdrop = modelType === 'dna-backdrop';
        const numBases = isBackdrop ? 46 : 24;
        const helixRadius = isBackdrop ? 6.4 : 3.8;
        const heightStep = isBackdrop ? 1.05 : 0.85;
        const twistStep = isBackdrop ? 0.32 : 0.38;
        const sphereGeo = new THREE.SphereGeometry(isBackdrop ? 0.65 : 0.46, 16, 16);
        
        const strand1Mat = new THREE.MeshPhongMaterial({ color: 0x10b981, shininess: 95, specular: 0x34d399, transparent: isBackdrop, opacity: isBackdrop ? 0.88 : 1.0 });
        const strand2Mat = new THREE.MeshPhongMaterial({ color: 0x06b6d4, shininess: 95, specular: 0x38bdf8, transparent: isBackdrop, opacity: isBackdrop ? 0.88 : 1.0 });
        
        // Base pair color palettes: Adenine(Gold), Thymine(Rose), Guanine(Emerald), Cytosine(Purple)
        const baseColors = [0xf59e0b, 0xf43f5e, 0x10b981, 0x8b5cf6];

        for (let i = 0; i < numBases; i++) {
          const angle = i * twistStep;
          const y = (i - numBases / 2) * heightStep;
          const x1 = Math.cos(angle) * helixRadius;
          const z1 = Math.sin(angle) * helixRadius;
          const x2 = Math.cos(angle + Math.PI) * helixRadius;
          const z2 = Math.sin(angle + Math.PI) * helixRadius;

          // Sugar-phosphate backbone nodes
          const a1 = new THREE.Mesh(sphereGeo, strand1Mat);
          a1.position.set(x1, y, z1);
          group.add(a1);

          const a2 = new THREE.Mesh(sphereGeo, strand2Mat);
          a2.position.set(x2, y, z2);
          group.add(a2);

          // Hydrogen bonded base pairs
          const rungColor = baseColors[i % baseColors.length];
          const rungsMat = new THREE.MeshPhongMaterial({ 
            color: rungColor, 
            shininess: 85, 
            specular: 0xffffff,
            transparent: isBackdrop,
            opacity: isBackdrop ? 0.85 : 1.0
          });
          const bondLen = Math.hypot(x2 - x1, z2 - z1);
          const rung = new THREE.Mesh(new THREE.CylinderGeometry(isBackdrop ? 0.2 : 0.12, isBackdrop ? 0.2 : 0.12, bondLen, 10), rungsMat);
          rung.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
          rung.rotation.z = Math.PI / 2;
          rung.rotation.y = -angle;
          group.add(rung);
        }

        if (isBackdrop) {
          group.rotation.z = 0.25;
        }
      } else if (modelType === 'protein') {
        // TERTIARY PROTEIN CRYSTAL FOLD
        const icosaGeo = new THREE.IcosahedronGeometry(4.2, 1);
        const icosaWireMat = new THREE.MeshPhongMaterial({ color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.85 });
        group.add(new THREE.Mesh(icosaGeo, icosaWireMat));

        const coreGeo = new THREE.SphereGeometry(2.0, 16, 16);
        const coreMat = new THREE.MeshPhongMaterial({ color: 0x10b981, shininess: 100, transparent: true, opacity: 0.9, specular: 0x34d399 });
        group.add(new THREE.Mesh(coreGeo, coreMat));

        // Catalytic active ligand nodes
        for (let i = 0; i < 8; i++) {
          const phi = Math.acos(-1 + (2 * i) / 8);
          const theta = Math.sqrt(8 * Math.PI) * phi;
          const ligand = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), new THREE.MeshPhongMaterial({ color: 0xf59e0b, shininess: 90 }));
          ligand.position.setFromSphericalCoords(3.4, phi, theta);
          group.add(ligand);
        }
      } else if (modelType === 'cleavage') {
        // CRISPR-Cas9 GUIDE-RNA CLEAVAGE LOOP
        const ringGeo = new THREE.TorusGeometry(3.8, 0.38, 12, 36, Math.PI * 1.6);
        const ringMat = new THREE.MeshPhongMaterial({ color: 0x06b6d4, shininess: 100, specular: 0x38bdf8 });
        group.add(new THREE.Mesh(ringGeo, ringMat));

        const enzymeGeo = new THREE.DodecahedronGeometry(2.4);
        const enzymeMat = new THREE.MeshPhongMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.85 });
        group.add(new THREE.Mesh(enzymeGeo, enzymeMat));

        const catalyticCore = new THREE.Mesh(new THREE.SphereGeometry(1.2, 14, 14), new THREE.MeshPhongMaterial({ color: 0x10b981, shininess: 100 }));
        group.add(catalyticCore);
      } else if (modelType === 'antibody') {
        // IMMUNOGLOBULIN Y-ANTIBODY STRUCTURE
        const stemMat = new THREE.MeshPhongMaterial({ color: 0x10b981, shininess: 95, specular: 0x34d399 });
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 4.4, 10), stemMat);
        stem.position.y = -1.9;
        group.add(stem);

        const armMat = new THREE.MeshPhongMaterial({ color: 0x06b6d4, shininess: 95, specular: 0x38bdf8 });
        const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 4.0, 10), armMat);
        arm1.position.set(-1.5, 1.3, 0);
        arm1.rotation.z = Math.PI / 4;
        group.add(arm1);

        const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 4.0, 10), armMat);
        arm2.position.set(1.5, 1.3, 0);
        arm2.rotation.z = -Math.PI / 4;
        group.add(arm2);

        // Fab Antigen Binding Domain Tips
        const tipMat = new THREE.MeshPhongMaterial({ color: 0xf59e0b, shininess: 100, specular: 0xfde047 });
        const tipGeo = new THREE.SphereGeometry(0.72, 14, 14);
        
        const tip1 = new THREE.Mesh(tipGeo, tipMat);
        tip1.position.set(-2.9, 2.7, 0);
        group.add(tip1);

        const tip2 = new THREE.Mesh(tipGeo, tipMat);
        tip2.position.set(2.9, 2.7, 0);
        group.add(tip2);

        const hinge = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), new THREE.MeshPhongMaterial({ color: 0x8b5cf6, shininess: 90 }));
        hinge.position.set(0, 0.2, 0);
        group.add(hinge);
      } else if (modelType === 'membrane') {
        // PHOSPHOLIPID BILAYER LIPOSOME MEMBRANE
        const clusterCount = 18;
        const sphereGeo = new THREE.SphereGeometry(0.65, 12, 12);
        const mat = new THREE.MeshPhongMaterial({ color: 0x8b5cf6, shininess: 85, transparent: true, opacity: 0.9, specular: 0xc4b5fd });
        
        for (let i = 0; i < clusterCount; i++) {
          const phi = Math.acos(-1 + (2 * i) / clusterCount);
          const theta = Math.sqrt(clusterCount * Math.PI) * phi;
          const s = new THREE.Mesh(sphereGeo, mat);
          s.position.setFromSphericalCoords(3.2, phi, theta);
          group.add(s);
        }
        
        const transportCore = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16), new THREE.MeshPhongMaterial({ color: 0x10b981, wireframe: true }));
        group.add(transportCore);
      } else if (modelType === 'torus') {
        // QUANTUM CONFORMATIONAL ENERGY TORUS
        const torusGeo = new THREE.TorusGeometry(4.2, 0.28, 12, 40);
        const t1 = new THREE.Mesh(torusGeo, new THREE.MeshPhongMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.85 }));
        t1.rotation.x = Math.PI / 3;
        group.add(t1);

        const t2 = new THREE.Mesh(torusGeo, new THREE.MeshPhongMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.75 }));
        t2.rotation.y = Math.PI / 3;
        group.add(t2);

        const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(1.4, 18, 18), new THREE.MeshPhongMaterial({ color: 0x10b981, shininess: 100, specular: 0x34d399 }));
        group.add(coreSphere);
      }

      // ======================================================================
      // RESPONSIVE RESIZE HANDLING
      // ======================================================================
      const updateSize = () => {
        const { width: newW, height: newH } = getCanvasSize();
        if (canvas.width !== newW || canvas.height !== newH) {
          renderer.setSize(newW, newH, false);
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
        }
      };

      if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(updateSize);
        ro.observe(canvas);
      }
      window.addEventListener('resize', updateSize, { passive: true });

      // ======================================================================
      // INTERACTIVE MOUSE & TOUCH CONTROLS
      // ======================================================================
      let isDragging = false;
      let prevMouse = { x: 0, y: 0 };
      let dragVelocity = { x: 0, y: 0 };

      const onMouseDown = (e) => {
        isDragging = true;
        prevMouse = { x: e.clientX, y: e.clientY };
        dragVelocity = { x: 0, y: 0 };
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        dragVelocity = { x: dx * 0.012, y: dy * 0.012 };
        group.rotation.y += dragVelocity.x;
        group.rotation.x += dragVelocity.y;
        prevMouse = { x: e.clientX, y: e.clientY };
      };

      canvas.addEventListener('mousedown', onMouseDown, { passive: true });
      window.addEventListener('mouseup', onMouseUp, { passive: true });
      window.addEventListener('mousemove', onMouseMove, { passive: true });

      // Touch events
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          isDragging = true;
          prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          dragVelocity = { x: 0, y: 0 };
        }
      }, { passive: true });

      window.addEventListener('touchend', onMouseUp, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (!isDragging || !e.touches || !e.touches[0]) return;
        const dx = e.touches[0].clientX - prevMouse.x;
        const dy = e.touches[0].clientY - prevMouse.y;
        dragVelocity = { x: dx * 0.012, y: dy * 0.012 };
        group.rotation.y += dragVelocity.x;
        group.rotation.x += dragVelocity.y;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }, { passive: true });

      // ======================================================================
      // RENDER LOOP WITH VIEWPORT CULLING & SCROLL MOMENTUM
      // ======================================================================
      let scrollSpinMomentum = 0;
      const baseCameraZ = cameraDistances[modelType] || 22;

      const instance = {
        canvas,
        renderer,
        scene,
        camera,
        group,
        isVisible: true,
        isRunning: false,
        addScrollMomentum: function(vel) {
          scrollSpinMomentum += vel * 0.0035;
        },
        start: function() {
          if (this.isRunning) return;
          this.isRunning = true;

          const renderLoop = () => {
            if (!this.isVisible) {
              this.isRunning = false;
              return;
            }

            // Apply scroll momentum & continuous rotation
            if (!isDragging) {
              group.rotation.y += 0.009 + dragVelocity.x + scrollSpinMomentum;
              group.rotation.x += dragVelocity.y + (scrollSpinMomentum * 0.3);
              dragVelocity.x *= 0.93;
              dragVelocity.y *= 0.93;
              scrollSpinMomentum *= 0.92;
              
              const osc = Math.sin(Date.now() * 0.001);
              group.rotation.x = osc * 0.12;
              group.position.y = Math.cos(Date.now() * 0.0015) * 0.35;

              // Camera subtle breathing pulse on scroll momentum
              camera.position.z = baseCameraZ - Math.min(Math.abs(scrollSpinMomentum) * 12, 3);
            }

            // Dynamic Chromatic Lighting Shift on Scroll & Time
            const t = Date.now() * 0.0006;
            const r = 0.5 + 0.5 * Math.sin(t);
            const g = 0.8 + 0.2 * Math.sin(t + 2);
            const b = 0.6 + 0.4 * Math.sin(t + 4);
            light1.color.setRGB(0.1 + 0.2 * r, 0.7 + 0.3 * g, 0.5 + 0.4 * b);

            renderer.render(scene, camera);
            requestAnimationFrame(renderLoop);
          };

          requestAnimationFrame(renderLoop);
        }
      };

      this.instances.set(canvas, instance);
      if (this.observer) {
        this.observer.observe(canvas);
      } else {
        instance.start();
      }
    },

    // Broadcast scroll velocity to all active 3D models
    onScrollVelocity: function(velocity) {
      if (!velocity) return;
      this.instances.forEach(instance => {
        if (instance.isVisible && typeof instance.addScrollMomentum === 'function') {
          instance.addScrollMomentum(velocity);
        }
      });
    }
  };

  window.Bio3D = Bio3D;
  window.initBio3DViewer = (canvas, type) => Bio3D.createInstance(canvas, type);

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => Bio3D.init());
    } else {
      Bio3D.init();
    }
  }
})(window, document);
