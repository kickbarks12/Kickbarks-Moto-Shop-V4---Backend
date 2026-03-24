const { sendMail } = require("../config/mailer");
const fs = require("fs");
const path = require("path");

/**
 * Sends order receipt email
 * - NEVER throws (safe)
 * - Does NOT block checkout
 */
async function sendReceiptEmail(order, userEmail) {
  try {
    if (!userEmail) return;

    // Load HTML template
    const templatePath = path.join(
      __dirname,
      "../emails/order-receipt.html"
    );

    let html = fs.readFileSync(templatePath, "utf8");

    // Build items list
    const itemsHtml = order.items.map(item => `
  <tr>
    <td style="padding:6px 0">
      <div><strong>${item.name}</strong> × ${item.qty}</div>
      ${item.bike ? `<div style="font-size:12px;color:#777">Bike: ${item.bike}</div>` : ""}
    </td>
    <td align="right">₱${item.price * item.qty}</td>
  </tr>
`).join("");


    // Replace template variables
    html = html
  .replace("{{ORDER_NUMBER}}", order.orderNumber || order._id)
  .replace("{{ORDER_DATE}}", new Date(order.date).toLocaleString())
  .replace("{{CUSTOMER_NAME}}", order.customerName)
  .replace("{{CUSTOMER_EMAIL}}", order.customerEmail)
  .replace("{{CUSTOMER_PHONE}}", order.customerPhone)
  .replace("{{CUSTOMER_ADDRESS}}", order.customerAddress)
  .replace("{{SUBTOTAL}}", order.subtotal)
  .replace("{{SHIPPING}}", order.shipping)
  .replace("{{DISCOUNT}}", order.discount || 0)
  .replace("{{VOUCHER_CODE}}", order.voucher || "None")
  .replace("{{ORDER_TOTAL}}", order.total)
  .replace("{{ORDER_ITEMS}}", itemsHtml)
  .replace("{{YEAR}}", new Date().getFullYear());



      console.log("📧 Attempting to send receipt to:", userEmail);



    // Send email (safe)
   await sendMail({
  from: {
  name: "Kickbarks Moto Shop",
  address: process.env.EMAIL_USER
},
replyTo: process.env.EMAIL_USER,
  to: userEmail,
  subject: "Your Order Receipt - Kickbarks Moto Shop",
  html
});


    console.log("📧 Receipt email sent:", userEmail);

  } catch (err) {
    // ❗ DO NOT throw
    console.error("❌ Receipt email failed:", err.message);

  }
}

module.exports = sendReceiptEmail;
