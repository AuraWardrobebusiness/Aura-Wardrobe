const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// 🔐 TEMP STORAGE (in-memory)
let otpStore = {};

// 📧 EMAIL TRANSPORT (Gmail App Password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD
  }
});

// 🔥 SEND OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.json({ success: false });

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000 // 5 min expiry
  };

  try {
    await transporter.sendMail({
      from: `"Aura Wardrobe" <${process.env.EMAIL}>`,
      to: email,
      subject: "Your OTP for Order Verification",
      html: `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes.</p>`
    });

    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});

// 🔥 VERIFY OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email];

  if (!record) return res.json({ success: false });

  if (Date.now() > record.expires) {
    delete otpStore[email];
    return res.json({ success: false });
  }

  if (record.otp == otp) {
    delete otpStore[email];
    return res.json({ success: true });
  }

  res.json({ success: false });
});

app.listen(PORT, () => console.log("Server running"));
