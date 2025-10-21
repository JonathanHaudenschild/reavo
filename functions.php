<?php
// functions.php in reavo theme

add_action('after_setup_theme', function () {
  add_theme_support('title-tag');
  add_theme_support('post-thumbnails');
  add_theme_support('editor-styles');
  add_editor_style('assets/build/main.css');
});

add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style(
    'reavo-style',
    get_theme_file_uri('/assets/build/main.css'),
    [],
    filemtime(get_theme_file_path('/assets/build/main.css')) . '-v2.0'
  );
  
  // Minimal CPR styles (heart container + feedback)
  wp_enqueue_style(
    'reavo-cpr-style',
    get_theme_file_uri('/assets/css/cpr.css'),
    ['reavo-style'],
    filemtime(get_theme_file_path('/assets/css/cpr.css')) . '-v1.0'
  );
  
  wp_enqueue_script(
    '3d-heart-script',
    get_theme_file_uri('/assets/js/3d-heart.js'),
    [],
    filemtime(get_theme_file_path('/assets/js/3d-heart.js')) . '-v1.0',
    true
  );
  
  wp_enqueue_script(
    'cpr-heart-script',
    get_theme_file_uri('/assets/js/cpr-heart-minimal.js'),
    ['3d-heart-script'],
    filemtime(get_theme_file_path('/assets/js/cpr-heart-minimal.js')) . '-v2.0',
    true
  );

  // Fancy CPR simulator UI (life meter + HUD)
  wp_enqueue_style(
    'reavo-cpr-sim-style',
    get_theme_file_uri('/assets/css/cpr-sim.css'),
    ['reavo-style','reavo-cpr-style'],
    filemtime(get_theme_file_path('/assets/css/cpr-sim.css')) . '-v1.0'
  );
  wp_enqueue_script(
    'reavo-cpr-sim',
    get_theme_file_uri('/assets/js/cpr-sim.js'),
    ['cpr-heart-script'],
    filemtime(get_theme_file_path('/assets/js/cpr-sim.js')) . '-v1.0',
    true
  );
});

add_action('wp_head', function () {
  $favicon_svg = get_theme_file_uri('/assets/favicon.svg');

  if ($favicon_svg) {
    echo '<link rel="icon" type="image/svg+xml" sizes="any" href="' . esc_url($favicon_svg) . '">' . PHP_EOL;
  }
});

// Transparent migration: render-time replacement of legacy shortcode usages.
// This avoids a DB write and ensures all pages show the new simulator immediately.
// Removed legacy shortcode migration filters after content update

// Shortcode to render the CPR heart and HUD
add_action('init', function () {

  // Full simulator shortcode
  add_shortcode('cpr_simulator', function ($atts = []) {
    $atts = shortcode_atts([
      'fullwidth' => '0',
    ], $atts);
    $full = $atts['fullwidth'] === '1' || $atts['fullwidth'] === 'true';
    ob_start();
    ?>
    <div class="cpr-sim<?php echo $full ? ' fullwidth' : ''; ?>">
      <div class="cpr-bg"></div>

      <header class="sim-topbar">
        <div class="sim-pill">
          <span class="sim-icon">❤</span>
          <span class="sim-text">Aim 100–120 BPM</span>
        </div>
        <div class="sim-pill">Exact rhythm revives • Off rhythm harms</div>
      </header>

      <main class="sim-grid">
        <section class="sim-heart">
          <div class="target-ring" id="target-ring"></div>
          <div class="bpm-badge" aria-live="polite" aria-atomic="true">
            <div class="bpm-num" id="sim-bpm-number">110</div>
            <div class="bpm-label">BPM</div>
          </div>
          <div class="heart-container">
            <div id="screen-flash" class="screen-flash"></div>
            <div class="heart-hud">
              <div class="hud-item">
                <div id="status-indicator" class="w-3 h-3 rounded-full bg-white/30"></div>
                <span class="label">Status</span>
              </div>
              <div class="hud-item">
                <span class="label">BPM</span>
                <span class="value"><span id="bpm-display">110</span></span>
              </div>
              <button id="reset-btn" class="reset-btn" type="button">Reset</button>
            </div>
            <div class="heart-3d">
              <div id="cpr-heart" aria-label="CPR Heart" role="button"></div>
            </div>
          </div>
        </section>

        <aside class="sim-panel">
          <div class="patient">
            <div class="patient-body" id="patient-body">
              <div class="patient-heart"></div>
            </div>
            <div class="patient-status" id="patient-status">Stabilizing…</div>
          </div>

          <div class="meter">
            <div class="meter-labels">
              <span>Life</span>
              <span id="life-value">0%</span>
            </div>
            <div class="meter-bar">
              <div class="meter-fill" id="life-fill" style="width:0%"></div>
            </div>
          </div>
        </aside>
      </main>

      <footer class="sim-footer">
        <div class="legend">
          <span class="dot dot-green"></span> perfect
          <span class="dot dot-blue"></span> slow
          <span class="dot dot-red"></span> fast
        </div>
      </footer>
    </div>
    <?php
    return ob_get_clean();
  });

  // Alias: [cpr] renders the full simulator (preferred shortcode)
  add_shortcode('cpr', function ($atts = []) {
    $atts = shortcode_atts([
      'fullwidth' => '0',
    ], $atts);
    $full = ($atts['fullwidth'] === '1' || $atts['fullwidth'] === 'true') ? '1' : '0';
    return do_shortcode('[cpr_simulator fullwidth="' . esc_attr($full) . '"]');
  });
});
