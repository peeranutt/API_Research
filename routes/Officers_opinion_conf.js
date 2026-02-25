const express = require("express");
const db = require("../config/db");
const sendEmail = require("../middleware/mailer.js");

router = express.Router();

//create first opinion and update form
router.post("/opinionConf", async (req, res) => {
  const data = req.body;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    //insert hr opinion
    const [createOpi_result] = await database.query(
      `INSERT INTO officers_opinion_conf
          (hr_id, research_id, associate_id, dean_id, conf_id,
          c_hr_result, c_hr_reason, c_hr_note, c_quality, c_comment_quality, c_comment_quality_good, 
          c_research_result, c_research_reason, c_associate_result, c_dean_result,
          research_doc_submit_date, associate_doc_submit_date, dean_doc_submit_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.hr_id || null,
        data.research_id || null,
        data.associate_id || null,
        data.dean_id || null,
        data.conf_id,
        data.c_hr_result,
        data.c_hr_reason,
        data.c_hr_note || null,
        data.c_quality || null,
        data.c_comment_quality || null,
        data.c_comment_quality_good,
        data.c_research_result || null,
        data.c_research_reason || null,
        data.c_associate_result || null,
        data.c_dean_result || null,
        data.research_doc_submit_date || null,
        data.associate_doc_submit_date || null,
        data.dean_doc_submit_date || null,
      ]
    );
    console.log("createOpi_result :", createOpi_result);

    //update status form
    const [updateForm_result] = await database.query(
      "UPDATE Form SET form_status = ?, return_to = ?, return_note = ?, past_return = ? WHERE conf_id = ?",
      [data.form_status, data.return_to, data.return_note, data.past_return, data.conf_id]
    );

    //get form_id
    const [getID] = await database.query(
      "SELECT form_id FROM Form WHERE conf_id = ?",
      [data.conf_id]
    );
    console.log("GetID : ", getID);

    console.log("data.user_confer :", data.user_confer);

    if (data.user_confer == 1) {
      const [rows] = await database.query(
        "SELECT user_id FROM Conference WHERE conf_id = ?",
        [data.conf_id]
      );

      if (rows.length > 0) {
        const userId = rows[0].user_id;

        await database.query(
          "UPDATE Users SET user_confer = ? WHERE user_id = ?",
          [data.user_confer, userId]
        );

        console.log("add user_confer succ");
      } else {
        console.log("No user_id found for conf_id:", data.conf_id);
      }
    }

    await database.commit(); //commit transaction

    const formId = getID[0].form_id;
console.log("formId : ", formId);
    let getEmail;

    if (data.form_status != "return") {
      console.log("111 officer next step");
      [getEmail] = await database.query(
        `SELECT u.user_email 
        FROM Form f
        JOIN Users u ON f.form_status = u.user_role
        WHERE form_id = ?`,
        [formId]
      );
    } else if (data.return_to == "professor") {
      console.log("222 return to professor");
      [getEmail] = await database.query(
        `SELECT u.user_email 
        FROM Conference c 
        JOIN Users u ON c.user_id = u.user_id
        WHERE conf_id = ?`,
        [data.conf_id]
      );
    } else {
      console.log("333 return to officer");
      [getEmail] = await database.query(
        `SELECT u.user_email 
        FROM Form f
        JOIN Users u ON f.return_to = u.user_role
        WHERE form_id = ?`,
        [formId]
      );
    }

    console.log("getEmail : ", getEmail, getEmail[0].user_email);
    const recipients = [getEmail[0].user_email]; //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุมรอการอนุมัติและตรวจสอบ";
    const message = `
      มีแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุมรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    await sendEmail(recipients, subject, message);

    console.log("Email sent successfully");
    res.status(200).json({ success: true, message: "Success" });
  } catch (error) {
    database.rollback(); //rollback transaction
    console.error("Error inserting into database:", error);
    res.status(500).json({ error: error.message });
  } finally {
    database.release(); //release connection
  }
});

