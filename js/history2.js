// js/history2.js
document.addEventListener("DOMContentLoaded", async () => {

  const menuBtn = document.querySelector(".menu-btn");
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    window.location.href = "/ham-log.html";
  });
}

  const BASE_URL = "https://webapp-pe.onrender.com";

  const params = new URLSearchParams(window.location.search);
  const predictId = params.get("id");

  // ลบ id ออกจาก URL ที่โชว์
  if (window.location.search) {
  window.history.replaceState({}, document.title, window.location.pathname);
  }

  const token = localStorage.getItem("pe_access_token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "/login.html";
    return;
  }
  // if (!predictId) {
  //   alert("ไม่พบ predict id");
  //   return;
  // }

  const API_RECORD = `${BASE_URL}/record/${encodeURIComponent(predictId)}`;
  const API_TIMELINE = `${BASE_URL}/record/timeline`; // ?no=xxxx


  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = v ?? "-";
  };

  const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : "-");

  // ดึงค่าจาก object ตาม key หลายชื่อ (กันชื่อ field ไม่ตรง)
  const pick = (obj, keys) => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
  };

  // แปลง iso date → เวลา
  function formatThaiDateTime(iso) {
    if (!iso) return "-";

    let isoString = String(iso).trim();

    isoString = isoString.split(".")[0];

    isoString += "Z";
      
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "-";

    //const thaiTime = new Date(d.getTime() + (7 * 60 * 60 * 1000));

    //const day = String(thaiTime.getUTCDate()).padStart(2, "0");
    //const month = String(thaiTime.getUTCMonth() + 1).padStart(2, "0");
    //const year = thaiTime.getUTCFullYear();

    //const hh = String(thaiTime.getUTCHours()).padStart(2, "0");
    //const mm = String(thaiTime.getUTCMinutes()).padStart(2, "0");
    
    //return `${day}-${month}-${year} ${hh}:${mm}`;

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(d);
  
    const get = (type) => parts.find(p => p.type === type)?.value;
  
    return `${get("day")}-${get("month")}-${get("year")} ${get("hour")}:${get("minute")}`;
  }

  // normalize type cancer ให้เหลือ solid / hematologic / unknown
  function normalizeCancerType(v) {
    if (v === undefined || v === null) return "unknown";
    const s = String(v).trim().toLowerCase();

    // รองรับหลายรูปแบบ
    if (["solid", "solid cancer", "s"].includes(s)) return "solid";
    if (["hematologic", "haematologic", "heme", "h"].includes(s)) return "hematologic";

    // บางที backend ส่งเป็น 0/1 หรือ enum
    if (s === "0") return "solid";
    if (s === "1") return "hematologic";

    return s; // เผื่อส่งเป็นคำเต็มอื่น ๆ
  }

  // แปลง PE Confirm ให้เป็นข้อความที่โชว์
  // รองรับ: true/false, "PE Confirm", "No PE", "yes/no", "1/0"
  function normalizePeConfirm(v) {
    if (v === undefined || v === null) return "-";

    if (typeof v === "boolean") return v ? "Positive" : "Negative";
    if (typeof v === "number") return v === 1 ? "Positive" : v === 0 ? "Negative" : String(v);

    const s = String(v).trim().toLowerCase();
    if (!s) return "-";

    if (["true", "yes", "y", "pe", "pe confirm", "confirm", "positive", "1"].includes(s)) return "Positive";
    if (["false", "no", "n", "no pe", "negative", "0"].includes(s)) return "Negative";

    // ถ้า backend ส่งเป็นข้อความอยู่แล้วก็คืนกลับ
    return String(v);
  }

  // show/hide row ตาม label text (กรณีไม่มี id แถว)
  function toggleRowByLabel(labelText, show) {
    const rows = document.querySelectorAll(".info-table .info-row");
    rows.forEach((row) => {
      const labelEl = row.querySelector(".label");
      if (!labelEl) return;
      const t = labelEl.textContent.trim().toLowerCase();
      if (t === labelText.trim().toLowerCase()) {
        row.style.display = show ? "" : "none";
      }
    });
  }

  // เงื่อนไขแสดง solid/hema row
  function applyCancerRowCondition(typeCancerRaw) {
    const t = normalizeCancerType(typeCancerRaw);

    // ชื่อ label ใน HTML ของเธอคือ:
    // "Solid Cancer Type"
    // "Hematologic Cancer Type"
    if (t === "solid") {
      toggleRowByLabel("Solid Cancer Type", true);
      toggleRowByLabel("Hematologic Cancer Type", false);
    } else if (t === "hematologic") {
      toggleRowByLabel("Solid Cancer Type", false);
      toggleRowByLabel("Hematologic Cancer Type", true);
    } else {
      // unknown → ซ่อนไว้ทั้งคู่ หรือจะโชว์ทั้งคู่ก็ได้
      toggleRowByLabel("Solid Cancer Type", false);
      toggleRowByLabel("Hematologic Cancer Type", false);
    }

    console.log("CANCER_TYPE_RAW =", typeCancerRaw, "=> NORMALIZED =", t);
  }

  // -----------------------------
  // 2) ดึง timeline เพื่อหา date/หรือ confirm (fallback)
  // -----------------------------
  async function fetchTimelineList(hn) {
    const url = `${API_TIMELINE}?no=${encodeURIComponent(hn)}`;
    console.log("CALL TIMELINE =", url);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const text = await res.text();
    console.log("TIMELINE STATUS =", res.status);
    // console.log("TIMELINE RAW TEXT =", text);

    let raw = {};
    try {
      raw = text ? JSON.parse(text) : {};
    } catch (_) {}

    if (!res.ok) {
      const detail = raw.detail || raw.message || text;
      throw new Error(
        `timeline HTTP ${res.status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`
      );
    }

    const list = raw.result ?? raw.data ?? raw;
    return Array.isArray(list) ? list : [];
  }

  function findTimelineItem(list, pid) {
    return list.find((x) => {
      const id = x.predict_id ?? x.id_predict ?? x.id ?? x.id_predict_result;
      return String(id) === String(pid);
    });
  }

  // -----------------------------
  // 3) MAIN: ดึง record แล้ว map ลงหน้า
  // -----------------------------
  try {
    console.log("CALL RECORD =", API_RECORD);

    const res = await fetch(API_RECORD, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const text = await res.text();
    console.log("RECORD STATUS =", res.status);
    // console.log("RECORD RAW TEXT =", text);

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

    // -----------------------------
    // 3.1 pill: HN
    // -----------------------------
    const hn = pick(data, ["no", "hn", "hospital_number"]);
    setText("pill-hn", hn ?? "-");

    // -----------------------------
    // 3.2 pill: DATE (record -> timeline)
    // -----------------------------
    let dateIso = pick(data, [
      "predicted_date",
      "created_at",
      "updated_at",
      "date",
      "created_date",
      "timestamp",
    ]);

    // ถ้าใน record ไม่มี date → ไป timeline
    if (!dateIso && hn) {
      try {
        const timelineList = await fetchTimelineList(hn);
        const found = findTimelineItem(timelineList, predictId);

        const dateFromTimeline = pick(found, [
          "predicted_date",
          "created_at",
          "updated_at",
          "date",
          "created_date",
          "timestamp",
        ]);

        dateIso = dateFromTimeline ?? null;
        console.log("DATE FROM TIMELINE =", dateIso);
      } catch (e) {
        console.error("TIMELINE FETCH ERROR =", e);
      }
    }

    setText("pill-date", formatThaiDateTime(dateIso));

    // -----------------------------
    // 3.3 table fields
    // -----------------------------
    setText("val-gender", pick(data, ["gender", "sex"]));
    setText("val-heart_rate", pick(data, ["pulse_rate"]));
    setText("val-systolic", pick(data, ["systolic_bp"]));
    setText("val-diastolic", pick(data, ["diastolic_bp"]));
    setText("val-hemoglobin", pick(data, ["hemoglobin"]));
    setText("val-spo2", pick(data, ["o2sat", "spo2", "oxygen_saturation"]));
    setText("val-d_dimer", pick(data, ["d_dimer"]));
    setText("val-hemoptysis", yesNo(pick(data, ["hemoptysis"])));
    setText("val-acute_dyspnea", yesNo(pick(data, ["acute_dyspnea", "acuteDyspnea"])));
    setText("val-isolated_leg", yesNo(pick(data, ["one_leg_edema"])));
    setText("val-stage_cancer", pick(data, ["cancer_stage", "stage_cancer", "stage"]))



    // Cancer
    const typeCancerRaw = pick(data, ["cate_cancer","type_cancer", "cancer_type", "cancer_group"]);
    setText("val-type_cancer", typeCancerRaw ?? "-");

    const subtypeCancer = pick(data, ["subtype_cancer", "solid_type", "solid_cancer_type", "hema_type", "hematologic_cancer_type"]);
    setText("val-solid_type", subtypeCancer);
    setText("val-hema_type", subtypeCancer);

    // เงื่อนไขแสดงแถว solid/hema
    applyCancerRowCondition(typeCancerRaw);

    setText("val-lung_met", yesNo(pick(data, ["lung_met", "metastasis_to_lung"])));
    setText("val-chest_xray", pick(data, ["chest_xray"]));
    setText("val-d_dimer", pick(data, ["d_dimer"]));

    // -----------------------------
    // 3.4 PE CONFIRM (สำคัญ)
    // -----------------------------
    // พยายามดึงจาก record ก่อน
    let peConfirmRaw = pick(data, [
      "pe",
      "pe_confirm",
      "confirm_pe",
      "pe_result",
      "pe_status",
      "diagnostic_pe",
    ]);

    console.log("PE_CONFIRM_RAW(from record) =", peConfirmRaw);

    // ถ้า record ไม่มี → ลอง timeline item (บางระบบ timeline จะมี confirm)
    if ((peConfirmRaw === undefined || peConfirmRaw === null) && hn) {
      try {
        const timelineList = await fetchTimelineList(hn);
        const found = findTimelineItem(timelineList, predictId);

        peConfirmRaw = pick(found, [
          "pe_confirm",
          "confirm_pe",
          "pe_result",
          "pe_status",
        ]);

        console.log("PE_CONFIRM_RAW(from timeline) =", peConfirmRaw);
      } catch (e) {
        console.error("TIMELINE CONFIRM FETCH ERROR =", e);
      }
    }

    const peConfirmText = normalizePeConfirm(peConfirmRaw);
    console.log("PE_CONFIRM_TEXT =", peConfirmText);

    setText("val-pe_confirm", peConfirmText);

  } catch (err) {
    console.error("fetch failed:", err);
    alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }

  // -----------------------------
  // 4) back button
  // -----------------------------
  document.querySelector(".back-btn")?.addEventListener("click", () => {
    window.location.href = "/history1.html";
  });
});

