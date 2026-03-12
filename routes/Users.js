const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const baseURL = require("dotenv").config();

const { DateTime } = require("luxon");

const db = require("../config/db");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, DateTime.now() + path.extname(file.originalname));
  },
});

const fileFilter = function (req, file, cb) {
  if (file.mimetype == "image/png") {
    cb(null, true);
  } else {
    req.errorMessage = "นามสกุลของไฟล์ไม่ใช่ png";
    cb(null, false);
  }
};

const upload = multer({ storage, fileFilter });

router.put(
  "/uploadSignature",
  upload.single("user_signature"),
  async (req, res) => {
    if (req.errorMessage) {
      return res.status(422).json({ message: req.errorMessage });
    }

    const { user_id } = req.body;
    const signatureFile = req.file;

    const check = await db.query(
      "SELECT user_signature FROM Users WHERE user_id = ?",
      [user_id]
    );


    if (check[0].user_signature == "" || check[0].user_signature == null) {
      try {
        await db.query(
          "UPDATE Users SET user_signature = ? WHERE user_id = ?",
          [signatureFile.filename, user_id]
        );

        return res.status(200).json({ message: "Upload Success" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    } else {
      res.status(400).json({ message: "has signature" });
    }
  }
);

router.get("/mySignature", async (req, res) => {
  const { user_id } = req.query;


  const signature = await db.query(
    "SELECT user_signature FROM Users WHERE user_id = ?",
    [user_id]
  );

  const url = baseURL.parsed.VITE_API_BASE_URL;
  const fileUrl = signature[0][0].user_signature;

  res.status(200).json({ message: "Get File successfully", fileUrl });
});

router.post("/user", async (req, res) => {
  const data = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Users (
      user_role, user_nameth, user_nameeng, user_email, user_moneyCF, user_positionth, 
      user_positioneng, user_startwork, user_year,user_confer
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_role,
        data.user_nameth,
        data.user_nameeng,
        data.user_email,
        data.user_moneyCF || null,
        data.user_positionth || null,
        data.user_positioneng || null,
        data.user_startwork,
        data.user_year,
        0,
      ]
    );
    res
      .status(201)
      .json({ message: "user created successfully!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM Users");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [user] = await db.query("SELECT * FROM Users WHERE user_id = ?", [
      id,
    ]);
    if (user.length === 0) {
      return res.status(404).json({ message: "userID not found" });
    }
    res.status(200).json(user[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//ขอแก้ทีหลัง
router.put("/updateRoles", async (req, res) => {
  const { userUpdates } = req.body;


  if (!Array.isArray(userUpdates) || userUpdates.length === 0) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    const queries = userUpdates.map(({ id, value }) => {
      const isMoney = !isNaN(value) && String(value).trim() !== "";
      const field = isMoney ? "user_moneyCF" : "user_role";

      return new Promise((resolve, reject) => {
        db.query(
          `UPDATE Users SET ${field} = ? WHERE user_id = ?`,
          [value, id],
          (err, result) => {
            if (err) {
              console.error(`❌ DB Update Error for user_id ${id}:`, err);
              reject(err);
            } else if (result.affectedRows === 0) {
              console.warn(`⚠️ No rows updated for user_id ${id}`);
              resolve(result); // หรือ reject ขึ้นอยู่กับความต้องการ
            } else {
              resolve(result);
            }
          }
        );
      });
    });
    res
      .status(200)
      .json({ success: true, message: "User data updated successfully" });
  } catch (err) {
    console.error("❌ Error updating roles:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/userSignat/:id", (req, res) => {
  const id = req.params.id;
  db.query(
    "UPDATE Users SET user_signature = null WHERE user_id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.status(200).json({ message: "Record deleted successfully!" });
    }
  );
  res
    .status(200)
    .json({ success: true, message: "User data updated successfully" });
});

router.delete("/user/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM Users WHERE user_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.status(200).json({ message: "Record deleted successfully!" });
  });
  res
    .status(200)
    .json({ success: true, message: "User data updated successfully" });
});

router.post("/testlogin", async (req, res) => {
  const { email } = req.body;
  const [result] = await db.query("SELECT * FROM Users WHERE user_email = ?", [
    email,
  ]);

  if (result.length > 0) {
    const user = result[0];

    //create JWT Token
    const token = jwt.sign(
      { userId: user.user_id, email: user.user_email },
      process.env.SECRET_KEY,
      { expiresIn: "1h" } //อายุของ Token
    );

    //setting Secure Cookie (httpOnly Protect attack XSS)
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // ต้องเป็น true ถ้าใช้ HTTPS
      sameSite: "Lax",
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ message: "Login successful", user: result[0] });
  } else {
    res
      .status(401)
      .json({
        message: "ไม่พบข้อมูลของคุณ กรุณาติดต่อเจ้าหน้าที่ที่เกี่ยวข้อง",
      });
  }
});

exports.router = router;
