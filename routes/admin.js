const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { sendWhatsAppText, orderBillText } = require("../services/whatsapp");
const { seedCatalog } = require("../services/seedCatalog");


function ensureProductSizeInventory(product) {
    if (Array.isArray(product.sizes) && product.sizes.length && product.sizeStock) return null;
    const title = String(product.title || "").toLowerCase();
    const isSaree = title.includes("saree");
    const sizes = isSaree ? ["Free Size"] : ["XS","S","M","L","XL","XXL"];
    const sizeStock = {};
    sizes.forEach(s => { sizeStock[s] = Math.max(0, Number(product.stock || 0)); });
    return { sizes, sizeStock };
}

async function autoInitializeMissingSizes(db) {
    const products = await db.collection("products").find({}).toArray();
    for (const product of products) {
        const data = ensureProductSizeInventory(product);
        if (data) {
            await db.collection("products").updateOne({ _id: product._id }, { $set: data });
        }
    }
}

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

router.post("/initialize-sizes", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const products = await db.collection("products").find({}).toArray();
        let updated = 0;

        for (const product of products) {
            if (Array.isArray(product.sizes) && product.sizes.length) continue;

            const title = String(product.title || "").toLowerCase();
            const isSaree = title.includes("saree");
            const sizes = isSaree ? ["Free Size"] : ["XS","S","M","L","XL","XXL"];
            const sizeStock = {};
            sizes.forEach(s => { sizeStock[s] = Math.max(0, Number(product.stock || 0)); });

            await db.collection("products").updateOne(
                { _id: product._id },
                { $set: { sizes, sizeStock } }
            );
            updated++;
        }

        res.redirect("/product/manage?updated=" + updated);
    } catch (err) {
        console.error("Initialize sizes error:", err);
        res.status(500).send("Could not initialize product sizes.");
    }
});

router.post("/seed-catalog", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const result = await seedCatalog(db);
        res.redirect("/admin/dashboard?seeded=" + result.added);
    } catch (err) {
        console.error("Catalog seed error:", err);
        res.status(500).send("Could not load the existing image catalog.");
    }
});

router.get("/dashboard", requireAdmin, async (req, res) => {
    try {
        const db = getDB();

        await autoInitializeMissingSizes(db);

        const [orders, users, products, categories] = await Promise.all([
            db.collection("orders").find({}).sort({ createdAt: -1 }).toArray(),
            db.collection("users").find({}).toArray(),
            db.collection("products").find({}).sort({ _id: -1 }).toArray(),
            db.collection("categories").find({}).toArray()
        ]);

        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });

        const activeOrders = orders.filter(o => String(o.status || "").toLowerCase() !== "cancelled");
        const totalSales = activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

        const pendingStatuses = [
            "pending", "paid", "paid (test mode)", "confirmed",
            "processing", "packing started", "ready to dispatch", "dispatched"
        ];

        const pending = orders.filter(o =>
            pendingStatuses.includes(String(o.status || "").toLowerCase())
        ).length;

        const paidOrders = orders.filter(o => {
            const mode = String(o.paymentMode || "").toLowerCase();
            return mode !== "cod" &&
                (mode === "test" || !!o.razorpayPaymentId ||
                String(o.status || "").toLowerCase().includes("paid"));
        }).length;

        const codOrders = orders.filter(o =>
            String(o.paymentMode || "").toLowerCase() === "cod"
        ).length;

        const lowStock = products.filter(p =>
            p.stock !== undefined && p.stock !== null &&
            Number(p.stock) <= Number(p.lowStockLimit || 5)
        );

        const outOfStock = products.filter(p =>
            p.stock !== undefined && p.stock !== null && Number(p.stock) <= 0
        );

        const statusCounts = {};
        orders.forEach(o => {
            const s = String(o.status || "unknown").toLowerCase();
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        const topProducts = {};
        orders.forEach(o => {
            (o.items || []).forEach(item => {
                const key = String(item.title || "Unknown product");
                if (!topProducts[key]) topProducts[key] = { title: key, qty: 0, sales: 0, image: item.image || "" };
                topProducts[key].qty += Number(item.quantity || 1);
                topProducts[key].sales += Number(item.price || 0) * Number(item.quantity || 1);
            });
        });

        const bestSellers = Object.values(topProducts)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        res.render("admin-dashboard", {
            orders,
            users,
            products,
            categories,
            userMap,
            totalSales,
            pending,
            paidOrders,
            codOrders,
            lowStock,
            outOfStock,
            statusCounts,
            bestSellers,
            updated: req.query.updated === "1",
            bill: req.query.bill === "sent",
            seeded: req.query.seeded || null,
            shopName: process.env.SHOP_NAME || "Vastraa"
        });
    } catch (err) {
        console.error("Admin dashboard error:", err);
        res.status(500).send("Could not load admin dashboard.");
    }
});


