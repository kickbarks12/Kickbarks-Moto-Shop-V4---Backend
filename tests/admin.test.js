// const request = require("supertest");
// const mongoose = require("mongoose");
// const app = require("../app");

// describe("ADMIN FLOW", () => {
//   let token;
//   let orderId;

//   beforeAll(async () => {
//   await mongoose.connect(process.env.MONGO_URI_TEST);
//   console.log("TOKEN:", token);

//   const loginRes = await request(app)
//     .post("/api/auth/admin/login")
//     .send({
//       email: process.env.ADMIN_EMAIL,
// password: process.env.ADMIN_PASSWORD
//     });

//   console.log("ADMIN LOGIN STATUS:", loginRes.statusCode);
//   console.log("ADMIN LOGIN BODY:", loginRes.body);

//   token = loginRes.body.token;
//   console.log("TOKEN:", token);

//   const orderRes = await request(app)
//     .get("/api/admin/orders")
//     .set("Authorization", `Bearer ${token}`)

//   console.log("ADMIN ORDERS STATUS:", orderRes.statusCode);
//   console.log("ADMIN ORDERS BODY:", orderRes.body);

//   orderId = orderRes.body[0]?._id;
// }, 20000);

//   afterAll(async () => {
//     await mongoose.connection.close();
//   });

//   it("should FAIL access without admin", async () => {
//     const res = await request(app).get("/api/admin/orders");

//     expect(res.statusCode).toBe(401);
//   });

//   it("should GET all orders with admin", async () => {
//     const res = await request(app)
//       .get("/api/admin/orders")
//       .set("Authorization", `Bearer ${token}`)

//     expect(res.statusCode).toBe(200);
//     expect(Array.isArray(res.body)).toBe(true);
//   });

//   it("should UPDATE order status", async () => {
//     const res = await request(app)
//       .patch(`/api/admin/orders/${orderId}/status`)
//       .set("Authorization", `Bearer ${token}`)
//       .send({
//         status: "Preparing"
//       });

//     expect(res.statusCode).toBe(200);
//     expect(res.body.success).toBe(true);
//     expect(res.body.order.status).toBe("Preparing");
//   });

//   it("should FAIL invalid status", async () => {
//     const res = await request(app)
//       .patch(`/api/admin/orders/${orderId}/status`)
//       .set("Authorization", `Bearer ${token}`)
//       .send({
//         status: "INVALID_STATUS"
//       });

//     expect(res.statusCode).toBe(400);
//   });
// });
const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const app = require("../app");
const Admin = require("../model/admin");
const Order = require("../model/Order");

describe("ADMIN FLOW", () => {
  let token;
  let orderId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);

    const email = "admin@test.com";
    const password = "admin123";

    await Admin.deleteOne({ email });

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      email,
      password: hashedPassword
    });

    // make sure there is at least one order for admin routes to read/update
    let order = await Order.findOne();
    if (!order) {
      order = await Order.create({
        orderNumber: `KB-TEST-${Date.now()}`,
        userId: new mongoose.Types.ObjectId(),
        items: [],
        subtotal: 0,
        shipping: 150,
        discount: 0,
        total: 150,
        customerName: "Test Customer",
        customerEmail: "customer@test.com",
        customerPhone: "09123456789",
        customerAddress: "Test Address",
        paymentMethod: "COD",
        status: "Pending"
      });
    }

    orderId = order._id;

    const loginRes = await request(app)
      .post("/api/auth/admin/login")
      .send({ email, password });

    token = loginRes.body.token;
  }, 20000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should FAIL access without admin", async () => {
    const res = await request(app).get("/api/admin/orders");
    expect(res.statusCode).toBe(401);
  });

  it("should GET all orders with admin", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should UPDATE order status", async () => {
    const res = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Preparing" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe("Preparing");
  });

  it("should FAIL invalid status", async () => {
    const res = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "INVALID_STATUS" });

    expect(res.statusCode).toBe(400);
  });
});