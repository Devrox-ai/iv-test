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

// Category dropdown toggle
document.addEventListener("DOMContentLoaded", () => {

    const dropdowns = document.querySelectorAll(".dropdown");

    dropdowns.forEach(dropdown => {
        dropdown.addEventListener("click", () => {
            dropdown.classList.toggle("active");
        });
    });

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
