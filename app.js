require("dotenv").config();

const express = require("express");
const session = require("express-session");
const { connectDB } = require("./config/db");

const productRouter = require("./routes/product");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin").router;
const aiRoutes = require("./routes/ai");

const app = express();

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || "change-this-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => res.redirect("/product/home"));

app.use("/product", productRouter);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/ai", aiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
