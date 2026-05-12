const nodemailer = require("nodemailer");

// ===============================
// 📧 CREATE TRANSPORTER
// ===============================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Optional: verify connection on startup
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email config error:", err.message);
  } else {
    console.log("✅ Email server ready");
  }
});

// ===============================
// 📧 SEND EMAIL
// ===============================
async function sendEmail({ to, subject, text, html }) {
  try {
    // Basic validation
    if (!to) {
      return { success: false, error: "No recipient" };
    }

    const mailOptions = {
      from: `"AI Job Assistant" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject || "Application Follow-up",
      text: text || "",
      html: html || `<p>${(text || "").replace(/\n/g, "<br>")}</p>`
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("📧 Email sent:", info.response);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (err) {
    console.error("❌ Email error:", err.message);

    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = { sendEmail };