
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".form");
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // ป้องกันการรีเฟรชหน้าจอ

        // 1. เรียกใช้ฟังก์ชันตรวจสอบข้อมูล (จะแสดงดอกจันและ Swal เตือนในนี้)
        if (!validateForm()) {
            return; // ถ้าข้อมูลไม่ครบ ให้หยุดการทำงานตรงนี้เลย
        }

        // 2. ถ้าข้อมูลครบถ้วน เตรียม Payload
        const payload = {
            first_name: document.getElementById("first_name").value.trim(),
            last_name: document.getElementById("last_name").value.trim(),
            username: document.getElementById("username").value.trim(),
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value.trim(),
            confirm_password: document.getElementById("confirm").value.trim(),
        };

        // 3. เริ่มกระบวนการส่งข้อมูล (ล็อกปุ่ม)
        submitButton.disabled = true;
        submitButton.textContent = "Signing up...";

        try {
            const BASE_URL = "https://webapp-pe.onrender.com";
            const REGISTER_API = `${BASE_URL}/auth/register`;

            const response = await fetch(REGISTER_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorDetail = "สมัครสมาชิกไม่สำเร็จ";
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorDetail;
                } catch (_) {}
                
                Swal.fire({
                    title: "เกิดข้อผิดพลาด",
                    text: errorDetail,
                    icon: "error",
                    confirmButtonColor: "#e63946"
                });
                return;
            }

            const data = await response.json();
            console.log("Register success:", data);

            // แจ้งเตือนสำเร็จและเปลี่ยนหน้า
            Swal.fire({
                title: "สำเร็จ!",
                text: "สมัครสมาชิกสำเร็จ กำลังกลับไปหน้า Login...",
                icon: "success",
                confirmButtonColor: "#2a9d8f",
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = "/login.html";
            });

        } catch (error) {
            console.error("Network error:", error);
            Swal.fire("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "โปรดลองใหม่อีกครั้งภายหลัง", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Sign Up";
        }
    });
});

// --- ฟังก์ชันเสริม (Helper Functions) ---
function clearErrors() {
    document.querySelectorAll(".field").forEach((field) => {
        field.classList.remove("has-error");
    });
}

function validateForm() {
    clearErrors();
    let isValid = true;

    // เช็คช่องที่จำเป็น (Required)
    const requiredInputs = document.querySelectorAll(".form input[required]");
    requiredInputs.forEach((input) => {
        if (input.value.trim() === "") {
            input.closest(".field").classList.add("has-error");
            isValid = false;
        }
    });

    if (!isValid) {
        Swal.fire({
            title: "กรอกข้อมูลไม่ครบ",
            text: "กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน",
            icon: "warning",
            confirmButtonText: "เข้าใจแล้ว",
            confirmButtonColor: "#f4a261",
        });
        return false;
    }

    // เช็ครหัสผ่านตรงกันไหม
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (password !== confirm) {
        document.getElementById("confirm").closest(".field").classList.add("has-error");
        Swal.fire({
            title: "รหัสผ่านไม่ตรงกัน",
            text: "Password และ Confirm Password ต้องเหมือนกัน",
            icon: "error",
            confirmButtonColor: "#e63946",
        });
        return false;
    }

    return true;
}