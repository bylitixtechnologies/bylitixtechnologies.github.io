// ============================================================
// Bylitix — shared interactions
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Mobile nav ---- */
  const burger = document.querySelector('.nav-burger');
  const links  = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      links.style.cssText = open
        ? 'display:flex; position:absolute; top:78px; left:0; right:0; background:var(--cream); flex-direction:column; padding:24px var(--pad); gap:20px; border-bottom:1px solid var(--line);'
        : '';
    });
  }

  /* ---- Hero bar chart: staggered rise ---- */
  document.querySelectorAll('.bar').forEach((bar, i) => {
    bar.style.animationDelay = `${i * 90}ms`;
  });
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.style.animationDelay = `${600 + i * 90}ms`;
  });

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.transition = 'opacity .8s cubic-bezier(.16,.84,.44,1), transform .8s cubic-bezier(.16,.84,.44,1)';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      io.observe(el);
    });
  }

  /* ---- "The Data" interactive section ---- */
  const canvas = document.getElementById('dataCanvas');
  if (canvas) {
    const nodes = Array.from(canvas.querySelectorAll('.data-node'));
    const edges = Array.from(canvas.querySelectorAll('.data-edge'));
    const buttons = document.querySelectorAll('.data-toggle button');

    // Three coordinate states, hand-placed on a 400x300 viewBox.
    const states = {
      raw: [
        [40,60],[95,110],[150,45],[210,140],[70,190],[260,80],
        [320,150],[190,220],[350,230],[120,250],[280,40],[360,110]
      ],
      structured: [
        [40,220],[75,180],[110,240],[145,140],[180,200],[215,90],
        [250,160],[285,60],[320,120],[355,40],[145,240],[285,240]
      ],
      insight: [] // computed below as an even circular layout
    };
    // Circular "insight/network" layout computed for even spacing
    const cx=200, cy=150, r=110, n=12, ins=[];
    for (let i=0;i<n;i++){
      const a = (Math.PI*2*i/n) - Math.PI/2;
      ins.push([cx + r*Math.cos(a), cy + r*Math.sin(a)]);
    }
    states.insight = ins;

    const edgePairs = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,0],[0,6],[3,9],[2,8]];

    function applyState(name){
      const pos = states[name];
      nodes.forEach((node, i) => {
        if (!pos[i]) return;
        node.setAttribute('cx', pos[i][0]);
        node.setAttribute('cy', pos[i][1]);
      });
      edges.forEach((edge, i) => {
        const [a,b] = edgePairs[i] || [0,1];
        const pa = pos[a], pb = pos[b];
        if (!pa || !pb) return;
        edge.setAttribute('x1', pa[0]); edge.setAttribute('y1', pa[1]);
        edge.setAttribute('x2', pb[0]); edge.setAttribute('y2', pb[1]);
        edge.style.opacity = name === 'raw' ? '0' : (name === 'insight' ? '0.85' : '0.35');
      });
      buttons.forEach(b => b.setAttribute('aria-pressed', b.dataset.state === name ? 'true' : 'false'));
    }

    buttons.forEach(btn => {
      btn.addEventListener('click', () => applyState(btn.dataset.state));
    });

    // Reveal into "raw" then step through automatically once when it enters view.
    let played = false;
    if ('IntersectionObserver' in window) {
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !played) {
            played = true;
            applyState('raw');
            setTimeout(() => applyState('structured'), 900);
            setTimeout(() => applyState('insight'), 2000);
          }
        });
      }, { threshold: 0.4 });
      io2.observe(canvas);
    } else {
      applyState('insight');
    }
  }

  /* ---- Footer year ---- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Form handling: send real Formspree submissions, keep UX for demo forms ---- */
  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      const isFormspreeForm = form.action && form.action.includes('formspree.io');

      if (!isFormspreeForm) {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          const original = btn.textContent;
          btn.textContent = 'Sent';
          setTimeout(() => { btn.textContent = original; form.reset(); }, 2200);
        }
        return;
      }

      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn ? btn.textContent : 'Send message';

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
      }

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Formspree request failed');
        }

        form.reset();
        if (btn) {
          btn.textContent = 'Sent';
        }
      } catch (error) {
        console.error('Form submission failed:', error);
        if (btn) {
          btn.textContent = 'Try again';
        }
      } finally {
        if (btn) {
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = original;
          }, 2200);
        }
      }
    });
  });

});
