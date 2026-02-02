const express = require("express");
const db = require("../config.js");
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

    //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
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

  const fields = [];
  const values = [];

  data.updated_data.forEach((item) => {
    fields.push(`${item.field} = ?`);
    values.push(
      Array.isArray(item.value) ? JSON.stringify(item.value) : item.value
    );
  });

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    const sql = `UPDATE officers_opinion_conf SET ${fields.join(", ")} WHERE conf_id = ?`;
    values.push(id);
    await database.query(sql, values);

    //update status form
    console.log("id", data.conf_id)
    console.log("data.form_status", data.form_status)
    const [updateForm_result] = await database.query(
      "UPDATE Form SET form_status = ?, return_to = ?, return_note = ?, past_return = ? WHERE conf_id = ?",
      [data.form_status, data.return_to, data.return_note, data.past_return, data.conf_id]
    );
    //get form_id
    const [getID] = await database.query(
      "SELECT form_id FROM Form WHERE conf_id = ?",
      [id]
    );
    console.log("GetID : ", getID);

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

    //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
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
