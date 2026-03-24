const PDFDocument = require("pdfkit");

function generateReceiptPDF(order, res) {
  const doc = new PDFDocument({
    margin: 50,
    size: "A4"
  });

  // HEADERS
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=receipt-${order._id}.pdf`
  );

  doc.pipe(res);

  /* ======================
     HEADER
  ====================== */
  doc
  .fontSize(24)
  .fillColor("#0d6efd")
  .text("Kickbarks Moto Shop", { align: "left" });

doc
  .moveDown(0.2)
  .fontSize(11)
  .fillColor("#555")
  .text("Official Order Receipt");

doc
  .moveDown(1)
  .fontSize(10)
  .fillColor("#000")
  .text(`Receipt #: ${order.orderNumber}`, { align: "right" })
  .text(`Date: ${new Date(order.date).toLocaleString()}`, { align: "right" });


doc.moveDown(2);

doc
  .fontSize(12)
  .fillColor("#000")
  .text("Billed To", { underline: true });

doc.moveDown(0.5);

doc
  .fontSize(11)
  .text(order.customerName)
  .text(order.customerEmail)
  .text(order.customerPhone)
  .text(order.customerAddress);


  doc.moveDown(1.5);

  /* ======================
     ITEMS TABLE
  ====================== */
  doc.fontSize(11).text("Items", { underline: true });
  doc.moveDown(0.5);

  order.items.forEach(item => {
  const lineTotal = (item.price || 0) * (item.qty || 1);

  doc.fontSize(10).text(`${item.name} × ${item.qty}`);

  if (item.bike) {
    doc
      .fontSize(9)
      .fillColor("#666")
      .text(`Bike: ${item.bike}`);
    doc.fillColor("#000");
  }

  doc.text(`₱${lineTotal}`, { align: "right" });
  doc.moveDown(0.5);
});


  doc.moveDown(1.5);

  /* ======================
     TOTALS
  ====================== */
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .strokeColor("#ddd")
    .stroke();

 doc.moveDown(2);

doc.text(`Subtotal: ₱${order.subtotal}`, { align: "right" });
doc.text(`Shipping: ₱${order.shipping}`, { align: "right" });

if (order.discount > 0) {
  doc
    .fillColor("#dc3545")
    .text(`Discount: -₱${order.discount}`, { align: "right" });
}

doc
  .moveDown(0.5)
  .fontSize(14)
  .fillColor("#198754")
  .text(`Total Paid: ₱${order.total}`, { align: "right" });


 doc.moveDown(3);

doc
  .fontSize(9)
  .fillColor("#777")
  .text(
    "Thank you for shopping with Kickbarks Moto Shop.\nThis receipt serves as proof of purchase.",
    { align: "center" }
  );


  doc.end();
}

module.exports = generateReceiptPDF;
