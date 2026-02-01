// js/ham-guest.js
document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".menu-list .item");
    const closeBtn = document.querySelector(".close-btn");
  
    // เมื่อคลิกแต่ละเมนู → ไปหน้าเป้าหมาย
    items.forEach(item => {
      item.addEventListener("click", () => {
        const target = item.getAttribute("data-target");
        if (target) {
          window.location.href = target;
        }
      });
    });
  
    // ปุ่ม X → กลับหน้าก่อนหน้า (ถ้ามี history)
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (window.history.length > 1) {
          window.history.back();
        }
      });
    }
  });
  