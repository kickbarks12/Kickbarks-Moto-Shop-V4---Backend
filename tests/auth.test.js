const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

describe("AUTH FLOW", () => {
  const uniqueEmail = `test${Date.now()}@gmail.com`;
  const password = "12345678";

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
  }, 20000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 20000);

  it("should SIGNUP successfully", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Test User",
        email: uniqueEmail,
        password,
        mobile: "09123456789",
        birthday: "2000-01-01"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.voucher).toBeDefined();
  }, 20000);

  it("should LOGIN successfully", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: uniqueEmail,
        password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  }, 20000);

  it("should FAIL login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: uniqueEmail,
        password: "wrongpassword"
      });

    expect(res.statusCode).toBe(401);
  }, 20000);

  it("should FAIL signup with duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Test User",
        email: uniqueEmail,
        password,
        mobile: "09123456789",
        birthday: "2000-01-01"
      });

    expect(res.statusCode).toBe(400);
  }, 20000);
});