//update: add opinion of other role
router.put("/opinionConf/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // =========================
    // 1️⃣ UPDATE officers_opinion_conf
    // =========================
    if (data.updated_data && data.updated_data.length > 0) {
      const fields = [];
      const values = [];

      data.updated_data.forEach((item) => {
        fields.push(`${item.field} = ?`);
        values.push(
          Array.isArray(item.value)
            ? JSON.stringify(item.value)
            : item.value
        );
      });

      const sql = `
        UPDATE officers_opinion_conf 
        SET ${fields.join(", ")} 
        WHERE conf_id = ?
      `;

      values.push(id);

      await connection.query(sql, values);
    }

    // =========================
    // 2️⃣ UPDATE FORM
    // =========================
    await connection.query(
      `UPDATE Form 
       SET form_status = ?, 
           return_to = ?, 
           return_note = ?, 
           past_return = ?
       WHERE conf_id = ?`,
      [
        data.form_status,
        data.return_to,
        data.return_note,
        data.past_return,
        id,
      ]
    );

    // =========================
    // 3️⃣ GET FORM ID
    // =========================
    const [formRows] = await connection.query(
      `SELECT form_id 
       FROM Form 
       WHERE conf_id = ?`,
      [id]
    );

    if (!formRows.length) {
      throw new Error("Form not found");
    }

    const formId = formRows[0].form_id;

    // =========================
    // 4️⃣ UPDATE user_confer (ถ้ามี)
    // =========================
    if (data.user_confer == 1) {
      const [confRows] = await connection.query(
        `SELECT user_id 
         FROM Conference 
         WHERE conf_id = ?`,
        [id]
      );

      if (confRows.length) {
        await connection.query(
          `UPDATE Users 
           SET user_confer = ? 
           WHERE user_id = ?`,
          [1, confRows[0].user_id]
        );
      }
    }

    // =========================
    // 5️⃣ GET EMAIL (ก่อน commit)
    // =========================
    let emailRows = [];

    if (data.form_status !== "return") {

      const [rows] = await connection.query(
        `SELECT u.user_email
         FROM Form f
         JOIN Users u ON f.form_status = u.user_role
         WHERE f.form_id = ?`,
        [formId]
      );

      emailRows = rows;

    } else if (data.return_to === "professor") {

      const [rows] = await connection.query(
        `SELECT u.user_email
         FROM Conference c
         JOIN Users u ON c.user_id = u.user_id
         WHERE c.conf_id = ?`,
        [id]
      );

      emailRows = rows;

    } else {

      const [rows] = await connection.query(
        `SELECT u.user_email
         FROM Form f
         JOIN Users u ON f.return_to = u.user_role
         WHERE f.form_id = ?`,
        [formId]
      );

      emailRows = rows;
    }

    if (!emailRows.length) {
      throw new Error("No email found");
    }

    const recipient = emailRows[0].user_email;

    // =========================
    // 6️⃣ COMMIT
    // =========================
    await connection.commit();

    // =========================
    // 7️⃣ SEND EMAIL
    // =========================
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุมรอการตรวจสอบ";

    const message = `
มีแบบฟอร์มรอการดำเนินการ
กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ

กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติ
`;

    await sendEmail([recipient], subject, message);

    console.log("Email sent to:", recipient);

    res.status(200).json({
      success: true,
      message: "Update completed",
    });

  } catch (error) {
    await connection.rollback();
    console.error("Transaction rolled back:", error);
    res.status(500).json({ error: error.message });

  } finally {
    connection.release();
  }
});

router.get("/allOpinionConf", async (req, res) => {
  try {
    const [allopinionConf] = await db.query(
      "SELECT * FROM officers_opinion_conf"
    );
    res.status(200).json(allopinionConf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/opinionConf/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [opinionConf] = await db.query(
      `SELECT ooc.hr_id, ooc.research_id, ooc.associate_id, ooc.dean_id, 
      ooc.c_office_id, ooc.conf_id, ooc.c_hr_result, ooc.c_hr_reason, ooc.c_hr_note,
      ooc.c_quality, ooc.c_comment_quality, ooc.c_comment_quality_good,
      ooc.c_research_result,ooc.c_research_reason, ooc.c_associate_result,
      ooc.c_dean_result, ooc.hr_doc_submit_date,
      ooc.research_doc_submit_date, ooc.associate_doc_submit_date,
      ooc.dean_doc_submit_date, u.user_confer
      FROM officers_opinion_conf ooc
      LEFT JOIN Conference c ON ooc.conf_id = c.conf_id
      LEFT JOIN Users u ON c.user_id = u.user_id
      WHERE ooc.conf_id = ?
      `,
      [id]
    );
    console.log("opinionConf", opinionConf[0]);

    console.log("Get opinionConf: ", opinionConf[0]);
    res.status(200).json(opinionConf[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;
