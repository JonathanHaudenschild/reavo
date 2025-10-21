class Heart3D {
  constructor() {
    this.canvas = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.heart = null;
    this.raycaster = null;
    this.mouse = null;
    this.isAnimating = false;
    
    this.init();
  }
  
  init() {
    this.createCanvas();
    this.setupScene();
    this.createHeart();
    this.setupLighting();
    this.setupInteraction();
    this.animate();
  }
  
  createCanvas() {
    // Replace the existing heart div with canvas
    const heartContainer = document.getElementById('cpr-heart');
    if (!heartContainer) return;
    
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'heart-canvas';
    this.canvas.style.width = '250px';
    this.canvas.style.height = '220px';
    this.canvas.style.cursor = 'pointer';
    
    heartContainer.innerHTML = '';
    heartContainer.appendChild(this.canvas);
  }
  
  setupScene() {
    // Scene
    this.scene = new THREE.Scene();
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, 250/220, 0.1, 1000);
    this.camera.position.z = 5;
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true, 
      alpha: true 
    });
    this.renderer.setSize(250, 220);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }
  
  createHeart() {
    // Create heart shape using THREE.Shape
    const heartShape = new THREE.Shape();
    
    const x = 0, y = 0;
    heartShape.moveTo(x + 25, y + 25);
    heartShape.bezierCurveTo(x + 25, y + 25, x + 20, y, x, y);
    heartShape.bezierCurveTo(x - 30, y, x - 30, y + 35, x - 30, y + 35);
    heartShape.bezierCurveTo(x - 30, y + 55, x - 10, y + 77, x + 25, y + 95);
    heartShape.bezierCurveTo(x + 60, y + 77, x + 80, y + 55, x + 80, y + 35);
    heartShape.bezierCurveTo(x + 80, y + 35, x + 80, y, x + 50, y);
    heartShape.bezierCurveTo(x + 35, y, x + 25, y + 25, x + 25, y + 25);
    
    // Extrude the heart shape
    const extrudeSettings = {
      depth: 20,
      bevelEnabled: true,
      bevelSegments: 10,
      steps: 1,
      bevelSize: 3,
      bevelThickness: 3
    };
    
    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    geometry.center();
    
    // Futuristic metallic material
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xff1493,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 2.0,
      iridescence: 1.0,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [100, 800]
    });
    
    this.heart = new THREE.Mesh(geometry, material);
    this.heart.castShadow = true;
    this.heart.receiveShadow = true;
    this.heart.scale.set(0.02, -0.02, 0.02); // Flip Y to fix upside down
    this.heart.rotation.z = Math.PI; // Rotate 180 degrees to orient correctly
    
    this.scene.add(this.heart);
  }
  
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Point lights for iridescent effect
    const pointLight1 = new THREE.PointLight(0xff1493, 0.8, 100);
    pointLight1.position.set(-5, 5, 5);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x00bfff, 0.6, 100);
    pointLight2.position.set(5, -5, 5);
    this.scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0x7fff00, 0.4, 100);
    pointLight3.position.set(0, 5, -5);
    this.scene.add(pointLight3);
  }
  
  setupInteraction() {
    this.canvas.addEventListener('click', (event) => this.onHeartClick(event));
    this.canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
  }
  
  onMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Hover effect
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([this.heart]);
    
    if (intersects.length > 0) {
      this.canvas.style.cursor = 'pointer';
      // Subtle hover rotation
      this.heart.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
      this.heart.rotation.x = Math.cos(Date.now() * 0.001) * 0.05;
    } else {
      this.canvas.style.cursor = 'default';
    }
  }
  
  onHeartClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([this.heart]);
    
    if (intersects.length > 0) {
      this.triggerHeartbeat();
      
      // Dispatch custom event for CPR functionality
      const heartClickEvent = new CustomEvent('heartClick', {
        detail: { position: intersects[0].point }
      });
      document.dispatchEvent(heartClickEvent);
    }
  }
  
  triggerHeartbeat() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    
    // Heartbeat animation
    const originalScale = this.heart.scale.clone();
    const targetScale = originalScale.clone().multiplyScalar(1.3);
    
    // Scale up
    new TWEEN.Tween(this.heart.scale)
      .to(targetScale, 150)
      .easing(TWEEN.Easing.Cubic.Out)
      .onComplete(() => {
        // Scale back down
        new TWEEN.Tween(this.heart.scale)
          .to(originalScale, 200)
          .easing(TWEEN.Easing.Elastic.Out)
          .onComplete(() => {
            this.isAnimating = false;
          })
          .start();
      })
      .start();
    
    // Color pulse
    const originalColor = this.heart.material.color.clone();
    const pulseColor = new THREE.Color(0xff69b4);
    
    new TWEEN.Tween(this.heart.material.color)
      .to(pulseColor, 150)
      .onComplete(() => {
        new TWEEN.Tween(this.heart.material.color)
          .to(originalColor, 200)
          .start();
      })
      .start();
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Gentle rotation
    if (!this.isAnimating) {
      this.heart.rotation.y += 0.005;
      this.heart.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
    }
    
    // Update tweens
    if (typeof TWEEN !== 'undefined') {
      TWEEN.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Load Three.js and initialize
function loadThreeJS() {
  if (typeof THREE === 'undefined') {
    // Load Three.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => {
      // Load Tween.js for animations
      const tweenScript = document.createElement('script');
      tweenScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js';
      tweenScript.onload = () => {
        new Heart3D();
      };
      document.head.appendChild(tweenScript);
    };
    document.head.appendChild(script);
  } else {
    new Heart3D();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadThreeJS);