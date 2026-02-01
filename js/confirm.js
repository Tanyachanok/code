// js/confirm.js
document.addEventListener("DOMContentLoaded", () => {
  // ===== element ต่าง ๆ =====
  const detailPills = document.querySelectorAll(".details-card .detail-pill");
  const patientPill = detailPills[0];  // Number of Patient (HN)
  const sexPill     = detailPills[1];  // Sex
  const riskPill    = detailPills[2];  // Risk
  const confirmPill = detailPills[3];  // Confirm PE

  const noPeBtn      = document.querySelector(".result-card--nope");
  const peConfirmBtn = document.querySelector(".result-card--confirm");

  const menuBtn = document.querySelector(".menu");

  // ===== CONFIG API + token =====
  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const CONFIRM_API = "http://127.0.0.1:8000/pe/confirm";

  // ===== ปุ่มเมนู 3 ขีด =====
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      window.location.href = "ham-log.html";
    });
  }

  // ===== อ่านข้อมูลพื้นฐานจาก localStorage =====
  let basic = null;
  let result = null;

  const basicRaw  = localStorage.getItem("pe_login_basic");
  const resultRaw = localStorage.getItem("pe_login_result");

  try {
    if (basicRaw)  basic  = JSON.parse(basicRaw);
    if (resultRaw) result = JSON.parse(resultRaw);
  } catch (e) {
    console.error("CONFIRM: อ่านข้อมูลจาก localStorage ไม่ได้:", e);
  }

  console.log("CONFIRM: basic =", basic);
  console.log("CONFIRM: result =", result);

  // ===== แสดง Number of Patient (HN) =====
  if (patientPill) {
    const hn =
      basic?.no ||
      localStorage.getItem("pe_hn") ||
      "N/A";
    patientPill.textContent = hn;
  }

  // ===== แสดง Sex =====
  if (sexPill) {
    let sex =
      basic?.gender ||
      localStorage.getItem("pe_gender") ||
      "-";

    if (typeof sex === "string") {
      const s = sex.toLowerCase();
      if (s === "m") sex = "Male";
      if (s === "f") sex = "Female";
    }

    sexPill.textContent = sex || "-";
  }

  // ===== แสดง Risk (%) จาก pe_login_result.risk_percent =====
  if (riskPill) {
    let probPercent = 0;

    if (result && result.risk_percent !== undefined && result.risk_percent !== null) {
      probPercent = Number(result.risk_percent);
    } else {
      // เผื่ออนาคต fallback จาก field อื่น ๆ
      let prob =
        result?.risk_percent ??
        result?.risk_probability ??
        result?.probability ??
        result?.prob ??
        result?.prob_risk ??
        result?.risk ??
        0;

      if (prob <= 1) prob = prob * 100;
      probPercent = Number(prob);
    }

    if (Number.isNaN(probPercent)) probPercent = 0;
    probPercent = Math.max(0, Math.min(probPercent, 100));

    riskPill.textContent = `${probPercent.toFixed(0)}%`;
  }

  // ===== ค่าเริ่มต้นของ Confirm PE =====
  if (confirmPill) {
    confirmPill.textContent = result?.confirm_pe ?? "-";
  }

  // ===== ฟังก์ชันยิงไป backend =====
  async function sendConfirmToBackend(isPe) {
    try {
      // เอา id_predict จาก pe_login_result หรือจาก localStorage
      const idPredict =
        result?.id_predict ||
        localStorage.getItem("pe_predict_id");

      if (!idPredict) {
        console.warn("CONFIRM: ไม่พบ id_predict สำหรับส่งไป backend");
        alert("ไม่พบรหัสการพยากรณ์ (id_predict) กรุณาลองใหม่อีกครั้ง");
        return;
      }

      const payload = {
        id_predict_result: String(idPredict),
        pe_result: Boolean(isPe),  // true = เป็น PE, false = ไม่เป็น
      };

      console.log("CONFIRM: ส่งไป backend =", payload);

      const res = await fetch(CONFIRM_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("CONFIRM: backend error", res.status, text);
        alert("บันทึกผลยืนยันไม่สำเร็จ\nStatus: " + res.status);
        return;
      }

      let resJson = {};
      try {
        resJson = await res.json();
      } catch {
        resJson = {};
      }

      console.log("CONFIRM: บันทึกผลเรียบร้อย =", resJson);
      // ถ้าอยากให้กลับหน้า home4log:
      // window.location.href = "home4log.html";

    } catch (err) {
      console.error("CONFIRM: fetch error", err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  }

  // ===== ฟังก์ชันช่วยเซ็ตสถานะ Confirm PE + อัปเดต localStorage + ยิง backend =====
  function setConfirmStatus(statusText, isPe) {
    if (confirmPill) {
      confirmPill.textContent = statusText;
    }

    // อัปเดตใน result แล้วเซฟกลับ localStorage
    try {
      const raw = localStorage.getItem("pe_login_result");
      let data = raw ? JSON.parse(raw) : {};
      data.confirm_pe = statusText;
      localStorage.setItem("pe_login_result", JSON.stringify(data));
      result = data; // อัปเดตตัวแปรในหน้านี้ด้วย
    } catch (e) {
      console.error("CONFIRM: ไม่สามารถอัปเดต confirm_pe ใน localStorage ได้:", e);
    }

    // ยิงไป backend
    sendConfirmToBackend(isPe);
  }

  // ===== คลิก No PE / PE Confirm =====
  if (noPeBtn) {
    noPeBtn.addEventListener("click", () => {
      setConfirmStatus("No PE", false);
      noPeBtn.classList.add("is-selected");
      peConfirmBtn?.classList.remove("is-selected");
    });
  }

  if (peConfirmBtn) {
    peConfirmBtn.addEventListener("click", () => {
      setConfirmStatus("PE Confirm", true);
      peConfirmBtn.classList.add("is-selected");
      noPeBtn?.classList.remove("is-selected");
    });
  }
});
