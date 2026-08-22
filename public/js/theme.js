// Graceful image fallback: if a product/category image is missing,
// show a premium gold-on-wine monogram placeholder instead of a broken icon.
function imgFallback(img, label) {

    img.onerror = null;
    img.style.display = "none";

    const parent = img.parentElement;
    parent.classList.add("img-placeholder");

    const initial = (label || "").trim().charAt(0).toUpperCase() || "K";
    parent.setAttribute("data-initial", initial);

}

// Desktop category dropdowns are handled by CSS hover/focus.
document.addEventListener("DOMContentLoaded", () => {
    // Show login-required toast if redirected with the flag
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("loginRequired")) {

        const toast = document.getElementById("loginToast");

        if (toast) toast.classList.add("show");

    }

    // Mobile hamburger drawer
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const mobileDrawer = document.getElementById("mobileDrawer");
    const mobileOverlay = document.getElementById("mobileOverlay");
    const mobileCloseBtn = document.getElementById("mobileCloseBtn");

    function openDrawer() {
        if (mobileDrawer) mobileDrawer.classList.add("show");
        if (mobileOverlay) mobileOverlay.classList.add("show");
    }

    function closeDrawer() {
        if (mobileDrawer) mobileDrawer.classList.remove("show");
        if (mobileOverlay) mobileOverlay.classList.remove("show");
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener("click", openDrawer);
    if (mobileCloseBtn) mobileCloseBtn.addEventListener("click", closeDrawer);
    if (mobileOverlay) mobileOverlay.addEventListener("click", closeDrawer);

});


/* Reliable desktop mega-menu behavior: keep the panel open while the
   pointer moves from the category label into the full-width panel. */
document.addEventListener("DOMContentLoaded", function(){
  if (window.matchMedia("(min-width:901px)").matches) {
    const bar = document.getElementById("categoryNavbar");
    if (!bar) return;
    const items = bar.querySelectorAll(".category-container > .dropdown");
    let closeTimer = null;

    function positionPanel(item){
      const panel = item.querySelector(".dropdown-content");
      if (!panel) return;
      const rect = bar.getBoundingClientRect();
      panel.style.top = rect.bottom + "px";
      panel.style.left = "0px";
      panel.style.width = window.innerWidth + "px";
    }

    function openItem(item){
      clearTimeout(closeTimer);
      items.forEach(x => { if (x !== item) x.classList.remove("menu-open"); });
      const panel = item.querySelector(".dropdown-content");
      if (!panel) return;
      positionPanel(item);
      item.classList.add("menu-open");
      panel.classList.add("menu-open");
    }

    function closeItem(item){
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function(){
        item.classList.remove("menu-open");
        const panel = item.querySelector(".dropdown-content");
        if (panel) panel.classList.remove("menu-open");
      }, 180);
    }

    items.forEach(item => {
      const panel = item.querySelector(".dropdown-content");
      item.addEventListener("mouseenter", () => openItem(item));
      item.addEventListener("mouseleave", () => closeItem(item));
      if (panel) {
        panel.addEventListener("mouseenter", () => { clearTimeout(closeTimer); openItem(item); });
        panel.addEventListener("mouseleave", () => closeItem(item));
      }
    });
    window.addEventListener("resize", function(){
      items.forEach(item => { if (item.classList.contains("menu-open")) positionPanel(item); });
    });
    window.addEventListener("scroll", function(){
      items.forEach(item => { if (item.classList.contains("menu-open")) positionPanel(item); });
    }, {passive:true});
  }
});
