const express = require("express");
const db = require("../config.js");

router = express.Router();

router.get("/formsOffice", async (req, res) => {
  try {
    const [forms] = await db.query(`
      SELECT f.*, b.withdraw
      FROM Form f
      LEFT JOIN Budget b ON f.form_id = b.form_id
    `);
    // console.log(forms);

    let confer = [];
    let pageC = [];
    let kris = [];

    if (forms.length > 0) {
      for (let i = 0; i < forms.length; i++) {
        if (forms[i].conf_id != null) {
          console.log("1", forms[i]);
          const [conferData] = await db.query(
            "SELECT user_id FROM Conference WHERE conf_id = ?",
            [forms[i].conf_id]
          );
          const [nameC] = await db.query(
            "SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?",
            [conferData[0].user_id]
          );
          console.log("nameC", nameC);

          newC = [];
          newC.push(forms[i].conf_id, nameC[0]);
          console.log("900", newC);
          confer.push(newC);
        }

        if (forms[i].pageC_id != null) {
          // console.log("form", forms[i])
          console.log("Page 2", forms[i]);
          const [pageCData] = await db.query(
            "SELECT user_id FROM Page_Charge WHERE pageC_id = ?",
            [forms[i].pageC_id]
          );
          const [nameP] = await db.query(
            "SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?",
            [pageCData[0].user_id]
          );
          const [fileAccepted] = await db.query(
            "SELECT accepted FROM File_pdf WHERE pageC_id = ?",
            [forms[i].pageC_id]
          );
          console.log("nameP", nameP);
          console.log("fileAccepted", fileAccepted);

          newC = [];
          newC.push(forms[i].pageC_id, { ...nameP[0], ...fileAccepted[0] });
          console.log("newD", newC);
          //[PC_id , nameP]
          // pageC.push(nameP[0])
          pageC.push(newC);
        }

        if (forms[i].kris_id != null) {
          console.log("3", forms[i]);
          const [krisData] = await db.query(
            "SELECT user_id FROM Research_KRIS WHERE kris_id = ?",
            [forms[i].kris_id]
          );
          const [nameK] = await db.query(
            "SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?",
            [krisData[0].user_id]
          );
          console.log("nameK", nameK);

          newK = [];
          newK.push(forms[i].kris_id, nameK[0]);
          console.log("32323", newK);
          kris.push(newK);
        }
      }
    }
    console.log("pageC3rr3", pageC);
    return res.send({
      forms: forms,
      confer: confer,
      pageC: pageC,
      kris: kris,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/form/:user_id", async (req, res) => {
  const { user_id } = req.params;
  let { fiscalYear, type, typeStatus } = req.query;

  console.log("user_id req.params", req.params);

  try {
    // ปีงบประมาณปัจจุบัน (พ.ศ.)
    const currentYear = new Date().getFullYear() + 543;
    if (!fiscalYear) {
      fiscalYear = currentYear;
    }

    let sql = `
      SELECT f.form_id, f.form_type, f.conf_id, f.pageC_id, 
        f.kris_id, f.form_status, f.edit_data, f.date_form_edit, f.return_note,
        f.editor, f.professor_reedit, b.Research_kris_amount, b.amount_approval, f.return_to
        ,COALESCE(k.user_id, c.user_id, p.user_id) AS user_id
        ,COALESCE(k.name_research_th, c.conf_research, p.article_title) AS article_title
        ,COALESCE(c.conf_name, p.journal_name) AS article_name
        ,COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date) AS doc_submit_date
      FROM Form f
        LEFT JOIN Research_KRIS k ON f.kris_id = k.kris_id
        LEFT JOIN Conference c ON f.conf_id = c.conf_id
        LEFT JOIN Page_Charge p ON f.pageC_id = p.pageC_id
        LEFT JOIN Budget b ON f.form_id = b.form_id
      WHERE COALESCE(k.user_id, c.user_id, p.user_id) = ?
        AND (b.budget_year = ? OR b.budget_year IS NULL)
    `;

    const params = [user_id, fiscalYear];

    // filter type
    if (type && type !== "all") {
      sql += ` AND f.form_type = ?`;
      params.push(type);
    }

    // filter typeStatus (รองรับหลายค่า)
    if (typeStatus && typeStatus !== "all") {
      const statuses = typeStatus.split(",").map(s => s.trim());
      const placeholders = statuses.map(() => "?").join(",");
      sql += ` AND f.form_status IN (${placeholders})`;
      params.push(...statuses);
    }

    sql += ` ORDER BY f.form_id DESC`;

    const [form] = await db.query(sql, params);

    if (form.length === 0) {
      return res.status(404).json({ message: "has not data" });
    }

    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/allForms", async (req, res) => {
  console.log("allForms");
  try {
    let { fiscalYear, type, typeStatus } = req.query;
    console.log("Query:", req.query);
    // ปีงบประมาณปัจจุบัน (พ.ศ.)
    const currentYear = new Date().getFullYear() + 543;
    // ถ้าไม่ส่งปีมา → ใช้ปีปัจจุบัน
    if (!fiscalYear) {
      fiscalYear = currentYear;
    }

    let sql = `
      SELECT f.form_id, f.form_type, f.conf_id, f.pageC_id, f.return_to, f.return_note, f.past_return,
      f.kris_id, f.form_status,b.budget_year, b.amount_approval, b.Research_kris_amount, u.user_nameth
      ,COALESCE(k.user_id, c.user_id, p.user_id) AS user_id
      ,COALESCE(k.name_research_th, c.conf_research, p.article_title) AS article_title
      ,COALESCE(c.conf_name, p.journal_name) AS article_name
      ,COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date) AS doc_submit_date
      ,u.user_nameth
      FROM Form f
      LEFT JOIN Research_KRIS k ON f.kris_id = k.kris_id
      LEFT JOIN Conference c ON f.conf_id = c.conf_id
      LEFT JOIN Page_Charge p ON f.pageC_id = p.pageC_id
      LEFT JOIN Users u ON u.user_id = COALESCE(k.user_id, c.user_id, p.user_id)
      LEFT JOIN Budget b ON f.form_id = b.form_id
      WHERE (b.budget_year = ? OR b.budget_year IS NULL)
      `;
    const params = [fiscalYear];

    // ถ้า type != all ให้ filter เพิ่ม
    if (type && type !== "all") {
      sql += ` AND f.form_type = ?`;
      params.push(type);
    }

    // filter typeStatus
    if (typeStatus && typeStatus !== "all") {
      const statuses = typeStatus.split(",").map(s => s.trim());
      console.log("statuses", statuses);

      // แยกสถานะ 'return' ออกจากสถานะอื่น
      const returnIndex = statuses.indexOf("return");
      const isReturning = returnIndex !== -1;
      let otherStatuses = [...statuses];

      if (isReturning) {
        otherStatuses.splice(returnIndex, 1); // ลบ 'return' ออกจากกลุ่มสถานะปกติ
      }

      // สร้างเงื่อนไข WHERE
      let statusConditions = [];

      // 1. เงื่อนไขสำหรับสถานะที่ไม่ใช่ 'return' (เช่น 'research', 'hr', 'finance', 'pending')
      if (otherStatuses.length > 0) {
        const placeholders = otherStatuses.map(() => "?").join(",");
        statusConditions.push(`f.form_status IN (${placeholders})`);
        params.push(...otherStatuses);
      }

      // 2. เงื่อนไขสำหรับสถานะ 'return'
      if (isReturning) {
        // เมื่อสถานะเป็น 'return' ต้องตรวจสอบว่า f.return_to เป็นบทบาทใด
        // เนื่องจาก typeStatus ถูกส่งมาเป็นบทบาทของผู้ใช้, เราจึงใช้บทบาทนั้นเป็นเงื่อนไข
        // ตัวอย่าง: ถ้า typeStatus คือ 'research,return' บทบาทที่ต้องการคือ 'research'
        console.log("otherStatuses", otherStatuses);

        const userRole = otherStatuses.length > 0 ? otherStatuses[0] : statuses[0];

        // สำหรับ 'finance' ที่ส่งมาเป็น 'finance,pending' เราจะใช้ 'finance' เป็นตัวเทียบ
        const roleToMatch = userRole === 'pending' ? 'finance' : userRole;

        statusConditions.push(`(f.form_status = 'return' AND f.return_to = ?)`);
        params.push(roleToMatch);
        console.log("Return to role match:", roleToMatch);
      }

      // รวมเงื่อนไขทั้งหมดเข้าด้วยกัน
      if (statusConditions.length > 0) {
        sql += ` AND (${statusConditions.join(" OR ")})`;
      }
    }
    sql += ` ORDER BY f.form_id DESC`;

    const [form] = await db.query(sql, params);

    if (form.length === 0) {
      return res.status(404).json({ message: "has not data" });
    }
    console.log("form", form);

    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/formPageCharge/:id", async (req, res) => {
  console.log("get id pc in form");
  const { id } = req.params;
  console.log("form id: ", id);
  try {
    const [form] = await db.query("SELECT * FROM Form WHERE pageC_id = ?", [
      id,
    ]);
    console.log("get id pc: ", form[0]);
    res.status(200).json(form[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/formConference/:id", async (req, res) => {
  console.log("get id confer in form");
  const { id } = req.params;
  console.log("form id: ", id);
  try {
    const [form] = await db.query("SELECT * FROM Form WHERE conf_id = ?", [id]);
    console.log("get id confer: ", form[0]);
    res.status(200).json(form[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/form/:id", async (req, res) => {
  console.log("in Update form");
  const { id } = req.params;
  console.log("form id: ", id);
  const updates = req.body;
  try {
    console.log("updates: ", updates);
    const [form] = await db.query(
      `UPDATE Form SET
    form_type = ?, conf_id = ?, pageC_id = ?, kris_id = ?,
    form_status = ? WHERE form_id = ?`,
      [
        updates.form_type,
        updates.conf_id || null,
        updates.pageC_id || null,
        updates.kris_id || null,
        updates.form_status,
        id,
      ]
    );
    console.log("update form: ", form);
    res.status(200).json({ message: "form updated successfully!", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/editForm/:id", async (req, res) => {
  console.log("editForm in id:", req.params);
  const { id } = req.params;
  const updates = req.body;
  const editDataJson = JSON.stringify(req.body.edit_data);
  console.log("12345", updates);
  console.log("12345", editDataJson);
  try {
    console.log("12345");
    console.log("in conf_id");
    const [updateOfficeEditForm] = await db.query(
      `UPDATE Form SET edit_data = ? WHERE conf_id = ?`,
      [editDataJson, id]
    );
    console.log("updateOpi_result :", updateOfficeEditForm);
    res
      .status(200)
      .json({ success: true, message: "Success", data: updateOfficeEditForm });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// test many id
router.put("/confirmEditedForm/:id", async (req, res) => {
  console.log("confirmEditedForm in id:", req.params);
  const { id } = req.params;
  const updates = req.body;
  console.log("12345", updates);
  try {
    console.log("in form id type", id);
    let targetField = null;
    if (updates.conf_id != null) {
      targetField = "conf_id";
    } else if (updates.pageC_id != null) {
      targetField = "pageC_id";
    }
    if (targetField) {
      const [updateConfirmEditetForm] = await db.query(
        `UPDATE Form SET edit_data = ?, editor = ?, professor_reedit = ? WHERE ${targetField} = ?`,
        [null, null, false, updates[targetField]]
      );
      console.log("updateOpi_result :", updateConfirmEditetForm);
    } else {
      console.log("ไม่พบ field ที่ต้องการอัปเดตใน updates");
    }
    res.status(200).json({ success: true, message: "Success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/updatestatus_confer/:id", async (req, res) => {
  console.log("update status in id:", req.params);
  const { id } = req.params;
  const body = req.body;

  console.log("req.body:", req.body);
  console.log("req.params", req.params);
  try {
    const [updateStatus] = await db.query(
      `UPDATE Form SET form_status = ?, return_to = ?, return_note = ? WHERE conf_id = ?`,
      [body.form_status, body.return, body.description, id]
    );
    console.log("updateStatus_result :", updateStatus);

    const recipients = ["64070075@it.kmitl.ac.th"];
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีการตีกลับแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุม";
    const message = `
      มีการส่งแบบฟอร์มขอรับการสนับสนุนจาก "{getuser[0][0].user_nameth}" งานวิจัย: "{conferenceData.conf_name}" กำลังรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    await sendEmail(recipients, subject, message);

    res.status(200).json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error("Error updating status:", err);
  }
});

router.put("/updatestatus_pageC/:id", async (req, res) => {
  console.log("update status in id:", req.params);
  const { id } = req.params;
  const body = req.body;

  console.log("req.body:", req.body);
  console.log("req.params", req.params);
  try {
    const [updateStatus] = await db.query(
      `UPDATE Form SET form_status = ?, return_to = ?, return_note = ? WHERE pageC_id = ?`,
      [body.form_status, body.return, body.description, id]
    );
    console.log("updateStatus_result :", updateStatus);

    const recipients = ["64070075@it.kmitl.ac.th"];
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีการตีกลับแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุม";
    const message = `
      มีการส่งแบบฟอร์มขอรับการสนับสนุนจาก "{getuser[0][0].user_nameth}" งานวิจัย: "{conferenceData.conf_name}" กำลังรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    await sendEmail(recipients, subject, message);

    res.status(200).json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error("Error updating status:", err);
  }
});
exports.router = router;
