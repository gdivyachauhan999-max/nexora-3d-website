/* ===================================================================
   NEXORA — Premium Application Script
   Loader · Cursor trails · Magnetic buttons · Scroll reveals
   Counter animations · FAQ · Testimonial marquee · Contact form
=================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  const phases = [
    'Initializing neural core…',
    'Calibrating node lattice…',
    'Mapping signal pathways…',
    'Synchronizing data streams…',
    'System ready.',
  ];

  document.addEventListener('DOMContentLoaded', () => {
    // Start loader canvas immediately
    if (window.NexoraScenes) window.NexoraScenes.initLoaderCanvas();

    initLoader();
    initCursor();
    initNavbar();
    initScrollProgress();
    initMobileMenu();
    initBackToTop();
    initFAQ();
    initContactForm();
    initFooterYear();

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }
  });

  // -----------------------------------------------------------------
  // LOADING SCREEN
  // -----------------------------------------------------------------
  function initLoader() {
    const loader = document.getElementById('loader');
    const fill = document.getElementById('loaderBarFill');
    const glow = document.getElementById('loaderBarGlow');
    const percentEl = document.getElementById('loaderPercent');
    const phaseEl = document.getElementById('loaderPhase');

    document.body.style.overflow = 'hidden';

    let progress = 0;
    const totalDuration = prefersReducedMotion ? 300 : 1600;
    const startTime = performance.now();
    let lastPhaseIdx = -1;

    function tick(now) {
      const elapsed = now - startTime;
      // Non-linear: fast to 70%, then slows, then rushes at 90%
      const raw = elapsed / totalDuration;
      progress = Math.min(100, Math.round(easeLoading(raw) * 100));

      fill.style.width = progress + '%';
      if (glow) {
        glow.style.left = Math.max(0, progress - 5) + '%';
        glow.style.opacity = progress < 98 ? '0.8' : '0';
      }
      percentEl.textContent = progress + '%';

      const phaseIdx = Math.min(phases.length - 1, Math.floor((progress / 100) * phases.length));
      if (phaseIdx !== lastPhaseIdx && phaseEl) {
        phaseEl.textContent = phases[phaseIdx];
        lastPhaseIdx = phaseIdx;
      }

      if (progress < 100) {
        requestAnimationFrame(tick);
      } else {
        finishLoading();
      }
    }

    requestAnimationFrame(tick);

    function finishLoading() {
      let heroScene = null;

      if (window.NexoraScenes) {
        heroScene = window.NexoraScenes.initHeroScene();
        window.NexoraScenes.initDemoScene();
        window.__nexoraHeroScene = heroScene;
      }

      if (window.NexoraNCC) {
        window.NexoraNCC.init();
      }

      // Fade ambient orbs in
      const ambientBg = document.querySelector('.ambient-bg');
      if (ambientBg) setTimeout(() => ambientBg.classList.add('is-ready'), 400);

      setTimeout(() => {
        loader.classList.add('loader-exit');
        document.body.style.overflow = '';

        loader.addEventListener('transitionend', () => {
          if (loader.parentNode) loader.remove();
        }, { once: true });
        setTimeout(() => { if (loader.parentNode) loader.remove(); }, 1000);

        playHeroEntrance();
        initScrollAnimations(heroScene);
        initCounters();
        initMagneticButtons();
        initTiltCards();
        initStatRings();
        initClickRipple();
      }, 280);
    }
  }

  function easeLoading(t) {
    // Fast start, lingering middle, quick end
    if (t < 0.6) return t * 1.1;
    if (t < 0.9) return 0.66 + (t - 0.6) * 0.5;
    return Math.min(1, 0.81 + (t - 0.9) * 1.9);
  }

  // -----------------------------------------------------------------
  // HERO ENTRANCE
  // -----------------------------------------------------------------
  function playHeroEntrance() {
    if (!window.gsap) {
      document.querySelectorAll('.reveal-up, .reveal-float').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    gsap.set('.reveal-line', { y: '110%' });
    gsap.set('.hero-eyebrow, .hero-sub, .hero-actions, .hero-meta', { opacity: 0, y: 24 });
    gsap.set('.reveal-float', { opacity: 0, y: 20 });

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.8 })
      .to('.reveal-line', { y: 0, duration: 1, stagger: 0.14, ease: 'power4.out' }, '-=0.5')
      .to('.hero-sub', { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
      .to('.hero-actions', { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
      .to('.hero-meta', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
      .to('.panel-tl', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.3')
      .to('.panel-tr', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.8')
      .to('.panel-br', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.8');
  }

  // -----------------------------------------------------------------
  // CUSTOM CURSOR with trailing dots
  // -----------------------------------------------------------------
  function initCursor() {
    if (isTouch) return;
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;

    // Trail state
    const trailHistory = Array.from({ length: 8 }, () => ({ x: mouseX, y: mouseY }));
    let trailEls = [];

    // Create trail dots
    const trailContainer = document.querySelector('.cursor-trail-container');
    if (trailContainer) {
      for (let i = 0; i < 8; i++) {
        const d = document.createElement('div');
        d.style.cssText = `
          position: fixed; width: 3px; height: 3px;
          border-radius: 50%; pointer-events: none; z-index: 9996;
          background: rgba(109,91,255,${0.5 - i * 0.06});
          transform: translate(-50%, -50%);
          transition: none;
        `;
        document.body.appendChild(d);
        trailEls.push(d);
      }
    }

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';

      // Update trail
      trailHistory.unshift({ x: mouseX, y: mouseY });
      trailHistory.pop();
      trailEls.forEach((el, i) => {
        const pos = trailHistory[Math.min(i * 2, trailHistory.length - 1)];
        el.style.left = pos.x + 'px';
        el.style.top = pos.y + 'px';
        el.style.opacity = (1 - i / trailEls.length) * 0.6 + '';
      });

      requestAnimationFrame(animateRing);
    }
    animateRing();

    const interactors = 'a, button, [data-tilt], input, textarea, select, .ncc-cmd';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactors)) ring.classList.add('is-active');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactors)) ring.classList.remove('is-active');
    });
  }

  // -----------------------------------------------------------------
  // CLICK RIPPLE
  // -----------------------------------------------------------------
  function initClickRipple() {
    const ripple = document.getElementById('clickRipple');
    if (!ripple || isTouch) return;

    window.addEventListener('click', (e) => {
      ripple.style.left = e.clientX + 'px';
      ripple.style.top = e.clientY + 'px';
      ripple.style.width = '0';
      ripple.style.height = '0';
      ripple.style.opacity = '1';

      if (window.gsap) {
        gsap.to(ripple, {
          width: 120, height: 120,
          opacity: 0, duration: 0.8, ease: 'power2.out',
          onComplete: () => { ripple.style.opacity = '0'; }
        });
      }
    });
  }

  // -----------------------------------------------------------------
  // NAVBAR
  // -----------------------------------------------------------------
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // -----------------------------------------------------------------
  // SCROLL PROGRESS
  // -----------------------------------------------------------------
  function initScrollProgress() {
    const fill = document.getElementById('scrollProgressFill');
    const glow = document.getElementById('scrollProgressGlow');
    if (!fill) return;

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (scrollTop / docH) * 100 : 0;
      fill.style.width = pct + '%';
      if (glow) glow.style.right = (100 - pct) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  // -----------------------------------------------------------------
  // MOBILE MENU
  // -----------------------------------------------------------------
  function initMobileMenu() {
    const burger = document.getElementById('navBurger');
    const menu = document.getElementById('mobileMenu');
    if (!burger || !menu) return;

    const close = () => {
      menu.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    burger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      burger.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
  }

  // -----------------------------------------------------------------
  // SCROLL ANIMATIONS
  // -----------------------------------------------------------------
  function initScrollAnimations(heroScene) {
    if (!window.gsap || !window.ScrollTrigger) {
      document.querySelectorAll('.reveal-up').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    // Generic section reveals
    document.querySelectorAll('.section').forEach((section) => {
      const targets = section.querySelectorAll('.reveal-up');
      if (!targets.length) return;
      gsap.to(targets, {
        opacity: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none reverse' },
      });
    });

    // Service cards staggered
    gsap.utils.toArray('.service-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 28, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.75, delay: (i % 4) * 0.09, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
        }
      );
    });

    // Work cards
    gsap.utils.toArray('.work-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.75, delay: (i % 3) * 0.11, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
        }
      );
    });

    // Pricing cards with scale
    gsap.utils.toArray('.pricing-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 36, scale: 0.96 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.75, delay: i * 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
        }
      );
    });

    // Solution rows
    gsap.utils.toArray('.solution-row').forEach((row) => {
      gsap.fromTo(row,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: row, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );
    });

    // Hero parallax
    if (heroScene && heroScene.scrollState) {
      ScrollTrigger.create({
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => { heroScene.scrollState.progress = self.progress; },
      });

      gsap.to('.hero-content', {
        opacity: 0.15, y: -70,
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    // NCC section reveal
    ScrollTrigger.create({
      trigger: '.neural-command',
      start: 'top 75%',
      onEnter: () => {
        gsap.fromTo('.ncc-sidebar, .ncc-canvas-wrap',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out' }
        );
      },
      once: true,
    });

    ScrollTrigger.refresh();
  }

  // -----------------------------------------------------------------
  // ANIMATED COUNTERS
  // -----------------------------------------------------------------
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    counters.forEach((el) => {
      const target = parseFloat(el.dataset.target);

      const run = () => {
        if (prefersReducedMotion) { el.textContent = target; return; }
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target, duration: 2, ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(obj.val); },
        });
      };

      if (window.ScrollTrigger) {
        ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: run });
      } else {
        run();
      }
    });
  }

  // -----------------------------------------------------------------
  // STAT RING ANIMATIONS
  // -----------------------------------------------------------------
  function initStatRings() {
    const rings = document.querySelectorAll('.stat-ring');
    rings.forEach((ring) => {
      const pct = parseInt(ring.dataset.pct || '80', 10);
      const circle = ring.querySelector('.stat-ring-fill');
      if (!circle) return;
      const circumference = 150.8;
      const offset = circumference - (pct / 100) * circumference;

      if (window.ScrollTrigger) {
        ScrollTrigger.create({
          trigger: ring,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(circle, {
              strokeDashoffset: offset, duration: 1.6, ease: 'power2.out',
            });
          },
        });
      } else {
        circle.style.strokeDashoffset = offset;
      }
    });
  }

  // -----------------------------------------------------------------
  // MAGNETIC BUTTONS
  // -----------------------------------------------------------------
  function initMagneticButtons() {
    if (isTouch || prefersReducedMotion) return;
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.32;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.38;
        gsap.to(btn, { x, y, duration: 0.4, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  // -----------------------------------------------------------------
  // TILT CARDS
  // -----------------------------------------------------------------
  function initTiltCards() {
    if (isTouch || prefersReducedMotion) return;
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotateX: py * -7, rotateY: px * 7,
          duration: 0.45, ease: 'power2.out', transformPerspective: 700,
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
      });
    });
  }

  // -----------------------------------------------------------------
  // FAQ ACCORDION
  // -----------------------------------------------------------------
  function initFAQ() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach((btn) => {
      btn.addEventListener('click', () => {
        const answer = btn.nextElementSibling;
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        questions.forEach((other) => {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            other.nextElementSibling.style.maxHeight = null;
          }
        });

        btn.setAttribute('aria-expanded', String(!isOpen));
        answer.style.maxHeight = isOpen ? null : answer.scrollHeight + 'px';
      });
    });
  }

  // -----------------------------------------------------------------
  // BACK TO TOP
  // -----------------------------------------------------------------
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // -----------------------------------------------------------------
  // CONTACT FORM
  // -----------------------------------------------------------------
  function initContactForm() {
    const form = document.getElementById('contactForm');
    const successEl = document.getElementById('formSuccess');
    const submitLabel = document.getElementById('formSubmitLabel');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const submitBtn = form.querySelector('.form-submit');
      submitBtn.disabled = true;
      submitLabel.textContent = 'Sending…';

      setTimeout(() => {
        submitLabel.textContent = 'Send message';
        submitBtn.disabled = false;
        successEl.classList.add('is-visible');
        form.reset();
        setTimeout(() => successEl.classList.remove('is-visible'), 6000);
      }, 1000);
    });

    // Input focus glow
    form.querySelectorAll('input, textarea, select').forEach((field) => {
      field.addEventListener('focus', () => {
        if (window.gsap) gsap.to(field, { borderColor: 'rgba(139,124,255,0.6)', duration: 0.3 });
      });
    });
  }

  // -----------------------------------------------------------------
  // FOOTER YEAR
  // -----------------------------------------------------------------
  function initFooterYear() {
    const el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getFullYear();
  }
})();