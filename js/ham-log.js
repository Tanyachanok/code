document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".menu-list .item");
    const closeBtn = document.querySelector(".close-btn");

    const BASE_URL = "https://xgfbbwk2-8000.asse.devtunnels.ms";
    const LOGOUT_API = `${BASE_URL}/auth/logout`;

    // ฟังก์ชัน Logout
    async function logoutUser() {
        const token = localStorage.getItem("pe_access_token");

        try {
            await fetch(LOGOUT_API, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });
        } catch (err) {
            console.error("Logout request failed:", err);
        }

        // ลบ token ไม่ว่าผลส่ง backend จะเป็นยังไง
        localStorage.removeItem("pe_access_token");

        // redirect ไปหน้า login
        window.location.href = "login.html";
    }

    // คลิกเมนูเพื่อนำทางไปหน้าอื่น
    items.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("data-target");

            // ถ้าเป็น Log Out → ส่งไป backend
            if (item.id === "logout-btn") {
                logoutUser();
                return;
            }

            // ถ้าเป็นเมนูทั่วไป → navigate
            if (target) {
                window.location.href = target;
            }
        });
    });

    // ปุ่มปิดเมนู
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            if (window.history.length > 1) {
                window.history.back();
            }
        });
    }
});
