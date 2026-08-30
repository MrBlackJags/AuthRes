/**
 * AuthRos High-Performance Interactive Effects & Scroll Animation Suite
 * Includes: Quantum Dot Matrix Backdrop, Scroll-Driven Media Scaling & Color Shifts,
 * Synaptic Node Mesh, 3D Canvas Momentum, Tactile Cursor Aura, and Spring Physics.
 */

(function(window, document) {
  'use strict';

  // ==========================================================================
  // 1. TACTILE CUSTOM POINTER & CURSOR AURA CONTROLLER
  // ==========================================================================
  const PointerEngine = {
    layer: null,
    dot: null,
    ring: null,
    mouse: { x: -100, y: -100 },
    ringPos: { x: -100, y: -100 },
    isActive: false,
    initialized: false,

    init: function() {
      if (this.initialized) return;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
        return;
      }
      this.initialized = true;

      // Inject cursor DOM elements
      this.layer = document.createElement('div');
      this.layer.id = 'custom-pointer-layer';
      this.layer.innerHTML = `
        <div class="custom-pointer-ring" id="ui-pointer-ring"></div>
        <div class="custom-pointer-dot" id="ui-pointer-dot"></div>
      `;
      document.body.appendChild(this.layer);

      this.ring = document.getElementById('ui-pointer-ring');
      this.dot = document.getElementById('ui-pointer-dot');

      this.bindEvents();
      this.startLoop();
    },

    bindEvents: function() {
      const self = this;

      // Mouse tracking
      window.addEventListener('mousemove', (e) => {
        self.mouse.x = e.clientX;
        self.mouse.y = e.clientY;

        if (!self.isActive) {
          self.isActive = true;
          self.ringPos.x = e.clientX;
          self.ringPos.y = e.clientY;
          if (self.dot) self.dot.style.opacity = '1';
          if (self.ring) self.ring.style.opacity = '1';
        }

        if (self.dot) {
          self.dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
        }
      }, { passive: true });

      // Hover context detection
      let hoverTimeout;
      document.addEventListener('mouseover', (e) => {
        if (!self.ring || !self.dot) return;
        const target = e.target;
        if (!target) return;

        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          const isClickable = target.closest('button, a, select, input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], [onclick], [role="button"], .interactive-card, .cursor-pointer, .theme-toggle-btn, .domain-pill');
          const isInputText = target.closest('input[type="text"], input[type="search"], input[type="email"], input[type="password"], textarea, [contenteditable="true"]');
          const isAmber = target.closest('.bg-amber-500, .bg-amber-600, .text-amber-500, [href*="public-portal"], .border-amber-400, #donate-card, [onclick*="openDonateModal"]');
          const isSky = target.closest('.bg-sky-500, .bg-sky-600, .text-sky-500, [href*="hospital-portal"], .border-sky-400, #hospital-card, [onclick*="openHospitalModal"]');

          if (isInputText) {
            self.ring.className = 'custom-pointer-ring pointer-text';
            self.dot.className = 'custom-pointer-dot pointer-text';
          } else if (isClickable) {
            let ringClass = 'custom-pointer-ring pointer-hover';
            let dotClass = 'custom-pointer-dot pointer-hover';
            if (isAmber) {
              ringClass += ' pointer-amber';
              dotClass += ' pointer-amber';
            } else if (isSky) {
              ringClass += ' pointer-sky';
              dotClass += ' pointer-sky';
            }
            self.ring.className = ringClass;
            self.dot.className = dotClass;
          } else {
            self.ring.className = 'custom-pointer-ring';
            self.dot.className = 'custom-pointer-dot';
          }
        }, 8);
      }, { passive: true });

      // Window blur/leave
      document.documentElement.addEventListener('mouseleave', () => {
        if (self.dot) self.dot.style.opacity = '0';
        if (self.ring) self.ring.style.opacity = '0';
        self.isActive = false;
      });

      document.documentElement.addEventListener('mouseenter', () => {
        if (self.dot) self.dot.style.opacity = '1';
        if (self.ring) self.ring.style.opacity = '1';
        self.isActive = true;
      });

      // Click effects
      window.addEventListener('mousedown', (e) => {
        if (self.ring) self.ring.classList.add('pointer-active');
        if (self.dot) self.dot.classList.add('pointer-active');
        self.createClickSparks(e.clientX, e.clientY);
      }, { passive: true });

      window.addEventListener('mouseup', () => {
        if (self.ring) self.ring.classList.remove('pointer-active');
        if (self.dot) self.dot.classList.remove('pointer-active');
      }, { passive: true });
    },

    createClickSparks: function(x, y) {
      if (!this.layer) return;

      // Ripple wave
      const ripple = document.createElement('div');
      ripple.className = 'pointer-click-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      if (this.ring && this.ring.classList.contains('pointer-amber')) {
        ripple.style.borderColor = 'rgba(245, 158, 11, 0.85)';
      } else if (this.ring && this.ring.classList.contains('pointer-sky')) {
        ripple.style.borderColor = 'rgba(14, 165, 233, 0.85)';
      }

      this.layer.appendChild(ripple);
      setTimeout(() => ripple.remove(), 550);

      // Particle sparks
      const colors = (this.ring && this.ring.classList.contains('pointer-amber'))
        ? ['#fbbf24', '#f59e0b', '#d97706']
        : (this.ring && this.ring.classList.contains('pointer-sky'))
        ? ['#38bdf8', '#0ea5e9', '#0284c7']
        : ['#34d399', '#10b981', '#059669'];

      for (let i = 0; i < 5; i++) {
        const p = document.createElement('div');
        p.className = 'pointer-particle';
        const angle = (Math.PI * 2 * i) / 5 + (Math.random() * 0.4 - 0.2);
        const dist = 16 + Math.random() * 22;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        p.style.backgroundColor = colors[i % colors.length];
        p.style.boxShadow = `0 0 8px ${colors[i % colors.length]}`;

        this.layer.appendChild(p);
        setTimeout(() => p.remove(), 550);
      }
    },

    startLoop: function() {
      const self = this;
      function render() {
        if (self.isActive && self.ring) {
          self.ringPos.x += (self.mouse.x - self.ringPos.x) * 0.26;
          self.ringPos.y += (self.mouse.y - self.ringPos.y) * 0.26;
          self.ring.style.transform = `translate3d(${self.ringPos.x}px, ${self.ringPos.y}px, 0) translate(-50%, -50%)`;
        }
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }
  };

  // ==========================================================================
  // 2. AMBIENT LIVING AURORA, QUANTUM DOTS & CANVAS CONTROLLER
  // ==========================================================================
  const AmbientEngine = {
    scrollVelocity: 0,
    lastScrollY: 0,
    scrollTimer: null,

    init: function() {
      this.initQuantumDotGrid();
      this.initAuroraMesh();
      this.initBioCanvas();
      this.initScrollReadingProgress();
      this.initScrollDrivenAnimations();
      this.initScrollReveal();
      this.initCardInteractions();
    },

    initQuantumDotGrid: function() {
      let grid = document.getElementById('bg-dots-grid');
      if (!grid) {
        grid = document.createElement('div');
        grid.id = 'bg-dots-grid';
        grid.className = 'ambient-breathe';
        if (document.body) document.body.prepend(grid);
      }
    },

    initAuroraMesh: function() {
      let mesh = document.getElementById('bg-aurora-mesh');
      if (!mesh) {
        mesh = document.createElement('div');
        mesh.id = 'bg-aurora-mesh';
        mesh.innerHTML = `
          <div class="aurora-orb aurora-orb-1"></div>
          <div class="aurora-orb aurora-orb-2"></div>
          <div class="aurora-orb aurora-orb-3"></div>
          <div class="aurora-orb aurora-orb-4"></div>
        `;
        if (document.body) document.body.prepend(mesh);
      }
    },

    initBioCanvas: function() {
      let canvas = document.getElementById('bio-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'bio-canvas';
        if (document.body) document.body.prepend(canvas);
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          width = canvas.width = window.innerWidth;
          height = canvas.height = window.innerHeight;
        }, 150);
      }, { passive: true });

      // High density dots & synaptic nodes
      const nodeCount = Math.min(Math.max(Math.floor((width * height) / 14000), 45), 110);
      const nodes = [];
      const shockwaves = [];
      const microBio = [];

      // Multi-spectral color palette for dots
      const dotPalettes = [
        '52, 211, 153',   // Emerald
        '6, 182, 212',    // Cyan
        '167, 139, 250',  // Violet
        '245, 158, 11',   // Amber
        '16, 185, 129'    // Mint
      ];

      // Initialize Quantum Synaptic Nodes
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2.2 + 1.2,
          baseRadius: Math.random() * 2.2 + 1.2,
          alpha: Math.random() * 0.45 + 0.3,
          phase: Math.random() * Math.PI * 2,
          colorRgb: dotPalettes[i % dotPalettes.length]
        });
      }

      // Floating Bio Elements (Benzene Rings & DNA mini-rungs)
      const microCount = Math.min(Math.floor(width / 200), 10);
      for (let i = 0; i < microCount; i++) {
        microBio.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.015,
          size: Math.random() * 12 + 14,
          type: i % 2 === 0 ? 'benzene' : 'dna',
          alpha: Math.random() * 0.25 + 0.15,
          colorRgb: dotPalettes[(i + 1) % dotPalettes.length]
        });
      }

      let mouse = { x: -1000, y: -1000 };
      window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }, { passive: true });

      window.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
      });

      const burstParticles = [];

      // Click explosive dispersion & shockwaves
      window.addEventListener('mousedown', (e) => {
        const clickX = e.clientX;
        const clickY = e.clientY;

        // 1. Shockwave wave front
        if (shockwaves.length < 8) {
          shockwaves.push({ x: clickX, y: clickY, radius: 12, alpha: 1.0 });
        }

        // 2. Powerful Radial Blast Impulse: ALL nearby dots FLY AWAY!
        const blastRadius = 450;
        const blastForce = 24.0;

        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const dx = n.x - clickX;
          const dy = n.y - clickY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < blastRadius) {
            const factor = Math.pow(1 - (dist / blastRadius), 1.4);
            const angle = Math.atan2(dy, dx) + (Math.random() * 0.4 - 0.2);
            const force = blastForce * factor;

            n.vx += Math.cos(angle) * force;
            n.vy += Math.sin(angle) * force;
            n.alpha = Math.min(1.0, n.alpha + 0.5);
            n.baseRadius = n.baseRadius * 1.5;
          }
        }

        // Blast floating micro-structures (benzene & DNA rungs)
        for (let m = 0; m < microBio.length; m++) {
          const mb = microBio[m];
          const dx = mb.x - clickX;
          const dy = mb.y - clickY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < blastRadius) {
            const factor = 1 - (dist / blastRadius);
            const angle = Math.atan2(dy, dx);
            mb.vx += Math.cos(angle) * (blastForce * 0.8) * factor;
            mb.vy += Math.sin(angle) * (blastForce * 0.8) * factor;
            mb.rotSpeed += (Math.random() - 0.5) * 0.25;
          }
        }

        // 3. Spawn 24 High-Velocity Quantum Burst Dots that explode outward
        for (let k = 0; k < 24; k++) {
          const angle = (Math.PI * 2 * k) / 24 + (Math.random() * 0.3 - 0.15);
          const speed = Math.random() * 12 + 6;
          burstParticles.push({
            x: clickX,
            y: clickY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 2.8 + 1.5,
            alpha: 1.0,
            colorRgb: dotPalettes[k % dotPalettes.length],
            decay: Math.random() * 0.02 + 0.015
          });
        }
      }, { passive: true });

      let time = 0;
      const self = this;

      function renderBioCanvas() {
        ctx.clearRect(0, 0, width, height);
        time += 0.02;

        const isDark = document.documentElement.classList.contains('dark');
        const scrollBoost = Math.min(Math.abs(self.scrollVelocity) * 0.08, 2.5);

        // Draw Click Shockwaves & push dots along wave front
        for (let s = shockwaves.length - 1; s >= 0; s--) {
          const sw = shockwaves[s];
          sw.radius += 7.2;
          sw.alpha *= 0.92;
          if (sw.alpha < 0.02 || sw.radius > 420) {
            shockwaves.splice(s, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(52, 211, 153, ${sw.alpha * 0.8})`;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }

        // Draw & Update Burst Dispersion Particles
        for (let b = burstParticles.length - 1; b >= 0; b--) {
          const bp = burstParticles[b];
          bp.x += bp.vx;
          bp.y += bp.vy;
          bp.vx *= 0.92;
          bp.vy *= 0.92;
          bp.alpha -= bp.decay;

          if (bp.alpha <= 0.01) {
            burstParticles.splice(b, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(bp.x, bp.y, bp.radius * bp.alpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${bp.colorRgb}, ${bp.alpha})`;
          ctx.shadowColor = `rgba(${bp.colorRgb}, 0.8)`;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw Micro-Bio Elements (DNA mini rungs & Benzene rings)
        for (let m = 0; m < microBio.length; m++) {
          const mb = microBio[m];
          mb.x += mb.vx * (1 + scrollBoost * 0.5);
          mb.y += mb.vy * (1 + scrollBoost * 0.5);
          mb.angle += mb.rotSpeed * (1 + scrollBoost);

          // Friction to settle after click blast
          mb.vx *= 0.96;
          mb.vy *= 0.96;
          mb.rotSpeed *= 0.98;
          if (Math.abs(mb.vx) < 0.25) mb.vx += (Math.random() - 0.5) * 0.05;
          if (Math.abs(mb.vy) < 0.25) mb.vy += (Math.random() - 0.5) * 0.05;

          if (mb.x < -30) mb.x = width + 30;
          if (mb.x > width + 30) mb.x = -30;
          if (mb.y < -30) mb.y = height + 30;
          if (mb.y > height + 30) mb.y = -30;

          ctx.save();
          ctx.translate(mb.x, mb.y);
          ctx.rotate(mb.angle);
          ctx.strokeStyle = `rgba(${mb.colorRgb}, ${mb.alpha * (isDark ? 1 : 0.8)})`;
          ctx.lineWidth = 1.2;

          if (mb.type === 'benzene') {
            const r = mb.size;
            ctx.beginPath();
            for (let k = 0; k < 6; k++) {
              const a = (k * Math.PI) / 3;
              const px = r * Math.cos(a);
              const py = r * Math.sin(a);
              if (k === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          } else {
            const r = mb.size * 0.7;
            ctx.beginPath();
            ctx.moveTo(-r, -r);
            ctx.lineTo(r, -r);
            ctx.moveTo(-r, r);
            ctx.lineTo(r, r);
            ctx.moveTo(-r, 0);
            ctx.lineTo(r, 0);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Update & Render Quantum Dots with Relaxation
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.x += n.vx * (1 + scrollBoost);
          n.y += n.vy * (1 + scrollBoost);

          // Friction damping from click dispersion blast
          n.vx *= 0.94;
          n.vy *= 0.94;
          if (Math.abs(n.vx) < 0.4) n.vx += (Math.random() - 0.5) * 0.08;
          if (Math.abs(n.vy) < 0.4) n.vy += (Math.random() - 0.5) * 0.08;

          // Relax expanded radius
          if (n.baseRadius > 2.5) n.baseRadius *= 0.98;

          if (n.x < -10) n.x = width + 10;
          if (n.x > width + 10) n.x = -10;
          if (n.y < -10) n.y = height + 10;
          if (n.y > height + 10) n.y = -10;

          // Mouse gentle deflection
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 32400 && distSq > 4) { // 180px
            const dist = Math.sqrt(distSq);
            n.x -= (dx / dist) * 0.85;
            n.y -= (dy / dist) * 0.85;
          }

          n.phase += 0.025;
          const pulse = (Math.sin(n.phase) + 1) * 0.45;
          const dynamicRad = (n.baseRadius + pulse) * (1 + scrollBoost * 0.2);

          ctx.beginPath();
          ctx.arc(n.x, n.y, dynamicRad, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${n.colorRgb}, ${n.alpha * (isDark ? 1 : 0.8)})`;
          ctx.fill();

          // Connect adjacent nodes
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dX = n.x - n2.x;
            const dY = n.y - n2.y;
            const dSq = dX * dX + dY * dY;
            if (dSq < 19600) { // 140px
              const d = Math.sqrt(dSq);
              const lineAlpha = (1 - d / 140) * 0.26;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.strokeStyle = `rgba(${n.colorRgb}, ${lineAlpha})`;
              ctx.lineWidth = 0.85;
              ctx.stroke();
            }
          }
        }

        // Synaptic beam to mouse
        if (mouse.x > 0 && mouse.y > 0) {
          let beams = 0;
          for (let i = 0; i < nodes.length && beams < 4; i++) {
            const dX = nodes[i].x - mouse.x;
            const dY = nodes[i].y - mouse.y;
            const dSq = dX * dX + dY * dY;
            if (dSq < 32400) { // 180px
              const d = Math.sqrt(dSq);
              const alpha = (1 - d / 180) * 0.6;
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = `rgba(${nodes[i].colorRgb}, ${alpha})`;
              ctx.lineWidth = 1.2;
              ctx.stroke();

              // Photon pulse traveling to mouse
              const progress = (time * 2.8 + beams * 0.35) % 1;
              const px = nodes[i].x + (mouse.x - nodes[i].x) * progress;
              const py = nodes[i].y + (mouse.y - nodes[i].y) * progress;
              ctx.beginPath();
              ctx.arc(px, py, 2.5, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${nodes[i].colorRgb}, ${alpha * 1.5})`;
              ctx.fill();

              beams++;
            }
          }
        }

        requestAnimationFrame(renderBioCanvas);
      }
      requestAnimationFrame(renderBioCanvas);
    },

    initScrollReadingProgress: function() {
      let bar = document.getElementById('scroll-progress-bar');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'scroll-progress-bar';
        if (document.body) document.body.appendChild(bar);
      }
      window.addEventListener('scroll', () => {
        const top = window.pageYOffset || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = height > 0 ? (top / height) * 100 : 0;
        if (bar) bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      }, { passive: true });
    },

    // ======================================================================
    // 3. SCROLL-DRIVEN MEDIA SCALING & CHROMATIC DYNAMICS
    // ======================================================================
    initScrollDrivenAnimations: function() {
      const self = this;
      let lastScrollTime = performance.now();

      window.addEventListener('scroll', () => {
        const now = performance.now();
        const currentY = window.pageYOffset || document.documentElement.scrollTop;
        const dt = Math.max(now - lastScrollTime, 16);
        const dy = currentY - self.lastScrollY;

        self.scrollVelocity = dy / (dt / 16);
        self.lastScrollY = currentY;
        lastScrollTime = now;

        // Subtly parallax the dot matrix backdrop
        const dotGrid = document.getElementById('bg-dots-grid');
        if (dotGrid) {
          dotGrid.style.transform = `translate3d(0, ${(currentY * 0.08) % 28}px, 0)`;
        }

        // Notify 3D Molecular Simulation Models to interact with scroll
        if (window.Bio3D && typeof window.Bio3D.onScrollVelocity === 'function') {
          window.Bio3D.onScrollVelocity(self.scrollVelocity);
        }

        // Apply media zooming / elevation to visible cards & media
        self.updateScrollMediaProximity();

        clearTimeout(self.scrollTimer);
        self.scrollTimer = setTimeout(() => {
          self.scrollVelocity = 0;
        }, 120);
      }, { passive: true });
    },

    updateScrollMediaProximity: function() {
      const vh = window.innerHeight;
      const centerY = vh / 2;

      const mediaElements = document.querySelectorAll('.interactive-card, .portal-card, canvas[data-bio-3d], .spotlight-card, .scroll-zoom-media');
      mediaElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top > vh || rect.bottom < 0) return;

        const elemCenter = rect.top + rect.height / 2;
        const distFromCenter = Math.abs(elemCenter - centerY);
        const proximity = Math.max(0, 1 - (distFromCenter / (vh * 0.75)));

        if (proximity > 0.65) {
          el.classList.add('scroll-zoom-active');
        } else {
          el.classList.remove('scroll-zoom-active');
        }
      });
    },

    initScrollReveal: function() {
      if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach(el => el.classList.add('active'));
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('active');
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

      document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
      window.observeReveals = () => {
        document.querySelectorAll('.reveal:not(.active), .reveal-scale:not(.active), .reveal-left:not(.active), .reveal-right:not(.active)')
          .forEach(el => observer.observe(el));
      };
    },

    initCardInteractions: function() {
      // Click Ripple
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, .interactive-card, .domain-pill, a.shadcn-btn, .clickable-pill, .btn-forest, .btn-sunset, .btn-hospital-purple, .btn-public-rainbow, .portal-card');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const circle = document.createElement('span');
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - rect.left - radius}px`;
        circle.style.top = `${e.clientY - rect.top - radius}px`;
        circle.classList.add('ripple-circle');
        circle.style.backgroundColor = 'rgba(16, 185, 129, 0.32)';

        if (window.getComputedStyle(btn).position === 'static') {
          btn.style.position = 'relative';
        }
        btn.style.overflow = 'hidden';

        const existing = btn.querySelector('.ripple-circle');
        if (existing) existing.remove();

        btn.appendChild(circle);
        setTimeout(() => circle.remove(), 550);
      });
    }
  };

  // Auto-init on DOM ready
  function initInteractiveSuite() {
    PointerEngine.init();
    AmbientEngine.init();
  }

  window.PointerEngine = PointerEngine;
  window.AmbientEngine = AmbientEngine;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initInteractiveSuite);
    } else {
      initInteractiveSuite();
    }
  }
})(window, document);

