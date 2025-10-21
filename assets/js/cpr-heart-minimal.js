class CPRHeartMinimal {
  constructor() {
    this.clicks = [];
    this.targetBPM = { min: 100, max: 120 };
    this.currentStatus = 'idle';
    this.lastEventTs = 0;
    this.refractoryMs = 220; // ignore back-to-back taps within this window
    this.smoothedBPM = null;
    this.smoothingAlpha = 0.35; // EMA smoothing factor
    
    this.init();
  }
  
  init() {
    // Listen for 3D heart clicks
    document.addEventListener('heartClick', (e) => this.handleHeartClick(e));
    // Listen for global reset to clear internal state
    document.addEventListener('cprReset', () => this.reset());
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
  }
  
  handleHeartClick(e) {
    const now = Date.now();
    // Refractory period to avoid double-counting (e.g., pointerdown + touchstart)
    if (now - this.lastEventTs < this.refractoryMs) return;
    this.lastEventTs = now;
    this.clicks.push(now);
    // No BPM badge reveal (badge removed from UI)
    
    // 3D heart animation
    this.triggerHeartbeat3D();
    this.createParticleBurst3D(e);
    
    // Keep only clicks from last 10 seconds
    this.clicks = this.clicks.filter(click => now - click <= 10000);
    
    if (this.clicks.length >= 2) {
      // small delay to simulate realistic sensing latency
      setTimeout(() => this.calculateBPM(), 80);
    }
  }
  
  triggerHeartbeat3D() {
    const heart = document.getElementById('cpr-heart');
    if (!heart) return;
    
    heart.classList.remove('pulse');
    setTimeout(() => heart.classList.add('pulse'), 10);
    setTimeout(() => heart.classList.remove('pulse'), 800);
  }
  
  createParticleBurst3D(e) {
    const container = document.querySelector('.heart-container') || document.getElementById('cpr-heart')?.parentElement || document.body;
    
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '6px';
      particle.style.height = '6px';
      particle.style.background = `linear-gradient(45deg, 
        ${i % 4 === 0 ? '#ffbe0b' : ''}
        ${i % 4 === 1 ? '#fb5607' : ''}
        ${i % 4 === 2 ? '#ff006e' : ''}
        ${i % 4 === 3 ? '#8338ec' : ''}
        , #3a86ff)`;
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.left = '50%';
      particle.style.top = '50%';
      particle.style.zIndex = '1000';
      
      const angle = (i * 45) * (Math.PI / 180);
      const distance = 60 + Math.random() * 40;
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;
      
      particle.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(${endX}px, ${endY}px) scale(0)`, opacity: 0 }
      ], {
        duration: 800,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      });
      
      container.appendChild(particle);
      setTimeout(() => particle.remove(), 800);
    }
  }
  
  calculateBPM() {
    if (this.clicks.length < 2) return;
    
    const intervals = [];
    for (let i = 1; i < this.clicks.length; i++) {
      intervals.push(this.clicks[i] - this.clicks[i - 1]);
    }
    // Use the last up to 5 intervals for stability
    const recent = intervals.slice(-5);
    // Remove obvious outliers via trimmed mean
    const sorted = recent.slice().sort((a,b)=>a-b);
    let trimmed = sorted;
    if (sorted.length >= 3) {
      trimmed = sorted.slice(1, sorted.length - 1);
    }
    const meanInterval = trimmed.reduce((s,v)=>s+v,0) / trimmed.length;
    let bpm = 60000 / meanInterval;
    // Smooth the displayed BPM using EMA
    if (this.smoothedBPM == null) this.smoothedBPM = bpm;
    this.smoothedBPM = this.smoothedBPM + this.smoothingAlpha * (bpm - this.smoothedBPM);
    const displayBPM = Math.round(this.smoothedBPM);
    
    this.updateDisplay(displayBPM);
    this.provideFeedback(displayBPM);
  }
  
  updateDisplay(bpm) {
    const bpmDisplay = document.getElementById('bpm-display');
    if (!bpmDisplay) return;
    
    const current = parseInt(bpmDisplay.textContent) || 110;
    this.animateNumber(bpmDisplay, current, bpm);
  }
  
  animateNumber(element, start, end) {
    const duration = 300;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const current = Math.round(start + (end - start) * progress);
      element.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  provideFeedback(bpm) {
    const statusIndicator = document.getElementById('status-indicator');
    const heart = document.getElementById('cpr-heart');
    const bpmNode = document.getElementById('bpm-display');
    const bpmDisplay = bpmNode ? bpmNode.parentElement : null;
    const screenFlash = document.getElementById('screen-flash');
    // Proceed even if some UI elements are missing
    
    let statusClass, newStatus, isPositive;
    
    if (bpm >= this.targetBPM.min && bpm <= this.targetBPM.max) {
      statusClass = 'bg-green-400 shadow-green-400/50';
      newStatus = 'perfect';
      isPositive = true;
    } else if (bpm < this.targetBPM.min) {
      statusClass = 'bg-azure shadow-azure/50';
      newStatus = 'slow';
      isPositive = false;
    } else {
      statusClass = 'bg-rose shadow-rose/50';
      newStatus = 'fast';
      isPositive = false;
    }
    
    // Only trigger feedback if status changed
    if (this.currentStatus !== newStatus) {
      this.currentStatus = newStatus;
      
      // Clear previous animations
      heart.classList.remove('positive', 'negative', 'pulse');
      if (statusIndicator) statusIndicator.classList.remove('status-positive', 'status-negative');
      if (bpmDisplay) bpmDisplay.classList.remove('bpm-positive', 'bpm-negative');
      screenFlash.classList.remove('screen-flash-positive', 'screen-flash-negative');
      
      // Add feedback animations
      if (isPositive) {
        heart.classList.add('positive');
        if (statusIndicator) statusIndicator.classList.add('status-positive');
        if (bpmDisplay) bpmDisplay.classList.add('bpm-positive');
        screenFlash.classList.add('screen-flash-positive');
        
        // Create success particles
        this.createSuccessParticles();
        this.triggerScreenFlash(true);
      } else {
        heart.classList.add('negative');
        if (statusIndicator) statusIndicator.classList.add('status-negative');
        if (bpmDisplay) bpmDisplay.classList.add('bpm-negative');
        screenFlash.classList.add('screen-flash-negative');
        
        this.triggerScreenFlash(false);
      }
      
      // Remove animation classes after animation completes
      setTimeout(() => {
        heart.classList.remove('positive', 'negative');
        if (statusIndicator) statusIndicator.classList.remove('status-positive', 'status-negative');
        if (bpmDisplay) bpmDisplay.classList.remove('bpm-positive', 'bpm-negative');
        screenFlash.classList.remove('screen-flash-positive', 'screen-flash-negative');
      }, isPositive ? 1200 : 800);
    }
    
    if (statusIndicator) {
      // Update status dot color/glow without nuking base styles
      if (newStatus === 'perfect') {
        statusIndicator.style.backgroundColor = '#10b981';
        statusIndicator.style.boxShadow = '0 0 16px #10b98188';
      } else if (newStatus === 'slow') {
        statusIndicator.style.backgroundColor = '#3a86ff';
        statusIndicator.style.boxShadow = '0 0 16px #3a86ff88';
      } else {
        statusIndicator.style.backgroundColor = '#ff006e';
        statusIndicator.style.boxShadow = '0 0 16px #ff006e88';
      }
    }
    
    // Remove CSS filter glows to avoid rectangular blur around canvas
    if (heart) heart.style.filter = '';

    // Dispatch global feedback event so other UIs can react
    const evt = new CustomEvent('cprFeedback', { detail: { bpm, status: newStatus } });
    document.dispatchEvent(evt);
  }
  
  triggerScreenFlash(isPositive) {
    const screenFlash = document.getElementById('screen-flash');
    if (!screenFlash) return;
    
    // Force reflow to ensure class removal takes effect
    screenFlash.offsetHeight;
    
    if (isPositive) {
      screenFlash.style.opacity = '1';
      setTimeout(() => {
        screenFlash.style.opacity = '0';
      }, 800);
    } else {
      screenFlash.style.opacity = '0.8';
      setTimeout(() => {
        screenFlash.style.opacity = '0';
      }, 600);
    }
  }
  
  createSuccessParticles() {
    const container = document.querySelector('.heart-container');
    
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '4px';
      particle.style.height = '4px';
      particle.style.background = '#10b981';
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.left = '50%';
      particle.style.top = '50%';
      particle.style.zIndex = '1000';
      particle.style.boxShadow = '0 0 8px #10b981';
      
      const angle = (i * 24) * (Math.PI / 180);
      const distance = 100 + Math.random() * 100;
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;
      
      particle.animate([
        { 
          transform: 'translate(-50%, -50%) scale(1)', 
          opacity: 1,
          background: '#10b981'
        },
        { 
          transform: `translate(${endX}px, ${endY}px) scale(0)`, 
          opacity: 0,
          background: '#34d399'
        }
      ], {
        duration: 1000,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      });
      
      container.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }
  }
  
  reset() {
    this.clicks = [];
    this.currentStatus = 'idle';
    
    const bpmDisplay = document.getElementById('bpm-display');
    const heart = document.getElementById('cpr-heart');
    const statusIndicator = document.getElementById('status-indicator');
    
    if (bpmDisplay) {
      this.animateNumber(bpmDisplay, parseInt(bpmDisplay.textContent) || 110, 110);
    }
    
    if (heart) {
      heart.style.filter = '';
    }
    
    if (statusIndicator) {
      statusIndicator.className = 'w-3 h-3 rounded-full bg-white/30';
    }

    // Dispatch reset event
    document.dispatchEvent(new CustomEvent('cprReset'));
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CPRHeartMinimal();
});
