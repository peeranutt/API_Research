const express = require("express");
const db = require("../config.js");
const sendEmail = require("../middleware/mailer.js");

router = express.Router();

router.post("/budget", async (req, res) => {
  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  const data = req.body;

  try {
    if (data.form_status != "pending") {
      console.log("data in budget:", data);
      const [Budget_result] = await database.query(
        `INSERT INTO Budget ( user_id, form_id, budget_year, Page_Charge_amount, Conference_amount,
        num_expenses_approved, total_amount_approved, remaining_credit_limit, amount_approval, total_remaining_credit_limit, doc_submit_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          data.user_id,
          data.form_id,
          data.budget_year,
          data.Page_Charge_amount || null,
          data.Conference_amount || null,
          data.num_expenses_approved,
          data.total_amount_approved,
          data.remaining_credit_limit,
          data.amount_approval,
          data.total_remaining_credit_limit,
        ]
      );
      console.log("Budget_result : ", Budget_result);

      const [updateForm_result] = await database.query(
        `UPDATE Form SET form_status = ?, return_to = ?, return_note = ?, past_return = ? WHERE form_id = ?`,
        [
          data.form_status,
          data.returnto,
          data.return_note,
          data.past_return,
          data.form_id,
        ]
      );
      console.log("updateForm_result : ", updateForm_result);

      const [formType] = await database.query(
        `SELECT conf_id, pageC_id FROM Form WHERE form_id = ?`,
        [data.form_id]
      );
      console.log("formType : ", formType);

      await database.commit(); //commit transaction

      //send email to user
      const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
      const subject =
        "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีแบบฟอร์มรอการอนุมัติและตรวจสอบ";
      const message = `
      โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

      await sendEmail(recipients, subject, message);

      console.log("Email sent successfully");
      res
        .status(201)
        .json({
          message: "Budget created successfully!",
          id: Budget_result.insertId,
        });
    } else {
      const [UpdateForm_result] = await database.query(
        `UPDATE Form SET form_status = ?, comment_pending = ? WHERE form_id = ?`,
        [data.form_status, data.comment_pending, data.form_id]
      );

      await database.commit(); //commit transaction

      res.status(201).json({ message: "Budget Pending!" });
    }
  } catch (error) {
    database.rollback(); //rollback transaction
    console.error("Error inserting into database:", error);
    res.status(500).json({ error: error.message });
  } finally {
    database.release(); //release connection
  }
});

router.put("/withdraw/conference/:id", async (req, res) => {
  console.log("withdraw in conference id:", req.params);
  const { id } = req.params;
  const updates = req.body;
  try {
    console.log("in conf_id");
    const [findID] = await db.query(
      `SELECT form_id FROM Form  WHERE conf_id = ?`,
      [id]
    );
    console.log("findID", findID[0].form_id);
    const [updateWithdrawMoney] = await db.query(
      `UPDATE Budget SET travelExpenses = ?, allowance = ?, withdraw = ? WHERE form_id = ?`,
      [
        updates.travelExpenses,
        updates.allowance,
        updates.withdraw,
        findID[0].form_id,
      ]
    );
    console.log("updateresult :", updateWithdrawMoney);

    //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีการตั้งเบิกแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุมเรียบร้อย";
    const message = `
       โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    await sendEmail(recipients, subject, message);
    res
      .status(200)
      .json({ success: true, message: "Success", data: updateWithdrawMoney });
  } catch (err) {
    console.error("SQL error →", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/updateBudget/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    if (data.form_status != "pending") {
      const [updateBudget_result] = await database.query(
        `UPDATE Budget SET user_id = ?, form_id = ?, budget_year = ?, Page_Charge_amount = ?, Conference_amount = ?,
        num_expenses_approved = ?, total_amount_approved = ?, remaining_credit_limit = ?, amount_approval = ?, total_remaining_credit_limit = ?
        WHERE form_id = ?`,
        [
          data.user_id,
          data.form_id,
          data.budget_year,
          data.Page_Charge_amount || null,
          data.Conference_amount || null,
          data.num_expenses_approved,
          data.total_amount_approved,
          data.remaining_credit_limit,
          data.amount_approval,
          data.total_remaining_credit_limit,
          id,
        ]
      );
      console.log("updateBudget_result : ", updateBudget_result);

      const [updateForm_result] = await database.query(
        `UPDATE Form SET form_status = ?, return_to = ?, return_note = ?, past_return = ? WHERE form_id = ?`,
        [
          data.form_status,
          data.returnto,
          data.return_note,
          data.past_return,
          data.form_id,
        ]
      );
      console.log("updateForm_result : ", updateForm_result);

      const [formType] = await database.query(
        `SELECT conf_id, pageC_id FROM Form WHERE form_id = ?`,
        [data.form_id]
      );
      console.log("formType : ", formType);

      await database.commit(); //commit transaction

      //send email to user
      const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
      const subject =
        "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีแบบฟอร์มรอการอนุมัติและตรวจสอบ";
      const message = `
      โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

      await sendEmail(recipients, subject, message);

      console.log("Email sent successfully");
      res
        .status(201)
        .json({
          message: "Budget created successfully!",
          id: updateBudget_result.insertId,
        });
    } else {
      const [UpdateForm_result] = await database.query(
        `UPDATE Form SET form_status = ?, comment_pending = ? WHERE form_id = ?`,
        [data.form_status, data.comment_pending, data.form_id]
      );

      await database.commit(); //commit transaction

      res.status(201).json({ message: "Budget Pending!" });
    }
  } catch (error) {
    database.rollback(); //rollback transaction
    console.error("Error inserting into database:", error);
    res.status(500).json({ error: error.message });
  } finally {
    database.release(); //release connection
  }
});

