// js/history2.js
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const predictId = params.get("id"); // มาจาก history1.html?id=PDT003

  const token = localStorage.getItem("pe_access_token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "login.html";
    return;
  }

  if (!predictId) {
    alert("ไม่พบ predict id");
    return;
  }

  // ✅ ใช้ devtunnels
  const BASE_URL = "https://xgfbbwk2-8000.asse.devtunnels.ms";
  const API = `${BASE_URL}/record/${encodeURIComponent(predictId)}`;

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v ?? "-";
  };

  const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : "-");

  // ✅ แปลงวันที่เป็น พ.ศ. (แสดงวัน/เดือน/ปี + เวลา)
  function formatThaiDateTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";

    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear() + 543;

    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hh}:${mm}`;
  }

  try {
    console.log("CALL RECORD =", API);

    const res = await fetch(API, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const text = await res.text();
    console.log("RECORD STATUS =", res.status);
    console.log("RECORD RAW TEXT =", text);

    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_) {}

    if (!res.ok) {
      const detail = data.detail || data.message || text || "เรียก API ไม่สำเร็จ";
      alert(typeof detail === "string" ? detail : JSON.stringify(detail));
      return;
    }

    console.log("RECORD JSON =", data);

    // ===== pill: HN + Date =====
    setText("pill-hn", data.no ?? data.hn ?? "-");

    // ✅ เลือก field วันจาก backend (ลองหลายชื่อ)
    const dateIso =
      data.predicted_date ??
      data.created_at ??
      data.updated_at ??
      data.date ??
      data.created_date ??
      data.timestamp ??
      null;

    setText("pill-date", formatThaiDateTime(dateIso));

    // ===== table fields =====
    setText("val-gender", data.gender);
    setText("val-age", data.age);
    setText("val-ecog", data.ecog);

    setText("val-heart_rate", data.heart_rate);
    setText("val-systolic", data.systolic ?? data.systolic_bp);
    setText("val-diastolic", data.diastolic ?? data.diastolic_bp);
    setText("val-spo2", data.spo2);
    setText("val-fio2", data.fio2);

    setText("val-hemoptysis", yesNo(data.hemoptysis));
    setText("val-pleuritic_chest", yesNo(data.pleuritic_chest));
    setText("val-syncope", yesNo(data.syncope));
    setText("val-isolated_leg", yesNo(data.isolated_leg));

    setText("val-type_cancer", data.type_cancer ?? data.cancer_type);
    setText("val-solid_type", data.solid_type ?? data.solid_cancer_type);
    setText("val-hema_type", data.hema_type ?? data.hematologic_cancer_type);

    setText("val-lung_met", yesNo(data.lung_met ?? data.metastasis_to_lung));
    setText("val-chest_xray", data.chest_xray);
    setText("val-d_dimer", data.d_dimer);

    // ✅ ถ้า backend ส่ง confirm มา
    setText("val-pe_confirm", data.pe_confirm ?? data.confirm_pe ?? "-");
  } catch (err) {
    console.error("fetch failed:", err);
    alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }

  // back
  document.querySelector(".back-btn")?.addEventListener("click", () => {
    window.location.href = "history1.html";
  });
});
