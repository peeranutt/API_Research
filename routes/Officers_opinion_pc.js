const express = require("express");
const db = require("../config.js");
const sendEmail = require("../middleware/mailer.js");

router = express.Router();

//create first opinion and update form
router.post("/opinionPC", async (req, res) => {
  const data = req.body;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction
  console.log("data from frontend: ", data);

  try {
    //insert research opinion
    const [createOpi_result] = await database.query(
      `INSERT INTO officers_opinion_pc
          (research_id, associate_id, dean_id, pageC_id, p_research_result, p_research_reason, p_associate_result,
           p_dean_acknowledge, p_dean_result, research_doc_submit_date,
          associate_doc_submit_date, dean_doc_submit_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.research_id || null,
        data.associate_id || null,
        data.dean_id || null,
        data.pageC_id,
        data.p_research_result || null,
        data.p_research_reason || null,
        data.p_associate_result || null,
        data.p_dean_acknowledge || null,
        data.p_dean_result || null,
        data.research_doc_submit_date || null,
        data.associate_doc_submit_date || null,
        data.dean_doc_submit_date || null,
      ]
    );

    console.log("create Opinion :", createOpi_result);

    //update status from
    const [updateForm_result] = await database.query(
      "UPDATE Form SET form_status = ?, return_note = ?, return_to = ?, past_return = ? WHERE pageC_id = ?",
      [data.form_status, data.return_note, data.returnto, data.past_return, data.pageC_id]
    );

    //get pageC_id
    const [getID] = await database.query(
      "SELECT form_id FROM Form WHERE pageC_id = ?",
      [data.pageC_id]
    );
    console.log("GetID : ", getID);

    await database.commit(); //commit transaction

    //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีแบบฟอร์มขอรับการสนับสนุนการตีพิมพ์ในวารสารรอการอนุมัติและตรวจสอบ";
    const message = `
      มีแบบฟอร์มขอรับการสนับสนุนการตีพิมพ์ในวารสารรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
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
router.put("/opinionPC/:id", async (req, res) => {
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

    const sql = `UPDATE officers_opinion_pc SET ${fields.join(', ')} WHERE pageC_id = ?`;
    values.push(id);
    await database.query(sql, values);

    //update status form
    const [updateForm_result] = await database.query(
      "UPDATE Form SET form_status = ?, return_to = ?, return_note = ?, past_return = ? WHERE pageC_id = ?",
      [data.form_status, data.return_to, data.return_note, data.past_return, id]
    );

    //get pageC_id
    const [getID] = await database.query(
      "SELECT form_id FROM Form WHERE pageC_id = ?",
      [id]
    );
    console.log("GetID : ", getID);

    await database.commit(); //commit transaction

    //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีแบบฟอร์มขอรับการสนับสนุนการตีพิมพ์ในวารสารรอการอนุมัติและตรวจสอบ";
    const message = `
      มีแบบฟอร์มขอรับการสนับสนุนการตีพิมพ์ในวารสารรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
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

router.get("/allOpinionPC", async (req, res) => {
  try {
    const [allopinionPC] = await db.query("SELECT * FROM officers_opinion_pc");
    res.status(200).json(allopinionPC);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/opinionPC/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [opinionPC] = await db.query(
      "SELECT * FROM officers_opinion_pc WHERE pageC_id = ?",
      [id]
    );
    if (opinionPC.length === 0) {
      return res.status(404).json({ message: "opinionPC not found" });
    }
    console.log("Get opinionPC: ", opinionPC[0]);
    res.status(200).json(opinionPC[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;
