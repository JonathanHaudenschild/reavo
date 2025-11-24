// CPR Simulator UI: listens for cprFeedback events and updates health bar
(function () {
  let health = 100; // 100..0 (starts at 100, decays to 0)
  let reviveProgress = 0; // 0..100 (progress towards success)
  let decayTimer = null;
  let soundEnabled = true;
  let isRevived = false;
  const isCprActive = () => {
    const modal = document.getElementById("cpr-modal");
    if (!modal) return true; // allow interaction on non-modal layouts
    const ariaHidden = modal.getAttribute("aria-hidden");
    return (
      modal.classList.contains("is-open") ||
      (ariaHidden && ariaHidden.toLowerCase() === "false")
    );
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function setHealth(n) {
    health = clamp(n, 0, 100);
    const fill = document.getElementById("health-bar-fill");
    const val = document.getElementById("health-value");
    if (fill) {
      fill.style.width = health + "%";
      // Change color based on health level
      fill.classList.remove("low", "critical");
      if (health <= 30) {
        fill.classList.add("critical");
      } else if (health <= 60) {
        fill.classList.add("low");
      }
    }
    if (val) val.textContent = Math.round(health) + "%";

    // Game over if health reaches 0
    if (health <= 0 && !isRevived) {
      gameOver();
    }
  }

  function setReviveProgress(n) {
    reviveProgress = clamp(n, 0, 100);
    const rp = document.getElementById("revive-progress");
    if (rp) {
      const pct = Math.max(0, Math.min(100, reviveProgress));
      rp.style.setProperty("--revive-pct", pct + "%");
    }

    // Success if progress reaches 100
    if (reviveProgress >= 100 && !isRevived) {
      success();
    }
  }

  function success() {
    isRevived = true;
    stopDecay();

    // Show success message
    const successMsg = document.getElementById("success-message");
    if (successMsg) {
      successMsg.classList.remove("hidden");
    }

    // Hide revive progress
    const rp = document.getElementById("revive-progress");
    if (rp) rp.classList.add("hidden");

    // Success sound
    if (soundEnabled) {
      beep(880, 120);
      setTimeout(() => beep(1175, 120), 150);
      setTimeout(() => beep(1568, 180), 320);
    }
  }

  function gameOver() {
    isRevived = true; // Prevent further clicks
    stopDecay();

    // Show game over message
    const gameOverMsg = document.getElementById("gameover-message");
    if (gameOverMsg) {
      gameOverMsg.classList.remove("hidden");
    }

    // Hide revive progress
    const rp = document.getElementById("revive-progress");
    if (rp) rp.classList.add("hidden");

    // Game over sound
    if (soundEnabled) {
      beep(200, 300);
      setTimeout(() => beep(150, 400), 350);
    }
  }

  function reset() {
    isRevived = false;
    health = 100;
    reviveProgress = 0;
    setHealth(100);
    setReviveProgress(0);

    // Hide success message
    const successMsg = document.getElementById("success-message");
    if (successMsg) {
      successMsg.classList.add("hidden");
    }

    // Hide game over message
    const gameOverMsg = document.getElementById("gameover-message");
    if (gameOverMsg) {
      gameOverMsg.classList.add("hidden");
    }

    // Show revive progress
    const rp = document.getElementById("revive-progress");
    if (rp) rp.classList.remove("hidden");

    // Restart decay
    startDecay();
  }

  function setRingState(state) {
    const ring = document.getElementById("target-ring");
    if (!ring) return;
    ring.classList.remove("green", "blue", "red");
    if (state === "perfect") ring.classList.add("green");
    else if (state === "slow") ring.classList.add("blue");
    else if (state === "fast") ring.classList.add("red");
  }


  // Build a text-doodle overlay around the heart (no nodes/lines, just scattered chips)
  // REMOVED: Mindmap feature disabled
  // function initMindmap() { ... }

  function beep(freq = 440, duration = 120) {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      // quick attack/decay to avoid pops
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
      osc.start();
      osc.stop(now + duration / 1000 + 0.02);
      osc.onended = () => ctx.close();
    } catch (e) {}
  }

  function startDecay() {
    stopDecay();
    decayTimer = setInterval(() => {
      if (!isRevived) {
        setHealth(health - 6);
      }
    }, 1000); // Decay 6% per second
  }

  function stopDecay() {
    if (decayTimer) {
      clearInterval(decayTimer);
      decayTimer = null;
    }
  }

  function initCprSim() {
    setHealth(100);
    setReviveProgress(0);
    if (isCprActive()) {
      startDecay();
    } else {
      stopDecay();
    }
    // Parallax background follows cursor subtly (only if simulator wrapper exists)
    const bg = document.querySelector(".cpr-bg");
    if (bg) {
      window.addEventListener("mousemove", (e) => {
        const { innerWidth: w, innerHeight: h } = window;
        const x = (e.clientX / w) * 100;
        const y = (e.clientY / h) * 100;
        bg.style.setProperty("--x1", `${20 + x * 0.3}%`);
        bg.style.setProperty("--y1", `${15 + y * 0.2}%`);
        bg.style.setProperty("--x2", `${60 + x * 0.3}%`);
        bg.style.setProperty("--y2", `${70 + y * 0.2}%`);
      });
    }
    // Allow taps anywhere in the heart panel – capture phase to avoid any overlay timing quirks
    const press = (ev) => {
      if (!isCprActive()) return;
      const root = document.querySelector(".sim-heart");
      if (!root) return;
      // Ignore clicks on controls like the sound button
      if (ev.target && ev.target.closest && ev.target.closest(".sound-btn"))
        return;
      // If the pointer is inside the heart panel rect, count it
      const r = root.getBoundingClientRect();
      const x = (ev.touches && ev.touches[0]?.clientX) || ev.clientX;
      const y = (ev.touches && ev.touches[0]?.clientY) || ev.clientY;
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        try {
          if (window.__heart3d) {
            window.__heart3d.triggerHeartbeat();
          }
        } catch (e) {}
        document.dispatchEvent(
          new CustomEvent("heartClick", {
            detail: { position: null, source: "panel" },
          })
        );
      }
    };
    document.addEventListener("pointerdown", press, true);
    document.addEventListener("touchstart", press, {
      capture: true,
      passive: true,
    });

    // Immediate click feedback: pulse ring and tick
    const handleHeartClick = () => {
      if (!isCprActive()) return;
      const ring = document.getElementById("target-ring");
      if (ring) {
        ring.classList.remove("pulse");
        void ring.offsetWidth;
        ring.classList.add("pulse");
      }
      beep(560, 36);
    };
    document.addEventListener("heartClick", handleHeartClick);
    const soundBtn = document.getElementById("sound-btn");
    if (soundBtn) {
      // Initialize visual state
      soundBtn.classList.toggle("is-muted", !soundEnabled);
      let lastSoundToggle = 0;
      const toggleSound = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        const now = Date.now();
        if (now - lastSoundToggle < 200) return; // debounce multiple event types (pointer+click/touch)
        lastSoundToggle = now;
        soundEnabled = !soundEnabled;
        soundBtn.setAttribute("aria-pressed", String(soundEnabled));
        soundBtn.setAttribute(
          "aria-label",
          soundEnabled ? "Mute sound" : "Unmute sound"
        );
        soundBtn.classList.toggle("is-muted", !soundEnabled);
        // give a quick confirmation tick
        if (soundEnabled) beep(700, 70);
      };
      // Use pointerdown for mouse/pointer; touchstart for older mobile; avoid click to prevent double-toggle
      soundBtn.addEventListener("pointerdown", toggleSound);
      soundBtn.addEventListener("touchstart", toggleSound, { passive: false });
      soundBtn.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          // space or enter
          toggleSound(e);
        }
      });
    }

    // Smooth in-view reveal for sections/cards
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && revealEls.length) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              io.unobserve(e.target);
            }
          }
        },
        { threshold: 0.15 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }

    // Smooth scroll for header anchors
    document.querySelectorAll('.site-nav a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (ev) => {
        const id = a.getAttribute("href");
        const tgt = id && document.querySelector(id);
        if (tgt) {
          ev.preventDefault();
          tgt.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    // Header shrink + hero micro-motion on scroll
    const header = document.querySelector(".site-header");
    const sim = document.querySelector(".cpr-sim");
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      if (header) header.classList.toggle("shrunk", y > 24);
      if (sim)
        sim.style.setProperty(
          "--scroll",
          Math.min(1, Math.max(0, y / 300)).toString()
        );
      const bg = document.querySelector(".cpr-bg");
      if (bg) {
        const yPct = Math.min(100, 15 + y * 0.02);
        bg.style.setProperty("--y1", yPct + "%");
        bg.style.setProperty("--y2", 70 + y * 0.02 + "%");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Reset button (final score panel)
    const resetBtn = document.getElementById("reset-all");
    if (resetBtn) {
      resetBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        // Scroll to top first
        try {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (e) {
          window.scrollTo(0, 0);
        }
        // Dispatch global reset after a brief delay to let scroll start
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent("cprReset"));
        }, 100);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCprSim);
  } else {
    initCprSim();
  }

  document.addEventListener("cprReset", () => {
    reset();
  });

  document.addEventListener("cprFeedback", (e) => {
    if (!isCprActive()) return;
    const { status, bpm } = e.detail || {};

    // If already revived, clicking resets
    if (isRevived) {
      reset();
      return;
    }

    setRingState(status);

    // Update revive progress based on compression quality
    if (status === "perfect") {
      setReviveProgress(reviveProgress + 7); // Good compression adds progress
      beep(880, 80);
    } else if (status === "slow" || status === "fast") {
      setReviveProgress(reviveProgress - 3); // Bad compression reduces progress
      beep(330, 60);
    }

    // Pulse the target ring
    const ring = document.getElementById("target-ring");
    if (ring) {
      ring.classList.remove("pulse");
      void ring.offsetWidth;
      ring.classList.add("pulse");
    }
  });

  document.addEventListener("cprModalOpen", () => {
    reset();
  });

  document.addEventListener("cprModalClose", () => {
    stopDecay();
  });
})();
