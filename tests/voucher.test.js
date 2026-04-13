const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../model/User");
const UserVoucher = require("../model/UserVoucher");
const Product = require("../model/Product");

describe("VOUCHER FLOW", () => {
  const agent = request.agent(app);

  const email = `voucher${Date.now()}@gmail.com`;
  const password = "12345678";

  let userId;
  let product;
  let voucherCode;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);

    await agent.post("/api/auth/signup").send({
      name: "Voucher User",
      email,
      password,
      mobile: "09123456789",
      birthday: "2000-01-01"
    });

    await agent.post("/api/auth/login").send({
      email,
      password
    });

    const user = await User.findOne({ email });
    userId = user._id;

    product = await Product.create({
  name: "Voucher Product",
  price: {
    mioi125: 600
  },
  stock: {
    mioi125: 100
  },
  category: "test",
  images: [],
  description: "Voucher test product"
});

    if (!product) {
      throw new Error("No product with enough mioi125 stock found for voucher test");
    }

    const voucher = await UserVoucher.create({
      userId,
      code: `TESTVOUCHER${Date.now()}`,
      amount: 100,
      minSpend: 500,
      used: false
    });

    voucherCode = voucher.code;
  }, 20000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 20000);

  it("should APPLY voucher discount when eligible", async () => {
    const price = 600;

    const res = await agent.post("/api/orders").send({
      items: [
        {
          productId: product._id,
          name: product.name,
          price,
          qty: 1,
          bike: "mioi125"
        }
      ],
      customer: {
        name: "Voucher User",
        email,
        phone: "09123456789",
        address: "Masbate City"
      },
      voucher: voucherCode,
      paymentMethod: "COD"
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const usedVoucher = await UserVoucher.findOne({ code: voucherCode });
    expect(usedVoucher.used).toBe(true);

    // subtotal 600 + shipping 150 - voucher 100 = 650
    expect(res.body.finalTotal).toBe(650);
  }, 20000);

  it("should NOT apply voucher if below minSpend", async () => {
    const voucher = await UserVoucher.create({
      userId,
      code: `LOWSPEND${Date.now()}`,
      amount: 100,
      minSpend: 500,
      used: false
    });

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
        name: "Voucher User",
        email,
        phone: "09123456789",
        address: "Masbate City"
      },
      voucher: voucher.code,
      paymentMethod: "COD"
    });

    expect([200, 429]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body.finalTotal).toBe(250);
      const unchangedVoucher = await UserVoucher.findOne({ code: voucher.code });
      expect(unchangedVoucher.used).toBe(false);
    }
  }, 20000);
});