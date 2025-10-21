<?php
/**
 * Fallback index.php required by WordPress themes.
 *
 * This block theme renders via block templates in /templates.
 * Leaving this file minimal keeps compatibility with WP expects.
 */

// Prevent direct access.
if (!defined('ABSPATH')) {
    exit;
}

// If a PHP template somehow loads, provide a minimal structure.
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
    <style>body{margin:0}</style>
  </head>
  <body <?php body_class(); ?>>
    <?php
    // Render the block template part if available; otherwise show a friendly note.
    if (function_exists('the_content') && have_posts()) {
        while (have_posts()) { the_post(); the_content(); }
    } else {
        echo '<main style="padding:2rem; font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif">';
        echo '<h1 style="margin:0 0 0.5rem">Reavo Theme</h1>';
        echo '<p>This is a block theme. Templates in <code>/templates</code> should render this page.</p>';
        echo '</main>';
    }
    ?>
    <?php wp_footer(); ?>
  </body>
 </html>

