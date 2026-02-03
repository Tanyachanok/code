// js/home4log.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");
  const countInput = document.getElementById("count");
  const sexInputs = document.querySelectorAll('input[name="sex"]');
  const menuBtn = document.querySelector(".menu-btn");

  if (!form) return;

  // ------------------------------------
  // 0) token
  // ------------------------------------
  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!token) {
    alert("ไม่พบ token กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
    window.location.href = "./login.html";
    return;
  }

  // ------------------------------------
  // 1) CONFIG API
  // ------------------------------------
  const API_HOST = "https://webapp-pe.onrender.com";

  // 🔧 ถ้า backend จริงใช้ /patient/user ให้เปลี่ยนตรงนี้ทีหลังได้
  const PATIENT_API = `${API_HOST}/patient`;
  const PREDICTION_API = `${API_HOST}/api/predictions`;

  // ------------------------------------
  // 1.1) เมนู hamburger → ไปหน้า ham-log
  // ------------------------------------
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      // ถ้าไฟล์อยู่ในโฟลเดอร์ /code ให้ใช้ "/code/ham-log.html"
      window.location.href = "./ham-log.html";
    });
  }

  // ------------------------------------
  // 2) เมื่อกด submit
  // ------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hn = (countInput.value || "").trim();
    if (!hn) {
      alert("กรุณากรอก Number of Patient");
      countInput.focus();
      return;
    }

    // อ่านเพศจาก radio แล้ว normalize เป็น Male / Female
    let sex = "Male"; // default
    sexInputs.forEach((el) => {
      if (el.checked) {
        if (el.value.toLowerCase() === "female") {
          sex = "Female";
        } else {
          sex = "Male";
        }
      }
    });

    console.log("HOME4LOG: HN =", hn, "Sex =", sex);

    // -------------------------
    // 2.1) เรียก backend เพื่อสร้าง patient + ได้ PNTxxx
    // -------------------------
    const payload = {
      no: hn,      // HN ที่หมอกรอก
      gender: sex, // Male / Female
    };

    // ถ้าเคยมี PNTxxx ใน localStorage อยู่แล้ว
    let generatedId = localStorage.getItem("pe_patient_id") || null;

    try {
      const response = await fetch(PATIENT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      console.log("HOME4LOG: Backend response from /patient =", data);

      // ------------------ กรณี ERROR ------------------
      if (!response.ok) {
        // ถ้า HN ซ้ำ (409) → ใช้ PNT เดิมจาก localStorage ถ้ามี
        if (response.status === 409) {
          console.warn("HOME4LOG: duplicate patient no");

          const oldId = localStorage.getItem("pe_patient_id");
          if (oldId) {
            generatedId = oldId;
            console.log(
              "HOME4LOG: use existing PNT from localStorage =>",
              generatedId
            );
          } else {
            alert(
              "เลขผู้ป่วยนี้มีอยู่แล้วในระบบ และไม่พบรหัสภายในเดิม (PNTxxx)\n" +
                "กรุณาตรวจสอบข้อมูลผู้ป่วยอีกครั้ง"
            );
            return;
          }
        } else {
          // error อื่น ๆ
          let msg = "ไม่สามารถบันทึกข้อมูลผู้ป่วยได้";

          if (data && data.detail) {
            if (Array.isArray(data.detail)) {
              msg = data.detail
                .map((d) => d.msg || JSON.stringify(d))
                .join("\n");
            } else if (typeof data.detail === "string") {
              msg = data.detail;
            } else {
              msg = JSON.stringify(data.detail);
            }
          }

          alert(msg);
          return;
        }
      } else {
        // ------------------ กรณีสำเร็จ (201) ------------------
        // พยายามดึง PNTxxx ให้ครอบคลุมหลายรูปแบบ response
        let backendId =
          (data && data.id_patients) ||
          (data && data.id) ||
          (data && data.patient_id) ||
          (data &&
            data.patient &&
            (data.patient.id_patients || data.patient.id)) ||
          null;

        if (backendId) {
          generatedId = backendId;
        }

        console.log("HOME4LOG: generatedId (PNTxxx) =", generatedId);
      }
    } catch (err) {
      console.error("HOME4LOG: ไม่สามารถบันทึกข้อมูลผู้ป่วยได้:", err);
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ไม่สามารถบันทึกข้อมูลผู้ป่วยได้");
      return;
    }

    // ถ้าถึงตรงนี้แล้วยังไม่มี PNTxxx เลย → หยุด
    if (!generatedId) {
      alert("Backend ไม่ได้ส่งรหัสผู้ป่วยภายใน (PNTxxx) กลับมา");
      console.log("HOME4LOG: generatedId (PNTxxx) =", generatedId);
      return;
    }

    // -------------------------
    // 2.2) เซฟลง localStorage
    // -------------------------
    console.log(
      "HOME4LOG: save to localStorage =>",
      `{no: "${hn}", patient_id: "${generatedId}", gender: "${sex}"}`
    );

    localStorage.setItem(
      "pe_login_basic",
      JSON.stringify({
        no: hn, // HN
        patient_id: generatedId, // PNTxxx
        gender: sex,
      })
    );

    localStorage.setItem("pe_hn", hn);
    localStorage.setItem("pe_patient_id", generatedId);
    localStorage.setItem("pe_gender", sex);

    // -------------------------
    // 2.3) เช็กว่ามี prediction เดิมไหม
    // -------------------------
    const url = `${PREDICTION_API}/${encodeURIComponent(hn)}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();

        let exists = false;
        if (typeof data.exists === "boolean") {
          exists = data.exists;
        } else {
          // ถ้าตอบ 200 แต่ไม่มี field exists → เดาว่ามีข้อมูล
          exists = true;
        }

        if (exists) {
          const predictionObj = data.result || data.prediction || data;

          localStorage.setItem(
            "pe_login_result",
            JSON.stringify(predictionObj)
          );

          window.location.href = "./confirm.html";
          return;
        }

        // ไม่มี prediction เดิม → ไปหน้า predic ให้กรอกใหม่
        window.location.href =
          "./predic.html?patient_id=" + encodeURIComponent(hn);
        return;
      }

      // ถ้า status ไม่ใช่ 2xx (404 ฯลฯ) → ถือว่ายังไม่มี prediction
      window.location.href =
        "./predic.html?patient_id=" + encodeURIComponent(hn);
    } catch (error) {
      console.error("HOME4LOG: เชื่อมต่อ backend ไม่ได้:", error);
      alert(
        "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ จะพาไปหน้ากรอกข้อมูลแทน"
      );
      window.location.href =
        "./predic.html?patient_id=" + encodeURIComponent(hn);
    }
  });
});
