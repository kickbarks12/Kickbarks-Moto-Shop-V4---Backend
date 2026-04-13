const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

describe("ORDER FLOW", () => {
  const agent = request.agent(app);
  const email = `order${Date.now()}@gmail.com`;
  const password = "12345678";

  let productId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);

    await agent.post("/api/auth/signup").send({
      name: "Order User",
      email,
      password,
      mobile: "09123456789",
      birthday: "2000-01-01"
    });

    await agent.post("/api/auth/login").send({
      email,
      password
    });

    const Product = require("../model/Product");

const product = await Product.create({
  name: "Test Product",
  price: {
    mioi125: 100
  },
  stock: {
    mioi125: 100
  },
  category: "test",
  images: [],
  description: "Test product"
});

productId = product._id;
  }, 20000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 20000);

  it("should ADD to cart", async () => {
    const res = await agent.post("/api/cart").send({
      items: [
        {
          productId,
          name: "Test Product",
          price: 100,
          qty: 1,
          bike: "mioi125"
        }
      ]
    });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should PLACE order", async () => {
    const res = await agent.post("/api/orders").send({
      items: [
        {
          productId,
          name: "Test Product",
          price: 100,
          qty: 1,
          bike: "mioi125"
        }
      ],
      customer: {
        name: "Order User",
        email,
        phone: "09123456789",
        address: "Masbate City"
      },
      paymentMethod: "COD"
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orderId).toBeDefined();
  });

  it("should FAIL order without login", async () => {
    const res = await request(app).post("/api/orders").send({
      items: [],
      customer: {}
    });

    expect(res.statusCode).toBe(401);
  });

  it("should FAIL when product is out of stock", async () => {
    const res = await agent.post("/api/orders").send({
      items: [
        {
          productId,
          name: "Test Product",
          price: 100,
          qty: 9999,
          bike: "mioi125"
        }
      ],
      customer: {
        name: "Order User",
        email,
        phone: "09123456789",
        address: "Masbate City"
      },
      paymentMethod: "COD"
    });

    expect([400, 429]).toContain(res.statusCode);
    expect(res.body.error || "").toMatch(/out of stock|already placed|too many/i);
  });
});