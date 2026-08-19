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

});
