const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const Product = require("../model/Product");

describe("STOCK DEDUCTION FLOW", () => {
  const agent = request.agent(app);

  const email = `stock${Date.now()}@gmail.com`;
  const password = "12345678";

  let product;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);

    await agent.post("/api/auth/signup").send({
      name: "Stock User",
      email,
      password,
      mobile: "09123456789",
      birthday: "2000-01-01"
    });

    await agent.post("/api/auth/login").send({
      email,
      password
    });

    product = await Product.create({
  name: "Stock Product",
  price: {
    mioi125: 100
  },
  stock: {
    mioi125: 100
  },
  category: "test",
  images: [],
  description: "Stock test product"
});

    if (!product) {
      throw new Error("No product with enough mioi125 stock found for stock test");
    }
  }, 20000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 20000);

  it("should DEDUCT stock after successful order", async () => {
    const beforeProduct = await Product.findById(product._id);
    const beforeStock = Number(beforeProduct.stock.get("mioi125") || 0);

    const res = await agent.post("/api/orders").send({
      items: [
        {
          productId: product._id,
          name: product.name,
          price: 100,
          qty: 1,
          bike: "mioi125"
        }
      ],
      customer: {
        name: "Stock User",
        email,
        phone: "09123456789",
        address: "Masbate City"
      },
      paymentMethod: "COD"
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const afterProduct = await Product.findById(product._id);
    const afterStock = Number(afterProduct.stock.get("mioi125") || 0);

    expect(afterStock).toBe(beforeStock - 1);
  }, 20000);
});