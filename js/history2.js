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
  
    const BASE_URL = "http://127.0.0.1:8000";
    const API = `${BASE_URL}/record/${encodeURIComponent(predictId)}`;
  
    const setText = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = (v ?? "-");
    };
  
    const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : "-");
  
    try {
      const res = await fetch(API, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
      });
  
      if (!res.ok) {
        const t = await res.text();
        console.error("record api error:", res.status, t);
        alert("ไม่พบข้อมูลหรือเรียก API ไม่สำเร็จ");
        return;
      }
  
      const data = await res.json();
      console.log("RECORD =", data);
  
      // pill
      setText("pill-hn", data.no);
      // ถ้า backend ยังไม่มีวันที่ ก็ปล่อย "-"
      // setText("pill-date", data.predicted_date);
  
      // map fields (ชื่อ key ตรงกับรูป postman)
      setText("val-gender", data.gender);
      setText("val-age", data.age);
      setText("val-ecog", data.ecog);
  
      setText("val-heart_rate", data.heart_rate);
      setText("val-systolic", data.systolic);
      setText("val-diastolic", data.diastolic);
      setText("val-spo2", data.spo2);
      setText("val-fio2", data.fio2);
  
      setText("val-hemoptysis", yesNo(data.hemoptysis));
      setText("val-pleuritic_chest", yesNo(data.pleuritic_chest));
      setText("val-syncope", yesNo(data.syncope));
      setText("val-isolated_leg", yesNo(data.isolated_leg));
  
      setText("val-type_cancer", data.type_cancer);
      setText("val-solid_type", data.solid_type);
      setText("val-hema_type", data.hema_type);
  
      setText("val-lung_met", yesNo(data.lung_met));
      setText("val-chest_xray", data.chest_xray);
      setText("val-d_dimer", data.d_dimer);
  
    } catch (err) {
      console.error("fetch failed:", err);
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  
    // back
    document.querySelector(".back-btn")?.addEventListener("click", () => {
      window.location.href = "history1.html";
    });
  });
  