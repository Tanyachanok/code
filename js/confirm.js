// js/confirm.js
document.addEventListener("DOMContentLoaded", () => {
  // ===== elements =====
  const detailPills = document.querySelectorAll(".details-card .detail-pill");
  const patientPill = detailPills[0]; // HN
  const sexPill = detailPills[1];     // Gender
  const riskPill = detailPills[2];    // Risk
  const confirmPill = detailPills[3]; // Confirm PE

  const noPeBtn = document.querySelector(".result-card--nope");
  const peConfirmBtn = document.querySelector(".result-card--confirm");
  const doneBtn = document.querySelector(".done-btn");
  const menuBtn = document.querySelector(".menu");

  // ===== CONFIG =====
  const BASE_URL = "https://xgfbbwk2-8000.asse.devtunnels.ms";
  const CONFIRM_API = `${BASE_URL}/pe/confirm`;

  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  // ✅ เก็บค่าที่ผู้ใช้เลือก (ยังไม่บันทึกจนกด Done)
  let selectedIsPe = null; // null = ยังไม่เลือก, true/false = เลือกแล้ว

  // ===== menu =====
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      window.location.href = "ham-log.html";
    });
  }

  // ===== load data from localStorage =====
  let basic = null;
  let result = null;

  const basicRaw = localStorage.getItem("pe_login_basic");
  const resultRaw = localStorage.getItem("pe_login_result");

  try {
    if (basicRaw) basic = JSON.parse(basicRaw);
    if (resultRaw) result = JSON.parse(resultRaw);
  } catch (e) {
    console.error("CONFIRM: parse localStorage failed:", e);
  }

  console.log("PAGE ORIGIN =", window.location.origin);
  console.log("CONFIRM_API  =", CONFIRM_API);
  console.log("TOKEN EXISTS =", !!token);

  // ===== show HN =====
  if (patientPill) {
    const hn = basic?.no || localStorage.getItem("pe_hn") || "N/A";
    patientPill.textContent = hn;
  }

  // ===== show Gender =====
  if (sexPill) {
    let sex = basic?.gender || localStorage.getItem("pe_gender") || "-";
    if (typeof sex === "string") {
      const s = sex.toLowerCase();
      if (s === "m") sex = "Male";
      if (s === "f") sex = "Female";
    }
    sexPill.textContent = sex || "-";
  }

  // ===== show Risk (%) =====
  if (riskPill) {
    let probPercent = 0;

    if (result && result.risk_percent !== undefined && result.risk_percent !== null) {
      probPercent = Number(result.risk_percent);
    } else {
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

  // ===== initial Confirm PE text =====
  if (confirmPill) {
    confirmPill.textContent = result?.confirm_pe ?? "-";
  }

  // ===== helper: update selection UI + localStorage =====
  function setConfirmStatus(statusText, isPe) {
    selectedIsPe = isPe;

    if (confirmPill) confirmPill.textContent = statusText;

    // persist confirm_pe
    try {
      const raw = localStorage.getItem("pe_login_result");
      let data = raw ? JSON.parse(raw) : {};
      data.confirm_pe = statusText;
      localStorage.setItem("pe_login_result", JSON.stringify(data));
      result = data;
    } catch (e) {
      console.error("CONFIRM: update localStorage confirm_pe failed:", e);
    }
  }

  // ===== select cards =====
  function unselectAll() {
    noPeBtn?.classList.remove("is-selected");
    peConfirmBtn?.classList.remove("is-selected");
  }

  if (noPeBtn) {
    noPeBtn.addEventListener("click", () => {
      setConfirmStatus("No PE", false);
      unselectAll();
      noPeBtn.classList.add("is-selected");
    });
  }

  if (peConfirmBtn) {
    peConfirmBtn.addEventListener("click", () => {
      setConfirmStatus("PE Confirm", true);
      unselectAll();
      peConfirmBtn.classList.add("is-selected");
    });
  }

  // ===== send to backend (only when Done) =====
  async function sendConfirmToBackend(isPe) {
    const idPredict =
      result?.id_predict ||
      result?.id_predict_result ||
      localStorage.getItem("pe_predict_id");

    if (!idPredict) throw new Error("missing id_predict_result");

    if (!token) throw new Error("missing access token (please login again)");

    const payload = {
      id_predict_result: String(idPredict),
      pe_result: Boolean(isPe),
    };

    console.log("PAYLOAD =", payload);

    const res = await fetch(CONFIRM_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${token}`, // ✅ สำคัญมาก
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    console.log("RESPONSE STATUS =", res.status);

    const text = await res.text();
    console.log("RAW RESPONSE =", text);

    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_) {}

    if (!res.ok) {
      const detail = data.detail || data.message || text || `HTTP ${res.status}`;
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }

    return data;
  }

  // ===== Done button =====
  if (doneBtn) {
    doneBtn.addEventListener("click", async () => {
      if (selectedIsPe === null) {
        alert("กรุณาเลือกผลยืนยันก่อน (No PE หรือ PE Confirm)");
        return;
      }

      doneBtn.disabled = true;
      const oldText = doneBtn.textContent;
      doneBtn.textContent = "Saving...";

      try {
        const resJson = await sendConfirmToBackend(selectedIsPe);
        console.log("CONFIRM: saved =", resJson);

        alert("บันทึกผลยืนยันเรียบร้อยแล้ว ✅");
        window.location.href = "home4log.html";
      } catch (err) {
        console.error("CONFIRM: save failed:", err);

        // แสดงข้อความที่อ่านง่าย
        const msg = String(err?.message || err);
        alert(`บันทึกไม่สำเร็จ: ${msg}`);

        doneBtn.disabled = false;
        doneBtn.textContent = oldText;
      }
    });
  }
});
