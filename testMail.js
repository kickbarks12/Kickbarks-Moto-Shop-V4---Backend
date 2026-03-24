require("dotenv").config();
const transporter = require("./config/mailer");

async function test() {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "TEST EMAIL FROM KICKBARKS",
      html: "<h1>If you see this, mailer works</h1>"
    });

    console.log("EMAIL SENT SUCCESS");
  } catch (err) {
    console.error("MAIL ERROR:", err);
  }
}

test();
