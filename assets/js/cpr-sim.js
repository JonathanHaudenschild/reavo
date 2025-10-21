// CPR Simulator UI: listens for cprFeedback events and updates the life meter and visuals
(function () {
  let life = 0; // 0..100
  let decayTimer = null;
  let soundEnabled = true;
  let heartbeatTimer = null; // repeating beat sound after revive
  // Score state
  let scoreBeats = 0;
  let scoreStartTime = null;
  let scoreEndTime = null;
  let scoreDevSum = 0; // sum of absolute deviations from 110 BPM
  let scoreSamples = 0;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
  function setLife(n) {
    life = clamp(n, 0, 100);
    const fill = document.getElementById("life-fill");
    const val = document.getElementById("life-value");
    if (fill) fill.style.width = life + "%";
    if (val) val.textContent = Math.round(life) + "%";
    // Update circular progress ring via CSS variable consumed by ::before
    const rp = document.getElementById("revive-progress");
    if (rp) {
      const pct = Math.max(0, Math.min(100, life));
      rp.style.setProperty("--revive-pct", pct + "%");
    }
  }

  function setPatientState(state) {
    const patient = document.querySelector(".patient");
    const status = document.getElementById("patient-status");
    if (!patient || !status) return;
    patient.classList.remove("ok", "slow", "fast");
    if (state === "perfect") {
      patient.classList.add("ok");
      status.textContent = "Reviving";
    } else if (state === "slow") {
      patient.classList.add("slow");
      status.textContent = "Too Slow";
    } else if (state === "fast") {
      patient.classList.add("fast");
      status.textContent = "Too Fast";
    } else {
      status.textContent = "Stabilizing…";
    }
  }

  function setRingState(state) {
    const ring = document.getElementById("target-ring");
    if (!ring) return;
    ring.classList.remove("green", "blue", "red");
    if (state === "perfect") ring.classList.add("green");
    else if (state === "slow") ring.classList.add("blue");
    else if (state === "fast") ring.classList.add("red");
  }

  function celebrateRevive(successBpm) {
    const sim = document.querySelector(".cpr-sim");
    if (!sim) return;
    const burst = document.createElement("div");
    burst.className = "revive-burst";
    sim.appendChild(burst);
    setTimeout(() => burst.remove(), 1000);
    // Success sound (triad)
    if (soundEnabled) {
      beep(880, 120);
      setTimeout(() => beep(1175, 120), 150);
      setTimeout(() => beep(1568, 180), 320);
    }
    // Hide the progress pie once revived
    const rp = document.getElementById("revive-progress");
    if (rp) rp.classList.add("hidden");
    // Start subtle heartbeat sound matching BPM
    startBeatSound(Math.max(80, Math.min(140, successBpm || 110)));
    // Hide mindmap to keep focus on revived heart
    const mm = document.getElementById("mindmap-overlay");
    if (mm) mm.classList.add("hidden");
    // Smooth scroll to main content card after a short delay
    const target =
      document.querySelector("#about .info-hero") ||
      document.querySelector(".info-hero");
    if (target && typeof target.scrollIntoView === "function") {
      setTimeout(() => {
        try {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (e) {}
      }, 450);
    }
  }

  function flashFlatline() {
    const sim = document.querySelector(".cpr-sim");
    if (!sim) return;
    const flash = document.createElement("div");
    flash.className = "flatline-flash";
    sim.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
  }

  function startBeatSound(bpm) {
    stopBeatSound();
    const interval = Math.max(280, Math.round(60000 / bpm));
    // Kick-like thump: low frequency short envelope
    heartbeatTimer = setInterval(() => {
      if (!soundEnabled) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        const now = ctx.currentTime;
        // down-swept thump
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start();
        osc.stop(now + 0.12);
        osc.onended = () => ctx.close();
      } catch (e) {}
    }, interval);
  }

  function stopBeatSound() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  // Build a text-doodle overlay around the heart (no nodes/lines, just scattered chips)
  function initMindmap() {
    const wrap = document.getElementById("mindmap-overlay");
    const root = document.querySelector(".sim-heart .heart-container");
    if (!wrap || !root) return;
    // Clear previous
    wrap.innerHTML = "";
    const rect = root.getBoundingClientRect();
    // Exclusion center/radius based on the actual ring position/size
    const ring = document.getElementById("target-ring");
    let cx = rect.width / 2,
      cy = rect.height / 2;
    let excludeR = Math.min(rect.width, rect.height) * 0.2; // fallback
    if (ring) {
      const rr = ring.getBoundingClientRect();
      const ringRadius = Math.min(rr.width, rr.height) / 2;
      cx = rr.left - rect.left + rr.width / 2;
      cy = rr.top - rect.top + rr.height / 2;
      excludeR = ringRadius; // generous gap around the heart+ring
    }
    const phrases = [
      "Help!",
      "I can't breathe",
      "Call ambulance",
      "Is there a doctor?",
      "Stay with me",
      "Check breathing",
      "Call 112",
      "Don't panic",
      "CPR now",
      "You okay?",
      "Need help",
      "Emergency",
      "Breathe",
      "Stay calm",
      "Press hard",
    ];
    // Fill the entire container with scattered chips (excluding heart+ring area)
    // Density scaled to area (bounded)
    const area = rect.width * rect.height;
    const count = Math.min(40, Math.max(20, Math.round(area / 9000)));
    let idx = 0;
    for (let i = 0; i < count; i++) {
      let rx = 0,
        ry = 0,
        tries = 0;
      // Try positions until we find one not too close to center
      do {
        rx = Math.random() * rect.width;
        ry = Math.random() * rect.height;
        tries++;
        if (tries > 20) break; // fail-safe
      } while (Math.hypot(rx - cx, ry - cy) < excludeR);
      const span = document.createElement("span");
      span.className =
        "doodle-text" + (i % 5 === 0 ? " alt" : i % 7 === 0 ? " warn" : "");
      span.textContent = phrases[idx++ % phrases.length];
      span.style.left = rx + "px";
      span.style.top = ry + "px";
      span.style.setProperty(
        "--rot",
        (Math.random() * 28 - 14).toFixed(1) + "deg"
      );
      span.style.setProperty(
        "--fs",
        (12 + Math.random() * 12).toFixed(0) + "px"
      );
      // Random wiggle timing pre-set for stagger effect on press
      span.style.setProperty(
        "--wdur",
        (0.5 + Math.random() * 0.7).toFixed(2) + "s"
      );
      span.style.setProperty(
        "--wdelay",
        (Math.random() * 0.2).toFixed(2) + "s"
      );
      wrap.appendChild(span);
    }
    // On each heartClick, animate a few random doodles
    document.addEventListener(
      "heartClick",
      () => {
        const chips = wrap.querySelectorAll(".doodle-text");
        if (!chips.length) return;
        const count = Math.max(2, Math.floor(chips.length * 0.12));
        for (let k = 0; k < count; k++) {
          const i = Math.floor(Math.random() * chips.length);
          const chip = chips[i];
          chip.classList.remove("wiggle");
          // force reflow to restart animation
          void chip.offsetWidth;
          chip.classList.add("wiggle");
          setTimeout(() => chip.classList.remove("wiggle"), 700);
        }
      },
      { passive: true }
    );
  }

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
      setLife(life - 1);
      if (life <= 0) {
        setLife(0);
        flashFlatline();
      }
    }, 1000);
  }
  function stopDecay() {
    if (decayTimer) {
      clearInterval(decayTimer);
      decayTimer = null;
    }
  }

  function initCprSim() {
    setLife(0);
    startDecay();
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
    document.addEventListener("heartClick", () => {
      const ring = document.getElementById("target-ring");
      if (ring) {
        ring.classList.remove("pulse");
        void ring.offsetWidth;
        ring.classList.add("pulse");
      }
      beep(560, 36);
    });
    // Build doodle overlay and keep it synced to size
    initMindmap();
    // Debounce util
    let _mmTO = null;
    const debouncedMindmap = () => {
      if (_mmTO) cancelAnimationFrame(_mmTO);
      _mmTO = requestAnimationFrame(() => initMindmap());
    };
    // ResizeObserver for precise container size changes
    const hc = document.querySelector(".sim-heart .heart-container");
    if (window.ResizeObserver && hc) {
      const ro = new ResizeObserver(() => debouncedMindmap());
      ro.observe(hc);
    }
    // Window resize fallback
    window.addEventListener("resize", debouncedMindmap, { passive: true });
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCprSim);
  } else {
    initCprSim();
  }

  document.addEventListener("cprReset", () => {
    setLife(0);
    setPatientState("idle");
    setRingState(null);
    const bg = document.querySelector(".cpr-bg");
    if (bg) bg.classList.remove("bg-perfect", "bg-slow", "bg-fast");
    const helper = document.getElementById("bpm-helper");
    if (helper) helper.textContent = "Tap to start";
    const tap = document.getElementById("tap-hint");
    if (tap) tap.style.opacity = "1";
    // Stop autonomous beating on reset
    try {
      if (window.__heart3d) window.__heart3d.setRevived(false);
    } catch (e) {}
    stopBeatSound();
    // Show mindmap again
    const mm = document.getElementById("mindmap-overlay");
    if (mm) mm.classList.remove("hidden");
    // Reset score
    scoreBeats = 0;
    scoreStartTime = null;
    scoreEndTime = null;
    scoreDevSum = 0;
    scoreSamples = 0;
    updateScoreUI(0);
    const finalPanel = document.getElementById("score-panel-final");
    if (finalPanel) finalPanel.classList.add("hidden");
  });

  document.addEventListener("cprFeedback", (e) => {
    const { status, bpm } = e.detail || {};
    setPatientState(status);
    setRingState(status);
    // Start score timing on first feedback
    if (scoreStartTime === null) scoreStartTime = Date.now();
    // Update score metrics if we have a BPM reading
    if (typeof bpm === "number" && !Number.isNaN(bpm)) {
      scoreBeats++;
      scoreSamples++;
      const dev = Math.abs(bpm - 110);
      scoreDevSum += dev;
      updateScoreLivePartial();
    }
    if (status === "perfect") {
      setLife(life + 8);
      beep(880, 80);
    } else if (status === "slow" || status === "fast") {
      setLife(life - 6);
      beep(330, 60);
    }

    if (life >= 100) {
      setLife(100);
      celebrateRevive(bpm);
      // Finalize score
      if (scoreEndTime === null) scoreEndTime = Date.now();
      finalizeScore();
      // Start autonomous beating and switch heart to revived color
      try {
        if (window.__heart3d)
          window.__heart3d.setRevived(
            true,
            Math.max(100, Math.min(120, bpm || 110))
          );
      } catch (e) {}
      stopDecay();
    }
    // Update background tone classes
    const bg = document.querySelector(".cpr-bg");
    if (bg) {
      bg.classList.remove("bg-perfect", "bg-slow", "bg-fast");
      bg.classList.add(`bg-${status}`);
    }
    // Update big BPM badge
    const bpmEl = document.getElementById("sim-bpm-number");
    if (bpmEl && typeof bpm === "number" && !Number.isNaN(bpm)) {
      bpmEl.textContent = bpm;
    }
    // Pulse the target ring subtly on each feedback
    const ring = document.getElementById("target-ring");
    if (ring) {
      ring.classList.remove("pulse");
      void ring.offsetWidth;
      ring.classList.add("pulse");
    }
    // Helper hint & tap label
    const helper = document.getElementById("bpm-helper");
    if (helper) {
      if (status === "perfect") helper.textContent = "✓ Good pace";
      else if (status === "slow") helper.textContent = "Faster";
      else if (status === "fast") helper.textContent = "Slower";
    }
    const tap = document.getElementById("tap-hint");
    if (tap) tap.style.opacity = "0";
  });

  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }
  function updateScoreLivePartial() {
    const accAvg = scoreSamples ? scoreDevSum / scoreSamples : 0; // avg abs deviation
    const accScore = (1 - clamp01(accAvg / 20)) * 100; // 0 at 20 BPM off, 100 at perfect
    const idealBeats = 13; // approximate number of presses to reach 100% at good pace
    const beatScore = scoreBeats ? clamp01(idealBeats / scoreBeats) * 100 : 0;
    const live = Math.round(accScore * 0.7 + beatScore * 0.3);
    updateScoreUI(live);
  }
  function finalizeScore() {
    const accAvg = scoreSamples ? scoreDevSum / scoreSamples : 0;
    const accScore = (1 - clamp01(accAvg / 20)) * 100;
    const idealBeats = 13;
    const beatScore = scoreBeats ? clamp01(idealBeats / scoreBeats) * 100 : 0;
    const elapsed =
      scoreEndTime && scoreStartTime
        ? (scoreEndTime - scoreStartTime) / 1000
        : 0;
    const targetTime = 15; // seconds
    const timeScore = elapsed ? clamp01(targetTime / elapsed) * 100 : 0;
    const total = Math.round(
      accScore * 0.5 + beatScore * 0.3 + timeScore * 0.2
    );
    updateScoreUI(total);
    bumpScoreBadge();
    const finalPanel = document.getElementById("score-panel-final");
    if (finalPanel) finalPanel.classList.remove("hidden");
  }
  function updateScoreUI(score) {
    const badge = document.getElementById("score-number");
    const panel = document.getElementById("score-value");
    if (badge) badge.textContent = String(score);
    if (panel) panel.textContent = String(score);
  }
  function bumpScoreBadge() {
    const badge = document.getElementById("score-badge");
    if (!badge) return;
    badge.classList.remove("bump");
    void badge.offsetWidth;
    badge.classList.add("bump");
  }
})();