router.put("/withdraw/pageCharge/:id", async (req, res) => {
  console.log("withdraw in pageCharge id:", req.params);
  const { id } = req.params;
  const updates = req.body;
  try {
    console.log("in pageC_id");
    const [findID] = await db.query(
      `SELECT form_id FROM Form  WHERE pageC_id = ?`,
      [id]
    );
    console.log("findID", findID[0].form_id);
    const [updateWithdrawMoney] = await db.query(
      `UPDATE Budget SET withdraw = ? WHERE form_id = ?`,
      [updates.withdraw, findID[0].form_id]
    );
    console.log("updateresult :", updateWithdrawMoney);
    //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีการตั้งเบิกแบบฟอร์มขอรับการสนับสนุนการตีพิมพ์ในวารสารเรียบร้อย";
    const message = `
       โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    await sendEmail(recipients, subject, message);
    res
      .status(200)
      .json({ success: true, message: "Success", data: updateWithdrawMoney });
  } catch (err) {
    console.error("SQL error →", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/sumBudgets/:id", async (req, res) => {
  const { id } = req.params;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    let sumPC = [];
    let sumConfer = [];

    const [conf] = await database.query(
      `SELECT conf_id FROM Conference WHERE user_id = ?`,
      [id]
    );
    const [pc] = await database.query(
      `SELECT pageC_id FROM Page_Charge WHERE user_id = ?`,
      [id]
    );
    const [form] = await database.query(`SELECT * FROM Form`);

    for (let i = 0; i < form.length; i++) {
      const matchedConf = conf.find((c) => c.conf_id === form[i].conf_id);
      if (matchedConf && form[i].form_status === "approve") {
        let [budgets] = await database.query(
          `SELECT withdraw FROM Budget WHERE form_id = ?`,
          [form[i].form_id]
        );

        budgets.forEach((budget) => {
          const moneyConfer =
            matchedConf.quality_meeting === "good"
              ? parseFloat(budget.withdraw) -
                parseFloat(matchedConf.total_amount)
              : parseFloat(budget.withdraw);

          sumConfer.push({
            form_id: form[i].form_id,
            tpye: form[i].form_type,
            money: moneyConfer,
          });
        });
      }
      const matchedPC = pc.find((p) => p.pageC_id === form[i].pageC_id);

      if (matchedPC && form[i].form_status === "approve") {
        let [budgets] = await database.query(
          `SELECT withdraw FROM Budget WHERE form_id = ?`,
          [form[i].form_id]
        );

        budgets.forEach((budget) => {
          const moneyPC = parseFloat(budget.withdraw);
          sumPC.push({
            form_id: form[i].form_id,
            tpye: form[i].form_type,
            money: moneyPC,
          });
        });
      }
    }
    const totalPC = sumPC.reduce((acc, item) => acc + item.money, 0);
    const totalConfer = sumConfer.reduce((acc, item) => acc + item.money, 0);
    const totalMoney = totalPC + totalConfer;

    await database.commit(); //commit transaction
    res
      .status(200)
      .json({
        sumPC: sumPC,
        sumConfer: sumConfer,
        totalPC: totalPC,
        totalConfer: totalConfer,
        totalMoney: totalMoney,
      });
  } catch (error) {
    database.rollback(); //rollback transaction
    console.error("Error inserting into database:", error);
    res.status(500).json({ error: error.message });
  } finally {
    database.release(); //release connection
  }
});

router.get("/budgetsPC", async (req, res) => {
  try {
    const [budgets] = await db.query(
      `SELECT 
      COUNT(b.budget_id) AS total_budgets,
      COUNT(CASE 
        WHEN f.form_type = 'Page_Charge' 
        THEN 1 
    END) AS numapproved,

      SUM(CASE 
        WHEN f.form_type = 'Page_Charge'
        AND f.form_status IN ('associate', 'dean', 'waitingApproval', 'approval')
        THEN b.amount_approval
    END) AS totalapproved
      FROM Budget b
      JOIN Form f ON f.form_id = b.form_id
      `
    );
    console.log("budgets PC", budgets);
    res.status(200).json(budgets[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/budgetsConfer", async (req, res) => {
  try {
    const [budgets] = await db.query(
      `SELECT 
    COUNT(b.budget_id) AS total_budgets, 
    COUNT(CASE WHEN f.form_type = 'Conference' THEN 1 END) AS numapproved,
    SUM(CASE WHEN f.form_type = 'Conference' 
             AND f.form_status IN ('associate', 'dean', 'waitingApproval', 'approval') 
             THEN b.amount_approval 
        END) AS totalapproved
    FROM Budget b
    JOIN Form f ON b.form_id = f.form_id;
      `
    );
    console.log("budgets CONFER", budgets);
    res.status(200).json(budgets[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/budget/pageCharge/:id", async (req, res) => {
  console.log("in budget/pageCharge/id");


  const { id } = req.params;
  console.log("budget/pageCharge/id", id);
  try {
    const [find_id] = await db.query(
      "SELECT form_id FROM Form WHERE pageC_id = ?",
      [id]
    );
    console.log("Get find_id budget pc: ", find_id[0]);
    const [pageC] = await db.query("SELECT * FROM Budget WHERE form_id = ?", [
      find_id[0].form_id,
    ]);
    console.log("Query result:", pageC);

    // if (pageC.length === 0) {
    //   return res.status(404).json({ message: "pageC_id not found" });
    // }
    res.status(200).json(pageC[0]);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/budget/conference/:id", async (req, res) => {
  const { id } = req.params;
  console.log("budget/conference/id", id);
  try {
    const [find_id] = await db.query(
      "SELECT form_id FROM Form WHERE conf_id = ?",
      [id]
    );
    console.log("Get find_id budget: ", find_id[0].form_id);
    const [conf] = await db.query("SELECT * FROM Budget WHERE form_id = ?", [
      find_id[0].form_id,
    ]);
    console.log("Get conf kub: ", conf[0]);
    res.status(200).json(conf[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/budget/kris/:id", async (req, res) => {
  const { id } = req.params;
  console.log("budget/kris/id", id)
  try {
    const [find_id] = await db.query(
      "SELECT form_id FROM Form WHERE kris_id = ?",
      [id]
    );
    console.log("Get find_id budget: ", find_id[0]);
    const [conf] = await db.query(
      "SELECT * FROM Budget WHERE form_id = ?",
      [find_id[0].form_id]
    );
    console.log("Get conf kub: ", conf[0]);
    res.status(200).json(conf[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;
