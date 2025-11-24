<?php
// functions.php in reavo theme

add_action('after_setup_theme', function () {
  add_theme_support('title-tag');
  add_theme_support('post-thumbnails');
  add_theme_support('editor-styles');
  add_theme_support('block-templates');
  add_theme_support('block-template-parts');
  add_editor_style('assets/build/main.css');
});

add_action('wp_enqueue_scripts', function () {
  // Load IBM Plex Mono from Google Fonts
  wp_enqueue_style(
    'google-fonts',
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap',
    [],
    null
  );

  wp_enqueue_style(
    'reavo-style',
    get_theme_file_uri('/assets/build/main.css'),
    [],
    filemtime(get_theme_file_path('/assets/build/main.css')) . '-v2.0'
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

  wp_enqueue_script(
    'reavo-cpr-sim',
    get_theme_file_uri('/assets/js/cpr-sim.js'),
    ['cpr-heart-script'],
    filemtime(get_theme_file_path('/assets/js/cpr-sim.js')) . '-v1.0',
    true
  );

  wp_register_script(
    'reavo-cpr-modal',
    get_theme_file_uri('/assets/js/cpr-modal.js'),
    [],
    filemtime(get_theme_file_path('/assets/js/cpr-modal.js')) . '-v1.0',
    true
  );

  if (is_front_page()) {
    wp_enqueue_script(
      'reavo-hero-background',
      get_theme_file_uri('/assets/js/hero-background.js'),
      [],
      filemtime(get_theme_file_path('/assets/js/hero-background.js')) . '-v1.0',
      true
    );

    wp_localize_script('reavo-hero-background', 'wpThemeData', [
      'themeUrl' => get_template_directory_uri()
    ]);

    wp_enqueue_script('reavo-cpr-modal');
  }
});

add_action('wp_head', function () {
  $favicon_svg = get_theme_file_uri('/assets/favicon.svg');

  if ($favicon_svg) {
    echo '<link rel="icon" type="image/svg+xml" sizes="any" href="' . esc_url($favicon_svg) . '">' . PHP_EOL;
  }
});

add_filter('upload_mimes', function ($mimes) {
  $mimes['svg']  = 'image/svg+xml';
  $mimes['svgz'] = 'image/svg+xml';
  return $mimes;
});

add_filter('the_content', 'shortcode_unautop');

add_action('init', function () {

  if (function_exists('register_block_style')) {
    register_block_style(
      'core/list',
      [
        'name'  => 'reavo-accent-list',
        'label' => __('Accent List', 'reavo'),
      ]
    );

    register_block_style(
      'core/list',
      [
        'name'  => 'reavo-check-list',
        'label' => __('Check List', 'reavo'),
      ]
    );

    register_block_style(
      'core/image',
      [
        'name'  => 'reavo-primary-tint',
        'label' => __('Primary Tint', 'reavo'),
      ]
    );
  }

  $reavo_cpr_modal_registered = false;

  add_shortcode('cpr_modal', function ($atts = []) use (&$reavo_cpr_modal_registered) {
    $atts = shortcode_atts([
      'button_text'  => __('Interactive Game', 'reavo'),
      'button_class' => '',
      'button_style' => 'border:2px solid var(--wp--preset--color--primary);background-color:transparent;color:var(--wp--preset--color--primary);',
      'show_button'  => '1',
      'inline'       => '0',
    ], $atts, 'cpr_modal');

    wp_enqueue_script('reavo-cpr-modal');

    $show_button = filter_var($atts['show_button'], FILTER_VALIDATE_BOOLEAN);
    $inline_button = filter_var($atts['inline'], FILTER_VALIDATE_BOOLEAN);
    $button_classes = trim('wp-block-button__link is-style-outline has-primary-color has-primary-border-color inline-flex items-center justify-center rounded-full border-2 border-primary text-primary bg-transparent px-6 py-3 text-base font-semibold transition hover:bg-primary hover:text-white ' . $atts['button_class']);

    if ($show_button && $inline_button) {
      $button_markup = sprintf(
        '<div class="wp-block-button cpr-modal-trigger"><a href="#" class="%s" style="%s" data-open-cpr="true" role="button">%s</a></div>',
        esc_attr($button_classes),
        esc_attr($atts['button_style']),
        esc_html($atts['button_text'])
      );
    } else {
      $button_markup = '';
    }

    if (!$reavo_cpr_modal_registered) {
      add_action('wp_footer', 'reavo_render_cpr_modal', 20);
      $reavo_cpr_modal_registered = true;
    }

    return $button_markup;
  });

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
        </div>
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
