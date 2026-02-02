const nodemiler = require("nodemailer");

//create reusable transporter
const transporter = nodemiler.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password or app password
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed certificates
  },
});

async function sendEmail(recipients, subject, message) {
  for (const email of recipients) {
    const mailOptions = {
      from: `"RESEARCH ADMINISTRATION" <${process.env.EMAIL_USER}>`, // sender address
      to: email,
      subject: subject,
      text: message,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }
}

module.exports = sendEmail;
