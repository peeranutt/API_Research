const express = require("express");
const db = require("../config/db");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const authenticate = require("../middleware/authenticate.js");

router = express.Router();

router.post("/auth", async (req, res) => {
  try {
    // get the code from fronted
    const code = req.headers.authorization;

    console.log("Auth", code);

    if (!code)
      return res.status(400).json({ message: "Missing authorization code" });

    //Exchange the authorization code for an access token
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: "postmessage",
      grant_type: "authorization_code",
    });

    const accessToken = response.data.access_token;

    //Fetch user details using the access token
    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userDetails = userResponse.data;

    // if (!userDetails.email.endsWith("@it.kmitl.ac.th")) {
    //   return res.status(403).json({ message: "อีเมลของคุณไม่ได้รับอนุญาต กรุณาใช้ @it.kmitl.ac.th เท่านั้น" });
    // }

    //ตรวจสอบในฐานข้อมูลว่ามีผู้ใช้อยู่หรือไม่
    let [rows] = await db.query("SELECT * FROM Users WHERE user_email = ?", [
      userDetails.email,
    ]);

    //เช็คแล้วไม่มี user
    if (rows.length === 0) {
      return res.status(403).json({ message: "ไม่พบข้อมูลของคุณ กรุณาติดต่อเจ้าหน้าที่ที่เกี่ยวข้อง" });
    }

    const user = rows[0];

    //create JWT Token
    const token = jwt.sign(
      { userId: user.user_id, email: user.user_email },
      process.env.SECRET_KEY,
      { expiresIn: "1h" } //อายุของ Token
    );

    //setting Secure Cookie (httpOnly Protect attack XSS)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ต้องเป็น true ถ้าใช้ HTTPS
      sameSite: "Lax",
      maxAge: 3600000, // 1 hour
    });

    //Process user details and perform necessary actions
    res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", userDetails });
  } catch (error) {
    console.log("Error saving code:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด กรุณาติดต่อเจ้าหน้าที่ หรือลองอีกครั้งในภายหลัง" });
  }
});

//check status login
router.get("/me", authenticate, async (req, res) => {
  if (!req.user) {
    return res.status(403).json({ message: "ไม่ได้เข้าสู่ระบบ กรุณาทำการเข้าสู่ระบบอีกครั้ง" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM Users WHERE user_id = ?", [
      req.user.userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูล กรุณาติดต่อเจ้าหน้าที่" });
    }

    res.status(200).json({ user: rows[0] });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด กรุณาติดต่อเจ้าหน้าที่ หรือลองใหม่ภายหลัง" });
  }
});

//clear Cookie
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "ออกจากระบบเรียบร้อย" });
  console.log("Logout success");
});

exports.router = router;