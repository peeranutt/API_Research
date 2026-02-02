const jwt = require("jsonwebtoken");

//Middleware check JWT
const authenticate = (req, res, next) => {
    const token = req.cookies.token;

    console.log("token received:", token);

    if (!token){
      console.log("No token found");
      return res.status(401).json({ message: "การเข้าสู่ระบบมีปัญหา" });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decoded;
      next();
    } catch (error) {
      console.log("Invalid Token: ", error);
      return res.status(403).json({message: "Invalid token"});

    }
  };
module.exports = authenticate
  //authenticate จะถูกใช้ใน ทุก API ที่ต้องล็อกอินก่อนถึงจะใช้งานได้
  //ใช้ใน /me, /update-profile, API ที่ต้องการความปลอดภัย
  //บน Frontend ให้เรียก /me เพื่อดึงข้อมูล User ที่ล็อกอินอยู่
