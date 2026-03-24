// const { Resend } = require("resend");

// const resend = new Resend(process.env.RESEND_API_KEY);

// async function sendMail(options) {
//   try {
//     const response = await resend.emails.send({
//       from: "Kickbarks Moto Shop <onboarding@resend.dev>", // temp sender
//       to: options.to,
//       subject: options.subject,
//       html: options.html
//     });

//     console.log("✅ Email sent:", response.id);
//     return response;

//   } catch (err) {
//     console.error("❌ Resend email error:", err);
//     throw err;
//   }
// }

// module.exports = { sendMail };

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail(options) {
  try {
    const response = await resend.emails.send({
  from: process.env.EMAIL_FROM || "Kickbarks Moto Shop <onboarding@resend.dev>",
  to: options.to,
  subject: options.subject,
  html: options.html,
  reply_to: options.reply_to || undefined
});

    console.log("✅ Email sent:", response?.data?.id);
    return response;

  } catch (err) {
    console.error("❌ Resend email error:", err);
  }
}

module.exports = { sendMail };