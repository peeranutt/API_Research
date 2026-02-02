const express = require("express");
const db = require("../config.js");

const router = express.Router();

router.get("/all_notification", async (req, res) => {
  try {
    const [Notification] = await db.query("SELECT * FROM Notification");
    res.status(200).json(Notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/notification", async (req, res) => {
  try {
    const [mynotification] = await db.query(
      `
        SELECT n.noti_id, n.user_id, n.form_id, n.name_form, n.date_update, f.form_type, f.form_status, f.edit_data, u.user_nameth
        FROM notification n
        LEFT JOIN Form f ON n.form_id = f.form_id
        LEFT JOIN Users u ON n.user_id = u.user_id
        WHERE n.date_update >= DATE_SUB(NOW(), INTERVAL 3 DAY)
        ORDER BY n.date_update DESC;`
    );

    res.status(200).json(mynotification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/notification/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [mynotification] = await db.query(
      `
        SELECT n.noti_id, n.user_id, n.form_id, n.name_form, n.date_update, f.form_type, f.form_status, u.user_nameth
        FROM notification n
        LEFT JOIN Form f ON n.form_id = f.form_id
        LEFT JOIN Users u ON n.user_id = u.user_id
        WHERE n.user_id = ?
        AND n.date_update >= DATE_SUB(NOW(), INTERVAL 3 DAY)
        ORDER BY n.date_update DESC;`,

      [id]
    );

    res.status(200).json(mynotification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/status_notification/:status", async (req, res) => {
  const { status } = req.params; //ฝ่ายบริหารงานวิจัย, ฝ่ายวิจัย, ฝ่ายวิชาการ, ฝ่ายบริหาร

  console.log("status ", status);

  try {
    const [mynotification] = await db.query(
      `
        SELECT n.noti_id, n.user_id, n.form_id, n.name_form, n.date_update, f.form_type, f.form_status, u.user_nameth
        FROM notification n
        LEFT JOIN Form f ON n.form_id = f.form_id
        LEFT JOIN Users u ON n.user_id = u.user_id
        WHERE f.form_status = ?
        AND n.date_update >= DATE_SUB(NOW(), INTERVAL 3 DAY)
        ORDER BY n.date_update DESC;`,
      [status]
    );

    res.status(200).json(mynotification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update is_read Professors
// router.put("/notifications/update_read", async (req, res) => {
//   try {
//     const { notiIds } = req.body;
//     console.log("notiIds ", notiIds);

//     if (!notiIds || notiIds.length === 0) {
//       return res
//         .status(400)
//         .json({ error: "ไม่มี Notification ที่ต้องอัปเดต" });
//     }

//     // อัปเดตสถานะ `is_read = 1` ในฐานข้อมูล
//     const [result] = await db.query(
//       `UPDATE notification SET is_read = 1 WHERE noti_id IN (?)`,
//       [notiIds]
//     );

//     res.json({ message: `อัปเดตสำเร็จ ${result.affectedRows} รายการ` });
//   } catch (error) {
//     console.error("Error updating notifications:", error);
//     res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดต" });
//   }
// });
exports.router = router;
