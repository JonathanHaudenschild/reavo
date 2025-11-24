// Inject hero background images
document.addEventListener("DOMContentLoaded", function () {
  const heroSection = document.querySelector(".front-page");
  if (!heroSection) return;

  // Get theme directory from WordPress
  const themeDir =
    typeof wpThemeData !== "undefined"
      ? wpThemeData.themeUrl
      : "/wp-content/themes/reavo";

  // Create background container - relative on mobile, absolute on desktop
  const bgContainer = document.createElement("div");
  bgContainer.className =
    "relative md:absolute order-2 md:left-0 md:top-0 md:w-full md:h-full md:pointer-events-none md:overflow-hidden md:z-0 mb-0";
  bgContainer.innerHTML = `
    <div class="block md:absolute md:left-0" style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%);">
      <picture>
        <source srcset="${themeDir}/assets/images/background.webp" type="image/webp" />
        <img src="${themeDir}/assets/images/background.png" alt="" class="object-cover w-full h-auto" aria-hidden="true"/>
      </picture>
    </div>
  `;

  // Insert as first child of hero section
  heroSection.insertBefore(bgContainer, heroSection.firstChild);
});
