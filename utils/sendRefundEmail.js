const { sendMail } = require("../config/mailer");

module.exports = async (email, order) => {
  

  await sendMail({
    to: email,
    subject: "Refund Request Received",
    html: `
      <h3>Refund Request Submitted</h3>
      <p>Order ID: <strong>${order._id}</strong></p>
      <p>Amount: ₱${order.refundAmount}</p>
      <p>Reason:</p>
      <blockquote>${order.refundReason}</blockquote>
      <p>We will review your request shortly.</p>
    `
  });
};
