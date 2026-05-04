document.addEventListener("DOMContentLoaded", async () => {
  const BASE_URL = "https://webapp-pe.onrender.com";

  const riskValueEl = document.getElementById("risk-percent");
  const riskCircle = document.getElementById("risk-circle");
  const backBtn = document.querySelector(".btn-secondary");
  const recommendText = document.getElementById("recommend-text");

  const circumference = 565;

  const updateRecommendation = (percent) => {
    if (!recommendText) return;

    recommendText.textContent =
      percent > 5
        ? ">5% : ควรพิจารณาส่งตรวจ CTPA เพื่อยืนยันผล"
        : "<5% : แนะนำให้เฝ้าระวังและติดตามอาการอย่างต่อเนื่อง";
  };

  const setProgress = (percent) => {
    if (riskValueEl) {
      const display =
        percent === 0
          ? "0%"
          : `${percent.toFixed(1)}%`;
  
      riskValueEl.textContent = display;
    }
  
    if (riskCircle) {
      const offset = circumference - (percent / 100) * circumference;
      riskCircle.style.strokeDashoffset = offset;
    }
  
    updateRecommendation(percent);
  };

  const setFallback = () => {
    setProgress(0);
  };

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/index.html";
    });
  }

  const raw = localStorage.getItem("pe_guest_result");

  if (!raw) {
    setFallback();
    return;
  }

  try {
    const saved = JSON.parse(raw);
    console.log("guest saved result =", saved);

    const prob =
      saved.prob_risk ??
      saved.risk_percent ??
      saved.risk_probability ??
      null;

    if (prob === null || Number.isNaN(Number(prob))) {
      setFallback();
      return;
    }

    const percent = Math.max(0, Math.min(Number(prob), 100));
    setProgress(percent);

  } catch (err) {
    console.error("error:", err);
    setFallback();
  }
});