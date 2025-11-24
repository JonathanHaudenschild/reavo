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
    "relative md:absolute md:left-0 md:top-0 md:w-full md:h-full md:pointer-events-none md:overflow-hidden md:z-0 space-y-4 md:space-y-0 md:mb-0";
  bgContainer.innerHTML = `
    <div class="absolute translate-x-1/2 md:-translate-x-1/8 w-56 md:w-92 md:right-0 md:top-80" style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%);">
      <img src="${themeDir}/assets/images/hero-device.png" alt="" class="object-cover w-full h-auto" aria-hidden="true"/>
    </div>
    <div class="relative md:absolute md:left-0" style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%);">
      <img src="${themeDir}/assets/images/hero-device-mockup.png" alt="" class="object-cover w-[90%] h-auto" aria-hidden="true"/>
    </div>
  `;

  // Insert as first child of hero section
  heroSection.insertBefore(bgContainer, heroSection.firstChild);
});
