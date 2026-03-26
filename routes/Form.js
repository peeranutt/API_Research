const express = require("express");
const db = require("../config/db");
const { getRecipientEmail } = require("../utils/emailRecipient");

router = express.Router();

router.get("/formsOffice", async (req, res) => {
  try {
    const [forms] = await db.query(`
      SELECT f.*, b.withdraw
      FROM Form f
      LEFT JOIN Budget b ON f.form_id = b.form_id
    `);
    let confer = [];
    let pageC = [];
    let kris = [];

    if (forms.length > 0) {
      for (let i = 0; i < forms.length; i++) {
        if (forms[i].conf_id != null) {
          const [conferData] = await db.query(
            "SELECT user_id FROM Conference WHERE conf_id = ?",
            [forms[i].conf_id]
          );
          const [nameC] = await db.query(
            "SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?",
            [conferData[0].user_id]
          );
          newC = [];
          newC.push(forms[i].conf_id, nameC[0]);
          confer.push(newC);
        }

        if (forms[i].pageC_id != null) {
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

          newC = [];
          newC.push(forms[i].pageC_id, { ...nameP[0], ...fileAccepted[0] });
          pageC.push(newC);
        }

        if (forms[i].kris_id != null) {
          const [krisData] = await db.query(
            "SELECT user_id FROM Research_KRIS WHERE kris_id = ?",
            [forms[i].kris_id]
          );
          const [nameK] = await db.query(
            "SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?",
            [krisData[0].user_id]
          );

          newK = [];
          newK.push(forms[i].kris_id, nameK[0]);
          kris.push(newK);
        }
      }
    }
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

  try {
    const currentYear = new Date().getFullYear() + 543;
    fiscalYear = fiscalYear || currentYear;

    const STATUS_GROUPS = {
      waitingApproval: [
        "hr",
        "research",
        "finance",
        "pending",
        "associate",
        "dean",
        "attendMeeting",
        "waitingApproval",
      ],
    };

    const fiscalYearExpr = `
      CASE 
        WHEN b.budget_year IS NOT NULL THEN b.budget_year
        WHEN MONTH(COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date)) >= 10 
          THEN YEAR(COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date)) + 544
        ELSE 
          YEAR(COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date)) + 543
      END
    `;

    let sql = `
      SELECT f.form_id, f.form_type, f.conf_id, f.pageC_id, 
        f.kris_id, f.form_status, f.edit_data, f.date_form_edit, 
        f.return_note, f.editor, f.professor_reedit, 
        b.Research_kris_amount, b.amount_approval, f.return_to,
        COALESCE(k.user_id, c.user_id, p.user_id) AS user_id,
        COALESCE(k.name_research_th, c.conf_research, p.article_title) AS article_title,
        COALESCE(c.conf_name, p.journal_name) AS article_name,
        COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date) AS doc_submit_date,
        (${fiscalYearExpr}) AS effective_fiscal_year
      FROM Form f
        LEFT JOIN Research_KRIS k ON f.kris_id = k.kris_id
        LEFT JOIN Conference c ON f.conf_id = c.conf_id
        LEFT JOIN Page_Charge p ON f.pageC_id = p.pageC_id
        LEFT JOIN Budget b ON f.form_id = b.form_id
      WHERE COALESCE(k.user_id, c.user_id, p.user_id) = ?
        AND (${fiscalYearExpr}) = ?
    `;

    const params = [user_id, fiscalYear];

    // FILTER TYPE
    if (type && type !== "all") {
      sql += ` AND f.form_type = ?`;
      params.push(type);
    }

    // FILTER STATUS
    if (typeStatus && typeStatus !== "all") {
      let statusConditions = [];

      // 🔹 ถ้าเป็น GROUP
      if (STATUS_GROUPS[typeStatus]) {
        const groupStatuses = STATUS_GROUPS[typeStatus];
        const placeholders = groupStatuses.map(() => "?").join(",");
        statusConditions.push(`f.form_status IN (${placeholders})`);
        params.push(...groupStatuses);
      } 
      else {
        const statuses = typeStatus.split(",").map(s => s.trim());

        const isReturning = statuses.includes("return");
        const normalStatuses = statuses.filter(s => s !== "return");

        // สถานะปกติ
        if (normalStatuses.length > 0) {
          const placeholders = normalStatuses.map(() => "?").join(",");
          statusConditions.push(`f.form_status IN (${placeholders})`);
          params.push(...normalStatuses);
        }

        // สถานะ return
        if (isReturning) {
          const roleToMatch =
            normalStatuses[0] === "pending"
              ? "finance"
              : normalStatuses[0];

          statusConditions.push(
            `(f.form_status = 'return' AND f.return_to = ?)`
          );
          params.push(roleToMatch);
        }
      }

      if (statusConditions.length > 0) {
        sql += ` AND (${statusConditions.join(" OR ")})`;
      }
    }

    sql += ` ORDER BY f.form_id DESC`;

    const [forms] = await db.query(sql, params);

    return res.status(200).json(forms);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

router.get("/allForms", async (req, res) => {
  try {
    let { fiscalYear, type, typeStatus } = req.query;

    const currentYear = new Date().getFullYear() + 543;
    fiscalYear = fiscalYear || currentYear;

    const STATUS_GROUPS = {
      waitingApproval: [
        "hr",
        "research",
        "finance",
        "pending",
        "associate",
        "dean",
        "attendMeeting",
        "waitingApproval",
      ],
    };

    const fiscalYearExpr = `
      CASE 
        WHEN b.budget_year IS NOT NULL THEN b.budget_year
        WHEN MONTH(COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date)) >= 10 
          THEN YEAR(COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date)) + 544
        ELSE 
          YEAR(COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date)) + 543
      END
    `;

    let sql = `
      SELECT f.form_id, f.form_type, f.conf_id, f.pageC_id, 
      f.return_to, f.return_note, f.past_return, f.date_form_edit,
      f.kris_id, f.form_status,
      b.budget_year, b.amount_approval, b.Research_kris_amount,
      COALESCE(k.user_id, c.user_id, p.user_id) AS user_id,
      COALESCE(k.name_research_th, c.conf_research, p.article_title) AS article_title,
      COALESCE(c.conf_name, p.journal_name) AS article_name,
      COALESCE(c.doc_submit_date, p.doc_submit_date, k.doc_submit_date) AS doc_submit_date,
      u.user_nameth,
      (${fiscalYearExpr}) AS effective_fiscal_year
      FROM Form f
      LEFT JOIN Research_KRIS k ON f.kris_id = k.kris_id
      LEFT JOIN Conference c ON f.conf_id = c.conf_id
      LEFT JOIN Page_Charge p ON f.pageC_id = p.pageC_id
      LEFT JOIN Users u ON u.user_id = COALESCE(k.user_id, c.user_id, p.user_id)
      LEFT JOIN Budget b ON f.form_id = b.form_id
      WHERE (${fiscalYearExpr}) = ?
    `;

    const params = [fiscalYear];

    // FILTER TYPE
    if (type && type !== "all") {
      sql += ` AND f.form_type = ?`;
      params.push(type);
    }

    // FILTER STATUS
    if (typeStatus && typeStatus !== "all") {
      let statusConditions = [];

      // ถ้าเป็น group
      if (STATUS_GROUPS[typeStatus]) {
        const groupStatuses = STATUS_GROUPS[typeStatus];
        const placeholders = groupStatuses.map(() => "?").join(",");
        statusConditions.push(`f.form_status IN (${placeholders})`);
        params.push(...groupStatuses);
      } 
      else {
        const statuses = typeStatus.split(",").map(s => s.trim());

        const isReturning = statuses.includes("return");
        const normalStatuses = statuses.filter(s => s !== "return");

        // สถานะปกติ
        if (normalStatuses.length > 0) {
          const placeholders = normalStatuses.map(() => "?").join(",");
          statusConditions.push(`f.form_status IN (${placeholders})`);
          params.push(...normalStatuses);
        }

        // สถานะ return
        if (isReturning) {
          const roleToMatch =
            normalStatuses[0] === "pending"
              ? "finance"
              : normalStatuses[0];

          statusConditions.push(
            `(f.form_status = 'return' AND f.return_to = ?)`
          );
          params.push(roleToMatch);
        }
      }

      if (statusConditions.length > 0) {
        sql += ` AND (${statusConditions.join(" OR ")})`;
      }
    }

    sql += ` ORDER BY f.form_id DESC`;

    const [forms] = await db.query(sql, params);

    return res.status(200).json(forms);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});


router.get("/formPageCharge/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [form] = await db.query("SELECT * FROM Form WHERE pageC_id = ?", [
      id,
    ]);
    res.status(200).json(form[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/formConference/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [form] = await db.query("SELECT * FROM Form WHERE conf_id = ?", [id]);
    res.status(200).json(form[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/form/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
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
    res.status(200).json({ message: "form updated successfully!", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/editForm/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const editDataJson = JSON.stringify(req.body.edit_data);
  try {
    const [updateOfficeEditForm] = await db.query(
      `UPDATE Form SET edit_data = ? WHERE conf_id = ?`,
      [editDataJson, id]
    );
    res
      .status(200)
      .json({ success: true, message: "Success", data: updateOfficeEditForm });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// test many id
router.put("/confirmEditedForm/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
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
    }
    res.status(200).json({ success: true, message: "Success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/updatestatus_confer/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const returnTo = data.return_to ?? data.return ?? null;
  
  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction
  try {
    const [updateStatus] = await database.query(
      `UPDATE Form SET form_status = ?, return_to = ?, return_note = ? WHERE conf_id = ?`,
      [data.form_status, returnTo, data.description, id]
    );

    const [getID] = await database.query(
      "SELECT form_id FROM Form WHERE conf_id = ?",
      [id]
    );

    if (!getID.length) {
      throw new Error(`Form not found for conf_id ${id}`);
    }

    const formId = getID[0].form_id;
    const recipientEmail = await getRecipientEmail(
      database,
      { ...data, return_to: returnTo },
      formId
    );
    const recipients = recipientEmail ? [recipientEmail] : [];
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีการตีกลับแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุม";
    const message = `
      มีการส่งแบบฟอร์มขอรับการสนับสนุนจาก "{getuser[0][0].user_nameth}" งานวิจัย: "{conferenceData.conf_name}" กำลังรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    // await sendEmail(recipients, subject, message);
      await database.commit(); //commit transaction
    res.status(200).json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error("Error updating status:", err);
  }
});

router.put("/updatestatus_pageC/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const returnTo = data.return_to ?? data.return ?? null;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    const [updateStatus] = await database.query(
      `UPDATE Form SET form_status = ?, return_to = ?, return_note = ? WHERE pageC_id = ?`,
      [data.form_status, returnTo, data.description, id]
    );

    const [getID] = await database.query(
      "SELECT form_id FROM Form WHERE pageC_id = ?",
      [id]
    );

    if (!getID.length) {
      throw new Error(`Form not found for pageC_id ${id}`);
    }

    const formId = getID[0].form_id;
    const recipientEmail = await getRecipientEmail(
      database,
      { ...data, return_to: returnTo },
      formId
    );
    const recipients = recipientEmail ? [recipientEmail] : [];
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีการตีกลับแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุม";
    const message = `
      มีการส่งแบบฟอร์มขอรับการสนับสนุนจาก "{getuser[0][0].user_nameth}" งานวิจัย: "{conferenceData.conf_name}" กำลังรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    // await sendEmail(recipients, subject, message);
      await database.commit(); //commit transaction
    res.status(200).json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error("Error updating status:", err);
  }
});
exports.router = router;
