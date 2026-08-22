require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const { connectDB } = require("./config/db");

const mongoUri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_DATABASE}.jrs1tu5.mongodb.net/?appName=${process.env.MONGO_DATABASE}`;

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
    // FIX: sessions were stored in memory only, so every server restart/redeploy
    // (or running more than one server instance) logged everyone out and forced
    // them to enter name/number again. Now sessions persist in MongoDB, so a
    // logged-in user stays logged in across restarts, for up to 30 days.
    store: MongoStore.create({
        mongoUrl: mongoUri,
        dbName: "todoDB",
        collectionName: "sessions",
        ttl: 60 * 60 * 24 * 30
    }),
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 30
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
