// js/detail.js
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DETAIL: script loaded ✅");

  // -----------------------------
  // 1) ดึง element จากหน้า HTML
  // -----------------------------
  const fullNameEl = document.getElementById("fullname");
  const usernameEl = document.getElementById("username_field");
  const emailEl = document.getElementById("email_field");
  const avatarInitialEl = document.getElementById("avatarInitial");


  // helper ใส่ค่า + log
  function setField(el, value) {
    if (!el) return;
    console.log("DETAIL: setField ->", el.id, "=", `"${value}"`);
    el.textContent = value;
  }

  // แสดงสถานะก่อนโหลด
  setField(fullNameEl, "Loading...");
  setField(usernameEl, "Loading...");
  setField(emailEl, "Loading...");

  function getInitials(firstName, lastName, fallback = "?") {
    const f = (firstName || "").trim();
    const l = (lastName || "").trim();
  
    const fi = f ? f[0] : "";
    const li = l ? l[0] : "";
  
    const initials = (fi + li).toUpperCase();
    if (initials) return initials;
  
    // fallback: ใช้ตัวแรกของ fullname/username/email
    const fb = (fallback || "").toString().trim();
    return fb ? fb[0].toUpperCase() : "?";
  }
  

  // -----------------------------
  // 2) token จาก localStorage
  // -----------------------------
  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "login.html";
    return;
  }

  // -----------------------------
  // 3) CONFIG BACKEND
  // -----------------------------
  const API_ROOT = "https://xgfbbwk2-8000.asse.devtunnels.ms";
  const ME_API = `${API_ROOT}/user/me`;   // ✅ ใช้ path นี้ตามที่บอก

  try {
    console.log("DETAIL: call ->", ME_API);

    const response = await fetch(ME_API, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
      },
    });

    console.log("DETAIL: profile status =", response.status);

    if (!response.ok) {
      // ถ้า token หมดอายุ
      if (response.status === 401 || response.status === 403) {
        alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.location.href = "login.html";
        return;
      }

      // กรณีอื่น เช่น 404
      setField(fullNameEl, "-");
      setField(usernameEl, "-");
      setField(emailEl, "-");
      throw new Error("Cannot fetch user profile");
    }

    const rawData = await response.json();
    console.log("DETAIL: raw profile data =", rawData);

    const data = rawData.result || rawData;   // เผื่อ backend ห่อใน result
    console.log("DETAIL: user object =", data);

    // -----------------------------
    // 4) map field ให้ตรงกับ register
    // -----------------------------
    const firstName =
      data.first_name || data.firstname || data.firstName || "";
    const lastName =
      data.last_name || data.lastname || data.lastName || "";

    let fullName =
      data.full_name || data.name || `${firstName} ${lastName}`.trim();

    if (!fullName || fullName.trim() === "") {
      fullName = "-";
    }

    const username = data.username || data.user_name || "-";
    const email = data.email || data.email_address || "-";

    console.log("DETAIL: final values =", {
      fullName,
      username,
      email,
    });

    const initials = getInitials(firstName, lastName, fullName || username || email);
    if (avatarInitialEl) {
      console.log("DETAIL: initials =", initials);
      avatarInitialEl.textContent = initials;
}


    // -----------------------------
    // 5) อัปเดตบนหน้า
    // -----------------------------
    setField(fullNameEl, fullName);
    setField(usernameEl, username);
    setField(emailEl, email);
  } catch (err) {
    console.error("DETAIL: error fetching profile:", err);
    setField(fullNameEl, "-");
    setField(usernameEl, "-");
    setField(emailEl, "-");
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
  }

  // -----------------------------
  // 6) ปุ่ม Done → กลับเมนูหลัก
  // -----------------------------
  const btn = document.querySelector(".btn");
  if (btn) {
    btn.addEventListener("click", () => {
      window.location.href = "ham-log.html";
    });
  }
});
