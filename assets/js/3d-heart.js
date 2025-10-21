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
    this.beatTimer = null;
    this.autoBeatBPM = 110;
    this.baseColor = new THREE.Color(0xff4d6d);
    this.revivedColor = new THREE.Color(0x10b981);

    this.init();
  }

  init() {
    this.createCanvas();
    this.setupScene();
    // Size after renderer/camera exist
    this.onResize();
    this.createHeart();
    this.setupLighting();
    this.setupInteraction();
    this.animate();
    // Expose instance for global access (to allow area taps outside mesh)
    try {
      window.__heart3d = this;
    } catch (e) {}
  }

  createCanvas() {
    // Replace the existing heart div with canvas
    const heartContainer = document.getElementById("cpr-heart");
    if (!heartContainer) return;

    this.canvas = document.createElement("canvas");
    this.canvas.id = "heart-canvas";
    // Absolutely center the canvas within the heart container
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "50%";
    this.canvas.style.left = "50%";
    this.canvas.style.transform = "translate(-50%,-50%)";
    this.canvas.style.zIndex = "0";
    this.canvas.style.cursor = "default";
    this.canvas.style.display = "block";
    this.canvas.style.margin = "0";

    heartContainer.innerHTML = "";
    heartContainer.appendChild(this.canvas);

    // Initialize size cache and observe container changes
    const width = heartContainer.clientWidth || 360;
    const height = Math.round(width * 0.85);
    this._canvasWidth = width;
    this._canvasHeight = height;

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => this.onResize());
      ro.observe(heartContainer);
      this._ro = ro;
    }
  }

  setupScene() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    const aspect = (this._canvasWidth || 360) / (this._canvasHeight || 306);
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(this._canvasWidth || 360, this._canvasHeight || 306);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // Fully transparent background, no shadow map to avoid box artifacts
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = false;

    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  createHeart() {
    // Create heart shape using THREE.Shape
    const heartShape = new THREE.Shape();

    const x = 0,
      y = 0;
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
      bevelThickness: 3,
    };

    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    geometry.center();

    // Brighter, less dark material (store base color)
    const material = new THREE.MeshPhysicalMaterial({
      color: this.baseColor,
      metalness: 0.35,
      roughness: 0.4,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.6,
      emissive: 0x6b1225,
      emissiveIntensity: 0.35,
    });

    this.heart = new THREE.Mesh(geometry, material);
    this.heart.castShadow = false;
    this.heart.receiveShadow = false;
    // Upright orientation (smaller to avoid any clipping)
    this.heart.scale.set(0.03, 0.03, 0.03);
    this.baseScale = this.heart.scale.clone();
    this.heart.rotation.set(0, 0, Math.PI);

    this.scene.add(this.heart);

    // Fit camera so the heart is fully visible with generous padding
    this.fitCameraToObject(this.heart, 1.35);
  }

  fitCameraToObject(object, padding = 1.2) {
    const bbox = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    // Re-center object
    object.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) * padding;
    const fov = this.camera.fov * (Math.PI / 180);
    const dist = maxDim / 2 / Math.tan(fov / 2);
    this.camera.position.set(0, 0, dist + 1.0);
    this.camera.near = Math.max(0.1, dist / 10);
    this.camera.far = dist * 10;
    this.camera.updateProjectionMatrix();
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
    directionalLight.position.set(8, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Point lights for iridescent effect
    const pointLight1 = new THREE.PointLight(0xff4d6d, 0.9, 100);
    pointLight1.position.set(-5, 5, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00bfff, 0.7, 100);
    pointLight2.position.set(5, -5, 5);
    this.scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x7fff00, 0.5, 100);
    pointLight3.position.set(0, 5, -5);
    this.scene.add(pointLight3);
  }

  setupInteraction() {
    // Tap anywhere on the canvas should count immediately (no timing gate)
    this.canvas.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.onHeartClick(event);
    });
    this.canvas.addEventListener(
      "touchstart",
      (event) => {
        const t = event.touches && event.touches[0] ? event.touches[0] : event;
        this.onHeartClick(t);
      },
      { passive: true }
    );
    this.canvas.addEventListener("mousemove", (event) =>
      this.onMouseMove(event)
    );
    // Resize handling to keep correct aspect/size
    window.addEventListener("resize", () => this.onResize());
    // Keyboard support: Space triggers a press (except on interactive controls)
    window.addEventListener("keydown", (e) => {
      if (e.code !== "Space") return;
      const t = e.target;
      // Skip if focused on interactive elements or sound button
      const tag = t && t.tagName ? t.tagName.toLowerCase() : '';
      const isInteractive = (t && t.isContentEditable) || ["input","textarea","select","button","a"].includes(tag);
      const inSoundBtn = t && t.closest && t.closest('.sound-btn');
      if (isInteractive || inSoundBtn) return;
      e.preventDefault();
      this.triggerHeartbeat();
      const heartClickEvent = new CustomEvent("heartClick", {
        detail: { position: null, source: "keyboard" },
      });
      document.dispatchEvent(heartClickEvent);
    });
  }

  onResize() {
    const heartContainer = document.getElementById("cpr-heart");
    if (!heartContainer) return;
    // If simulator layout exists, match heart and ring sizes
    const simHeart = heartContainer.closest(".sim-heart");
    const simRect = simHeart
      ? simHeart.getBoundingClientRect()
      : heartContainer.getBoundingClientRect();
    const base = Math.max(320, Math.min(simRect.width, simRect.height));
    const ringDiameter = Math.round(base * 0.55); // smaller circle + heart footprint
    // Apply ring size if present
    const ring = document.getElementById("target-ring");
    if (ring) {
      ring.style.width = ringDiameter + "px";
      ring.style.height = ringDiameter + "px";
    }
    const progress = document.getElementById("revive-progress");
    if (progress) {
      progress.style.width = ringDiameter + "px";
      progress.style.height = ringDiameter + "px";
    }
    // Do not constrain heart container width; let it follow parent width
    // Use a square canvas to maximize area within the circular ring
    const width = ringDiameter;
    const height = ringDiameter;
    this._canvasWidth = width;
    this._canvasHeight = height;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.heart) this.fitCameraToObject(this.heart, 1.5);
    // Keep CSS at full width; height is auto
    // Explicitly set canvas CSS box to match render size to prevent browser scaling artifacts
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
  }

  onMouseMove(event) {
    // Only track mouse for raycaster math if needed later; do not change cursor
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onHeartClick(event) {
    // Treat any tap/click within the canvas as a valid CPR press
    this.triggerHeartbeat();
    const rect = this.canvas.getBoundingClientRect();
    const clientX =
      event && event.clientX ? event.clientX : rect.left + rect.width / 2;
    const clientY =
      event && event.clientY ? event.clientY : rect.top + rect.height / 2;
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    const heartClickEvent = new CustomEvent("heartClick", {
      detail: { position: null, source: "pointer" },
    });
    document.dispatchEvent(heartClickEvent);
  }

  triggerHeartbeat() {
    // Always allow presses; cancel existing scale tweens to avoid cumulative growth
    if (this._scaleUpTween && this._scaleUpTween.stop)
      this._scaleUpTween.stop();
    if (this._scaleDownTween && this._scaleDownTween.stop)
      this._scaleDownTween.stop();

    const upTarget = this.baseScale.clone().multiplyScalar(1.05);
    this._scaleUpTween = new TWEEN.Tween(this.heart.scale)
      .to(upTarget, 120)
      .easing(TWEEN.Easing.Cubic.Out)
      .onComplete(() => {
        this._scaleDownTween = new TWEEN.Tween(this.heart.scale)
          .to(this.baseScale, 160)
          .easing(TWEEN.Easing.Cubic.Out)
          .onComplete(() => {
            this.heart.scale.copy(this.baseScale);
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

  // Smaller autonomous beat used when revived
  pulseAutoBeat() {
    if (!this.heart) return;
    const originalScale = this.heart.scale.clone();
    const targetScale = originalScale.clone().multiplyScalar(1.12);
    new TWEEN.Tween(this.heart.scale)
      .to(targetScale, 120)
      .easing(TWEEN.Easing.Cubic.Out)
      .onComplete(() => {
        new TWEEN.Tween(this.heart.scale)
          .to(originalScale, 180)
          .easing(TWEEN.Easing.Cubic.Out)
          .start();
      })
      .start();
  }

  startAutoBeat(bpm = 110) {
    this.autoBeatBPM = bpm;
    this.stopAutoBeat();
    // Set revived color baseline
    if (this.heart) this.heart.material.color.copy(this.revivedColor);
    const interval = Math.max(
      300,
      Math.round(60000 / Math.max(60, Math.min(140, bpm)))
    );
    this.beatTimer = setInterval(() => this.pulseAutoBeat(), interval);
  }

  stopAutoBeat() {
    if (this.beatTimer) {
      clearInterval(this.beatTimer);
      this.beatTimer = null;
    }
    // Restore base color
    if (this.heart) this.heart.material.color.copy(this.baseColor);
  }

  setRevived(on, bpm = 110) {
    if (on) this.startAutoBeat(bpm);
    else this.stopAutoBeat();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Gentle rotation
    if (!this.isAnimating) {
      this.heart.rotation.y += 0.005;
      this.heart.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
    }

    // Update tweens
    if (typeof TWEEN !== "undefined") {
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
  if (typeof THREE === "undefined") {
    // Load Three.js from CDN
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => {
      // Load Tween.js for animations
      const tweenScript = document.createElement("script");
      tweenScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js";
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
document.addEventListener("DOMContentLoaded", loadThreeJS);
