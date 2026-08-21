const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { sendWhatsAppText, orderBillText } = require("../services/whatsapp");

function requireAdmin(req, res, next) {
    if (!req.session.admin) return res.redirect("/admin/login");
    next();
}

router.get("/login", (req, res) => {
    res.render("admin-login", { error: req.query.error || null });
});

router.post("/login", (req, res) => {
    const username = String(req.body.username || "");
    const password = String(req.body.password || "");

    if (
        username === (process.env.ADMIN_USERNAME || "admin") &&
        password === (process.env.ADMIN_PASSWORD || "change-me")
    ) {
        req.session.admin = { username };
        return res.redirect("/admin/dashboard");
    }

    res.redirect("/admin/login?error=Invalid+admin+login");
});

router.get("/logout", (req, res) => {
    req.session.admin = null;
    res.redirect("/admin/login");
});

router.get("/dashboard", requireAdmin, async (req, res) => {
    const db = getDB();
    const [orders, users, products] = await Promise.all([
        db.collection("orders").find({}).sort({ createdAt: -1 }).toArray(),
        db.collection("users").find({}).toArray(),
        db.collection("products").find({}).toArray()
    ]);

    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const totalSales = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const pending = orders.filter(o => ["paid", "paid (test mode)", "confirmed"].includes(String(o.status || "").toLowerCase())).length;

    res.render("admin-dashboard", {
        orders,
        users,
        products,
        userMap,
        totalSales,
        pending,
        shopName: process.env.SHOP_NAME || "Vastraa"
    });
});

router.post("/orders/:id/update", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const orderId = new ObjectId(req.params.id);
        const order = await db.collection("orders").findOne({ _id: orderId });

        if (!order) return res.redirect("/admin/dashboard");

        const status = String(req.body.status || "processing").trim();
        const message = String(req.body.message || "").trim();

        const user = await db.collection("users").findOne({ _id: order.userId });
        const finalMessage = message ||
            `${process.env.SHOP_NAME || "Vastraa"} update: Your order ${order._id} is now "${status}".${status.toLowerCase().includes("dispatch") ? " Your parcel is being prepared for dispatch." : ""}`;

        await db.collection("orders").updateOne(
            { _id: orderId },
            {
                $set: { status, updatedAt: new Date() },
                $push: {
                    adminMessages: {
                        message: finalMessage,
                        status,
                        sentAt: new Date()
                    }
                }
            }
        );

        if (user?.phone && user.whatsappOptIn !== false) {
            await sendWhatsAppText(user.phone, finalMessage);
        }

        res.redirect("/admin/dashboard?updated=1");
    } catch (err) {
        console.error("Admin order update error:", err);
        res.status(500).send("Could not update order.");
    }
});

router.post("/orders/:id/send-bill", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const order = await db.collection("orders").findOne({ _id: new ObjectId(req.params.id) });
        if (!order) return res.redirect("/admin/dashboard");

        const user = await db.collection("users").findOne({ _id: order.userId });
        if (user?.phone) await sendWhatsAppText(user.phone, orderBillText(order, user));

        res.redirect("/admin/dashboard?bill=sent");
    } catch (err) {
        console.error("Bill send error:", err);
        res.status(500).send("Could not send bill.");
    }
});

module.exports = { router, requireAdmin };
