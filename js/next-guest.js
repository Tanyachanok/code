// js/next-guest.js
document.addEventListener("DOMContentLoaded", async () => {
  const BASE_URL = "https://xgfbbwk2-8000.asse.devtunnels.ms";

  const riskValueEl = document.querySelector(".risk-value");
  const riskGroupEl = document.querySelector(".risk-group");
  const riskThumbEl = document.querySelector(".risk-thumb");
  const recommendTextEl = document.querySelector(".recommend-text");
  const backBtn = document.querySelector(".btn-secondary");

  const setFallback = () => {
    riskValueEl.textContent = "0%";
    riskGroupEl.textContent = "ไม่พบข้อมูลกลุ่มความเสี่ยง";
    recommendTextEl.textContent = "ไม่พบคำแนะนำ";
  };

  backBtn?.addEventListener("click", () => {
    window.location.href = "prediction-guest.html";
  });

  // 1) อ่าน id จาก localStorage
  const raw = localStorage.getItem("pe_guest_result");
  if (!raw) {
    setFallback();
    return;
  }

  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    setFallback();
    return;
  }

  const id = saved.id;
  if (!id) {
    setFallback();
    return;
  }

  // 2) ดึงผลจริงจาก backend
  const url = `${BASE_URL}/predict/${id}`;
  console.log("GET predict result:", url);

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      console.error("GET predict error:", json);
      setFallback();
      return;
    }

    const data = json.result;

    // 3) map ค่า
    const prob = Number(data.prob_risk || 0);
    const percent = Math.max(0, Math.min(prob, 100));

    riskValueEl.textContent = `${percent.toFixed(0)}%`;
    riskGroupEl.textContent = data.risk_name || "-";
    recommendTextEl.textContent = data.recommendation || "-";

    if (riskThumbEl) {
      const clamped = Math.max(0, Math.min(percent, 100));
      riskThumbEl.style.left = `${clamped}%`;
      // ❌ ไม่ต้อง set transform ใน JS ให้ใช้ของ CSS: translate(-50%, -50%)
    }
    

  } catch (err) {
    console.error("fetch error:", err);
    setFallback();
  }
});
