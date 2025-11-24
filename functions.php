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

});

function reavo_render_cpr_modal() {
  ?>
  <div id="cpr-modal" class="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8 bg-slate-950/80 opacity-0 pointer-events-none transition-opacity duration-200" aria-hidden="true">
    <div class="cpr-modal__overlay absolute inset-0" data-modal-close></div>
    <div class="cpr-modal-bg relative w-full max-w-5xl max-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl p-8 shadow-[0_25px_80px_rgba(2,6,23,0.35)] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="cprModalTitle">
      <button type="button" class="cpr-modal__close absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:opacity-90" data-modal-close aria-label="Close CPR simulator">
        <span aria-hidden="true" class="text-2xl leading-none">×</span>
      </button>
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="cpr-sim" style="--scroll: 1;">
          <header class="sim-topbar">
            <div class="health-bar-container">
              <div class="health-bar-label">
                <span>Leben</span>
                <span id="health-value">100%</span>
              </div>
              <div class="health-bar">
                <div class="health-bar-fill" id="health-bar-fill" style="width: 100%;"></div>
              </div>
            </div>
          </header>
          <main class="sim-stage">
            <section class="sim-heart">
              <div class="heart-container">
                <div class="target-ring" id="target-ring" role="button" tabindex="0" aria-label="Hier drücken für CPR">
                  <span class="cpr-circle-text">Hier drücken</span>
                </div>
                <div class="revive-progress" id="revive-progress" style="--revive-pct: 0%;"></div>
                <div class="success-message hidden" id="success-message">
                  <div class="success-content">
                    <div class="success-icon">✓</div>
                    <h3>Erfolgreich wiederbelebt!</h3>
                    <p>Du hast den Patienten gerettet</p>
                  </div>
                </div>
                <div class="gameover-message hidden" id="gameover-message">
                  <div class="gameover-content">
                    <div class="gameover-icon">✕</div>
                    <h3>Zu spät!</h3>
                    <p>Der Patient konnte nicht gerettet werden</p>
                  </div>
                </div>
              </div>
              <button type="button" class="sound-btn" id="sound-btn" aria-pressed="true" aria-label="Mute sound">
                <svg class="icon-sound-on" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                  <path d="M4 10h3l5-4v12l-5-4H4z" stroke="currentColor" stroke-width="1.6" fill="currentColor" fill-opacity=".2"/>
                  <path d="M16.5 8.5c1.5 1.5 1.5 5.5 0 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  <path d="M19 6c3 3 3 9 0 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                <svg class="icon-sound-off" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                  <path d="M4 10h3l5-4v12l-5-4H4z" stroke="currentColor" stroke-width="1.6" fill="currentColor" fill-opacity=".2"/>
                  <path d="M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </button>
              <div class="status-dot" id="status-indicator" aria-hidden="true"></div>
            </section>
          </main>
          <footer class="sim-footer">
            <div class="legend">
              <span class="dot dot-green"></span> perfekt
              <span class="dot dot-blue"></span> langsam
              <span class="dot dot-red"></span> schnell
            </div>
          </footer>
        </div>
      </div>
    </div>
  </div>
  <?php
}
