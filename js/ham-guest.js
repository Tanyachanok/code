// js/ham-guest.js
document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".menu-list .item");
    const closeBtn = document.querySelector(".close-btn");
  
    items.forEach(item => {
      item.addEventListener("click", () => {
        const target = item.getAttribute("data-target");
        if (target) {
          window.location.href = target;
        }
      });
    });
  
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (window.history.length > 1) {
          window.history.back();
        }
      });
    }
  });
  