// FULL ORDER DETAIL
router.get("/orders/:id", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        let order;

        try {
            order = await db.collection("orders").findOne({
                _id: new ObjectId(req.params.id)
            });
        } catch (_) {
            order = null;
        }

        if (!order) return res.redirect("/admin/dashboard");

        const user = order.userId
            ? await db.collection("users").findOne({ _id: order.userId })
            : null;

        res.render("admin-order-detail", {
            order,
            user,
            shopName: process.env.SHOP_NAME || "Vastraa"
        });
    } catch (err) {
        console.error("Order detail error:", err);
        res.status(500).send("Could not load order.");
    }
});

// CUSTOMER DETAIL + ORDER HISTORY
router.get("/customers/:id", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        let user;

        try {
            user = await db.collection("users").findOne({
                _id: new ObjectId(req.params.id)
            });
        } catch (_) {
            user = null;
        }

        if (!user) return res.redirect("/admin/customers");

        const orders = await db.collection("orders")
            .find({ userId: user._id })
            .sort({ createdAt: -1 })
            .toArray();

        const totalSpent = orders
            .filter(o => String(o.status || "").toLowerCase() !== "cancelled")
            .reduce((s, o) => s + Number(o.total || 0), 0);

        res.render("admin-customer-detail", {
            user,
            orders,
            totalSpent,
            shopName: process.env.SHOP_NAME || "Vastraa"
        });
    } catch (err) {
        console.error("Customer detail error:", err);
        res.status(500).send("Could not load customer.");
    }
});

// SALES / OPERATIONS REPORT
router.get("/reports", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const [orders, products] = await Promise.all([
            db.collection("orders").find({}).sort({ createdAt: -1 }).toArray(),
            db.collection("products").find({}).toArray()
        ]);

        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startWeek = new Date(startToday);
        startWeek.setDate(startWeek.getDate() - 6);
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        function salesSince(start) {
            return orders
                .filter(o =>
                    o.createdAt && new Date(o.createdAt) >= start &&
                    String(o.status || "").toLowerCase() !== "cancelled"
                )
                .reduce((s, o) => s + Number(o.total || 0), 0);
        }

        function countSince(start) {
            return orders.filter(o =>
                o.createdAt && new Date(o.createdAt) >= start
            ).length;
        }

        const productStats = {};
        orders.forEach(o => {
            if (String(o.status || "").toLowerCase() === "cancelled") return;

            (o.items || []).forEach(item => {
                const key = String(item.title || "Unknown");
                if (!productStats[key]) {
                    productStats[key] = {
                        title: key,
                        qty: 0,
                        sales: 0,
                        image: item.image || ""
                    };
                }
                productStats[key].qty += Number(item.quantity || 1);
                productStats[key].sales +=
                    Number(item.price || 0) * Number(item.quantity || 1);
            });
        });

        const bestSellers = Object.values(productStats)
            .sort((a, b) => b.qty - a.qty);

        const paymentStats = {};
        orders.forEach(o => {
            const method = String(
                o.paymentMode || (o.razorpayPaymentId ? "online" : "unknown")
            ).toLowerCase();

            paymentStats[method] = (paymentStats[method] || 0) + 1;
        });

        res.render("admin-reports", {
            orders,
            products,
            bestSellers,
            paymentStats,
            todaySales: salesSince(startToday),
            weekSales: salesSince(startWeek),
            monthSales: salesSince(startMonth),
            todayOrders: countSince(startToday),
            weekOrders: countSince(startWeek),
            monthOrders: countSince(startMonth),
            shopName: process.env.SHOP_NAME || "Vastraa"
        });
    } catch (err) {
        console.error("Admin reports error:", err);
        res.status(500).send("Could not load reports.");
    }
});


router.get("/customers", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const [users, orders] = await Promise.all([
            db.collection("users").find({}).sort({ createdAt: -1 }).toArray(),
            db.collection("orders").find({}).sort({ createdAt: -1 }).toArray()
        ]);

        const stats = {};
        orders.forEach(o => {
            const key = o.userId ? o.userId.toString() : "";
            if (!stats[key]) stats[key] = { count: 0, total: 0, last: o.createdAt };
            stats[key].count += 1;
            stats[key].total += Number(o.total || 0);
            if (o.createdAt && (!stats[key].last || new Date(o.createdAt) > new Date(stats[key].last))) {
                stats[key].last = o.createdAt;
            }
        });

        res.render("admin-customers", {
            users,
            stats,
            shopName: process.env.SHOP_NAME || "Vastraa"
        });
    } catch (err) {
        console.error("Admin customers error:", err);
        res.status(500).send("Could not load customers.");
    }
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
