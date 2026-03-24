const express = require("express");
const db = require("../config/db");
const sendEmail = require("../middleware/mailer.js");

router = express.Router();

//create first opinion and update form
router.post("/opinionKris", async (req, res) => {
  const data = req.body;
  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    //insert research opinion
    const [createOpi_result] = await database.query(
      `INSERT INTO officers_opinion_kris
          (user_id, kris_id, research_admin)
          VALUES (?, ?, ?)`,
      [data.user_id, data.kris_id, data.research_admin]
    );

    //update status form
    const [updateForm_result] = await database.query(
      "UPDATE Form SET form_status = ? WHERE kris_id = ?",
      [data.form_status, data.kris_id]
    );

    //get kris_id
    const [getID] = await database.query(
      "SELECT form_id FROM Form WHERE kris_id = ?",
      [data.kris_id]
    );

    const [getUser] = await database.query(
      `SELECT user_email FROM Users WHERE user_id = ?`,
      [data.user_id]
    )

    //send email to user
    const recipients = [getUser[0].user_email];  //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีแบบฟอร์มงานวิจัยรอการอนุมัติและตรวจสอบ";
    const message = `
      มีแบบฟอร์มงานวิจัยรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    // await sendEmail(recipients, subject, message);
    await database.commit(); //commit transaction

    res.status(200).json({ success: true, message: "Success" });
  } catch (error) {
    database.rollback(); //rollback transaction
    console.error("Error inserting into database:", error);
    res.status(500).json({ error: error.message });
  } finally {
    database.release(); //release connection
  }
});

router.get("/opinionkris/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [opinionkris] = await db.query(
      "SELECT * FROM officers_opinion_kris WHERE kris_id = ?",
      [id]
    );


    if (opinionkris.length === 0) {
      return res.status(404).json({ message: "opinionkris not found" });
    }
    res.status(200).json(opinionkris[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;
