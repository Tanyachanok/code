document.addEventListener("DOMContentLoaded", async () => {
  const BASE_URL = "https://webapp-pe.onrender.com";

  // ดึง Element ที่ถูกต้องตาม ID ใน HTML
  const riskValueEl = document.getElementById("risk-percent");
  const riskCircle = document.getElementById("risk-circle"); // ตัววงกลม SVG
  const backBtn = document.querySelector(".btn-secondary");

  // ค่าเส้นรอบวง (Circumference) ของวงกลม r=90 คือ 2 * pi * 90 ≈ 565
  const circumference = 565;

  const setProgress = (percent) => {
    if (riskValueEl) riskValueEl.textContent = `${percent.toFixed(0)}%`;
    
    if (riskCircle) {
      // คำนวณระยะเส้นที่จะให้แสดง (Dashoffset)
      const offset = circumference - (percent / 100) * circumference;
      riskCircle.style.strokeDashoffset = offset;
    }
  };

  const setFallback = () => {
    setProgress(0);
  };

  // ปุ่ม Home
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/index.html";
    });
  }

  // 1) อ่านข้อมูลจาก localStorage
  const raw = localStorage.getItem("pe_guest_result");
  if (!raw) {
    setFallback();
    return;
  }

  try {
    const saved = JSON.parse(raw);
    
    if (!id) { return setFallback(); }

    // 2) ดึงผลจาก Backend
    
    const json = await res.json();

    if (!res.ok) { return setFallback(); }

    // 3) แสดงผล
    const prob = Number(json.result.prob_risk || 0);
    const percent = Math.max(0, Math.min(prob, 100));

    setProgress(percent);

  } catch (err) {
    console.error("error:", err);
    setFallback();
  }
});