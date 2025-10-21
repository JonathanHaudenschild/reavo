class CPRHeartPremium {
  constructor() {
    this.clicks = [];
    this.targetBPM = { min: 100, max: 120 };
    this.isTracking = false;
    this.feedbackTimeout = null;
    this.progressRing = null;
    this.currentStatus = 'idle';
    this.particles = [];
    
    this.init();
    this.initParticles();
  }
  
  init() {
    const heart = document.getElementById('cpr-heart');
    const resetBtn = document.getElementById('reset-btn');
    
    if (heart) {
      heart.addEventListener('click', (e) => this.handleHeartClick(e));
      heart.addEventListener('mouseenter', () => this.addHoverEffects());
      heart.addEventListener('mouseleave', () => this.removeHoverEffects());
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
    
    this.initProgressRing();
    this.startAmbientAnimations();
  }
  
  initParticles() {
    const container = document.querySelector('.heart-container');
    if (!container) return;
    
    for (let i = 1; i <= 5; i++) {
      const particle = document.createElement('div');
      particle.className = `particle particle-${i}`;
      container.appendChild(particle);
    }
  }
  
  initProgressRing() {
    const progressContainer = document.getElementById('progress-container');
    if (!progressContainer) return;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '120');
    svg.setAttribute('class', 'absolute top-0 left-0');
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '60');
    circle.setAttribute('cy', '60');
    circle.setAttribute('r', '50');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#f26a8d');
    circle.setAttribute('stroke-width', '4');
    circle.setAttribute('stroke-dasharray', '314');
    circle.setAttribute('stroke-dashoffset', '314');
    circle.setAttribute('class', 'progress-ring');
    
    svg.appendChild(circle);
    progressContainer.appendChild(svg);
    this.progressRing = circle;
  }
  
  handleHeartClick(e) {
    const now = Date.now();
    this.clicks.push(now);
    
    // 3D heart animation with multiple effects
    this.triggerHeartbeat3D(e);
    this.createRippleEffect(e);
    this.updateProgressRing();
    
    // Keep only clicks from last 10 seconds
    this.clicks = this.clicks.filter(click => now - click <= 10000);
    
    if (this.clicks.length >= 2) {
      this.calculateBPM();
    }
    
    this.startTracking();
  }
  
  triggerHeartbeat3D(e) {
    const heart = document.getElementById('cpr-heart');
    if (!heart) return;
    
    // Remove existing animation classes
    heart.classList.remove('pulse');
    
    // Add 3D pulse animation
    setTimeout(() => {
      heart.classList.add('pulse');
    }, 10);
    
    // Remove pulse class after animation
    setTimeout(() => {
      heart.classList.remove('pulse');
    }, 800);
    
    // Trigger 3D particle burst
    this.createParticleBurst3D(e);
  }
  
  createRippleEffect(e) {
    const heart = e.target;
    const rect = heart.getBoundingClientRect();
    const ripple = document.createElement('div');
    
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(221, 45, 74, 0.3)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.left = (e.clientX - rect.left - 25) + 'px';
    ripple.style.top = (e.clientY - rect.top - 25) + 'px';
    ripple.style.width = '50px';
    ripple.style.height = '50px';
    ripple.style.pointerEvents = 'none';
    
    heart.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
  
  createParticleBurst3D(e) {
    const container = e.target.closest('.heart-3d').parentElement;
    const rect = container.getBoundingClientRect();
    
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '8px';
      particle.style.height = '8px';
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
      particle.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
      
      const angle = (i * 30) * (Math.PI / 180);
      const distance = 80 + Math.random() * 60;
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;
      const rotation = Math.random() * 720;
      
      particle.animate([
        { 
          transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', 
          opacity: 1,
          filter: 'blur(0px)'
        },
        { 
          transform: `translate(${endX}px, ${endY}px) scale(0) rotate(${rotation}deg)`, 
          opacity: 0,
          filter: 'blur(3px)'
        }
      ], {
        duration: 1200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      });
      
      container.appendChild(particle);
      
      setTimeout(() => particle.remove(), 1200);
    }
  }
  
  updateProgressRing() {
    if (!this.progressRing) return;
    
    const progress = Math.min(this.clicks.length / 10, 1);
    const offset = 314 - (progress * 314);
    
    this.progressRing.style.strokeDashoffset = offset;
    this.progressRing.style.stroke = progress > 0.7 ? '#10b981' : '#f26a8d';
  }
  
  calculateBPM() {
    if (this.clicks.length < 2) return;
    
    const intervals = [];
    for (let i = 1; i < this.clicks.length; i++) {
      intervals.push(this.clicks[i] - this.clicks[i - 1]);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const bpm = Math.round(60000 / avgInterval);
    
    this.updateDisplay(bpm);
    this.provideFeedback(bpm);
  }
  
  updateDisplay(bpm) {
    const bpmDisplay = document.getElementById('bpm-display');
    if (!bpmDisplay) return;
    
    // Animate number change
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
    
    if (!statusIndicator || !heart) return;
    
    let statusClass, newStatus;
    
    if (bpm >= this.targetBPM.min && bpm <= this.targetBPM.max) {
      statusClass = 'bg-green-400 shadow-green-400/50';
      newStatus = 'perfect';
    } else if (bpm < this.targetBPM.min) {
      statusClass = 'bg-azure shadow-azure/50';
      newStatus = 'slow';
    } else {
      statusClass = 'bg-rose shadow-rose/50';
      newStatus = 'fast';
    }
    
    this.currentStatus = newStatus;
    
    // Update status indicator
    statusIndicator.className = `w-3 h-3 rounded-full ${statusClass} transition-all duration-300 shadow-lg`;
    
    // Update heart's glow effect
    if (newStatus === 'perfect') {
      heart.style.filter = 'drop-shadow(0 0 40px #10b981)';
    } else if (newStatus === 'slow') {
      heart.style.filter = 'drop-shadow(0 0 40px #3a86ff)';
    } else {
      heart.style.filter = 'drop-shadow(0 0 40px #ff006e)';
    }
  }
  
  addHoverEffects() {
    const heart = document.getElementById('cpr-heart');
    if (heart) {
      heart.style.filter = 'drop-shadow(0 25px 50px rgba(221, 45, 74, 0.4))';
    }
  }
  
  removeHoverEffects() {
    const heart = document.getElementById('cpr-heart');
    if (heart && !heart.classList.contains('animate-heartbeat')) {
      heart.style.filter = '';
    }
  }
  
  startAmbientAnimations() {
    // Floating background particles
    setInterval(() => {
      this.createFloatingParticle();
    }, 3000);
  }
  
  createFloatingParticle() {
    const container = document.body;
    const particle = document.createElement('div');
    
    particle.style.position = 'fixed';
    particle.style.width = '4px';
    particle.style.height = '4px';
    particle.style.background = 'rgba(242, 106, 141, 0.3)';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.bottom = '-10px';
    particle.style.zIndex = '1';
    
    particle.animate([
      { transform: 'translateY(0) rotate(0deg)', opacity: 0 },
      { transform: 'translateY(-100vh) rotate(360deg)', opacity: 1 }
    ], {
      duration: 15000,
      easing: 'linear'
    });
    
    container.appendChild(particle);
    
    setTimeout(() => particle.remove(), 15000);
  }
  
  startTracking() {
    this.isTracking = true;
  }
  
  reset() {
    this.clicks = [];
    this.isTracking = false;
    this.currentStatus = 'idle';
    
    const elements = {
      bpmDisplay: document.getElementById('bpm-display'),
      feedback: document.getElementById('bpm-feedback'),
      instructions: document.getElementById('instructions'),
      heart: document.getElementById('cpr-heart'),
      statusIndicator: document.getElementById('status-indicator')
    };
    
    // Animate reset
    Object.values(elements).forEach(el => {
      if (el) el.style.transition = 'all 0.5s ease';
    });
    
    if (elements.bpmDisplay) {
      this.animateNumber(elements.bpmDisplay, parseInt(elements.bpmDisplay.textContent) || 0, 0);
      setTimeout(() => {
        elements.bpmDisplay.textContent = 'Ready';
        elements.bpmDisplay.className = 'bpm-display rounded-2xl px-8 py-4 text-center';
      }, 500);
    }
    
    if (elements.feedback) {
      elements.feedback.style.opacity = '0';
      setTimeout(() => {
        elements.feedback.textContent = '';
        elements.feedback.style.opacity = '1';
      }, 300);
    }
    
    if (elements.instructions) {
      elements.instructions.textContent = '✨ Click the heart to start your CPR training';
    }
    
    if (elements.heart) {
      elements.heart.className = 'heart-3d';
      elements.heart.style.filter = '';
    }
    
    if (elements.statusIndicator) {
      elements.statusIndicator.className = 'w-4 h-4 rounded-full bg-gray-300 transition-all duration-300';
    }
    
    // Reset progress ring
    if (this.progressRing) {
      this.progressRing.style.strokeDashoffset = '314';
      this.progressRing.style.stroke = '#f26a8d';
    }
    
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }
  }
}

// Add ripple keyframe
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CPRHeartPremium();
});