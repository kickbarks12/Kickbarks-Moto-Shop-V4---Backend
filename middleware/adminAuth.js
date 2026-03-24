const jwt = require("jsonwebtoken");
const Admin = require("../model/admin");

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ error: "Not authorized" });

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
