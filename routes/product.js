const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { sendWhatsAppText, orderBillText } = require("../services/whatsapp");
const router = express.Router();
const { requireAdmin } = require("./admin");

// RAZORPAY IS OPTIONAL — the store works fine with the built-in Test Payment
// screen without it. Real Razorpay only loads if the package is installed
// AND keys are set in .env, so the app never crashes without it.
let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {

    try {

        const Razorpay = require("razorpay");

        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

    } catch (e) {

        console.warn("Razorpay package not installed — real payments are disabled, Test Payment mode still works fine.");

    }

}


function requireLogin(req, res, next) {

    if (!req.session.user) {

        const backPage = req.get("Referer") || "/product/home";

        const separator = backPage.includes("?") ? "&" : "?";

        return res.redirect(backPage + separator + "loginRequired=1");

    }

    next();

}


function parseSizeStock(body) {
    const stock = {};
    const sizes = [];
    const rawSizes = Array.isArray(body.sizes) ? body.sizes : (body.sizes ? [body.sizes] : []);
    rawSizes.forEach(size => {
        const clean = String(size).trim();
        if (!clean) return;
        const qty = Math.max(0, Number(body["sizeStock_" + clean] || 0));
        sizes.push(clean);
        stock[clean] = qty;
    });
    return { sizes, sizeStock: stock };
}

function normalizeExistingSizes(product) {
    if (Array.isArray(product.sizes) && product.sizes.length) return product;
    const name = String(product.title || "").toLowerCase();
    const isSaree = name.includes("saree");
    const sizes = isSaree ? ["Free Size"] : ["XS","S","M","L","XL","XXL"];
    const sizeStock = {};
    sizes.forEach(s => { sizeStock[s] = Math.max(0, Number(product.stock || 0)); });
    return Object.assign({}, product, { sizes, sizeStock });
}

async function getNavData(db, req) {

    const categoryCollection = db.collection("categories");
    const productCollection = db.collection("products");

    const categories = await categoryCollection.find({}).toArray();
    const products = await productCollection.find({}).toArray();

    let cartCount = 0;

    if (req.session.user) {

        const cartCollection = db.collection("cart");

        cartCount = await cartCollection.countDocuments({

            userId: req.session.user._id

        });

    }

    return {

        categories: categories,

        products: products,

        user: req.session.user,

        cartCount: cartCount

    };

}

router.get("/", async (req, res) => {

    const db = getDB();

    const collection = db.collection("products");

    const data = await collection.find({}).toArray();

    res.render("index", {

        todos: data

    });

});

router.get("/home", async (req, res) => {

    const db = getDB();

    const nav = await getNavData(db, req);

    const filterCategoryId = req.query.category || null;

    let displayProducts = nav.products;
    let filterCategoryName = null;

    if (filterCategoryId) {

        displayProducts = nav.products.filter(
            p => p.categoryId == filterCategoryId
        );

        const matchedCategory = nav.categories.find(
            c => c._id.toString() === filterCategoryId
        );

        filterCategoryName = matchedCategory ? matchedCategory.name : null;
    }

    res.render("home", Object.assign({}, nav, {

        displayProducts: displayProducts,
        filterCategoryId: filterCategoryId,
        filterCategoryName: filterCategoryName

    }));

});

// DEDICATED CATEGORY PAGE — its own proper page (not the home page filter)
router.get("/category/:id", async (req, res) => {

    const db = getDB();

    const nav = await getNavData(db, req);

    const category = nav.categories.find(
        c => c._id.toString() === req.params.id
    );

    if (!category) {
        return res.redirect("/product/home");
    }

    const products = nav.products.filter(
        p => p.categoryId == req.params.id
    );

    res.render("category-product", Object.assign({}, nav, {

        products: products,
        categoryName: category.name,
        categoryId: req.params.id

    }));

});

// SINGLE PRODUCT DETAIL PAGE
router.get("/view/:id", async (req, res) => {

    const db = getDB();

    const nav = await getNavData(db, req);

    const productCollection = db.collection("products");

    let product;

    try {
        product = await productCollection.findOne({ _id: new ObjectId(req.params.id) });
    } catch (e) {
        product = null;
    }

    if (!product) {
        return res.redirect("/product/home");
    }

    const category = nav.categories.find(
        c => c._id.toString() === (product.categoryId || "").toString()
    );

    const related = nav.products.filter(
        p => p.categoryId == product.categoryId && p._id.toString() !== product._id.toString()
    ).slice(0, 4);

    res.render("product-detail", Object.assign({}, nav, {

        product: product,
        categoryName: category ? category.name : null,
        related: related,
        querySizeRequired: req.query.sizeRequired === "1",
        querySizeUnavailable: req.query.sizeUnavailable === "1"

    }));

});

router.get("/category-form", requireAdmin, (req, res) => {

    res.render("category-form", {

        error: req.query.error || null,
        added: req.query.added || null

    });

});

// ADD CATEGORY (WITH REAL IMAGE UPLOAD)
router.post("/category/add", requireAdmin, (req, res) => {

    upload.single("image")(req, res, async function (err) {

        if (err) {
            return res.redirect("/product/category-form?error=" + encodeURIComponent(err.message));
        }

        const db = getDB();

        const collection = db.collection("categories");

        await collection.insertOne({

            name: req.body.name,

            image: req.file ? `uploads/${req.file.filename}` : ""

        });

        res.redirect("/product/category-form?added=1");

    });

});

router.get("/product-form", requireAdmin, async (req, res) => {

    const db = getDB();

    const collection = db.collection("categories");

    const data = await collection.find({}).toArray();

    res.render("product-form", {

        categories: data,
        availableSizes: ["XS","S","M","L","XL","XXL","3XL","Free Size"],

        error: req.query.error || null,
        added: req.query.added || null

    });

});

// ADD PRODUCT (WITH REAL IMAGE UPLOAD)
router.post("/add", requireAdmin, (req, res) => {

    upload.single("image")(req, res, async function (err) {

        if (err) {
            return res.redirect("/product/product-form?error=" + encodeURIComponent(err.message));
        }

        const db = getDB();

        const collection = db.collection("products");

        await collection.insertOne({

            title: req.body.title,

            price: Number(req.body.price) || 0,

            image: req.file ? `uploads/${req.file.filename}` : "",

            categoryId: req.body.categoryId,

            stock: Math.max(0, Number(req.body.stock || 0)),

            lowStockLimit: Math.max(0, Number(req.body.lowStockLimit || 5)),

            ...parseSizeStock(req.body),

            active: req.body.active !== "0"

        });

        res.redirect("/product/product-form?added=1");

    });

});


// MANAGE PRODUCTS — ADMIN
router.get("/manage", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const [products, categories] = await Promise.all([
            db.collection("products").find({}).sort({ _id: -1 }).toArray(),
            db.collection("categories").find({}).toArray()
        ]);

        const categoryMap = {};
        categories.forEach(category => {
            categoryMap[category._id.toString()] = category.name;
        });

        res.render("manage-products", {
            products,
            categories,
            categoryMap,
            deleted: req.query.deleted || null,
            updated: req.query.updated || null
        });
    } catch (err) {
        console.error("Manage products error:", err);
        res.status(500).send("Could not load products.");
    }
});

// EDIT PRODUCT FORM
router.get("/edit/:id", requireAdmin, async (req, res) => {

    const db = getDB();

    const productCollection = db.collection("products");
    const categoryCollection = db.collection("categories");

    let product;

    try {
        product = await productCollection.findOne({ _id: new ObjectId(req.params.id) });
    } catch (e) {
        product = null;
    }

    if (!product) {
        return res.redirect("/product/manage");
    }

    const categories = await categoryCollection.find({}).toArray();

    res.render("product-edit", {

        product: normalizeExistingSizes(product),
        categories: categories,
        availableSizes: ["XS","S","M","L","XL","XXL","3XL","Free Size"],
        error: req.query.error || null

    });

});

// UPDATE PRODUCT (price, title, category, and optionally a new image)
router.post("/update/:id", requireAdmin, (req, res) => {

    upload.single("image")(req, res, async function (err) {

        if (err) {
            return res.redirect("/product/edit/" + req.params.id + "?error=" + encodeURIComponent(err.message));
        }

        const db = getDB();

        const productCollection = db.collection("products");

        const existing = await productCollection.findOne({ _id: new ObjectId(req.params.id) });

        if (!existing) {
            return res.redirect("/product/manage");
        }

        const updateData = {

            title: req.body.title,
            price: Number(req.body.price) || 0,
            categoryId: req.body.categoryId,
            stock: Math.max(0, Number(req.body.stock || 0)),
            lowStockLimit: Math.max(0, Number(req.body.lowStockLimit || 5)),
            ...parseSizeStock(req.body),
            active: req.body.active !== "0"

        };

        if (req.file) {

            updateData.image = `uploads/${req.file.filename}`;

            // remove the old uploaded image file (if it was an upload, not a seed image)
            if (existing.image && existing.image.startsWith("uploads/")) {
                const oldPath = path.join(__dirname, "..", "public", "images", existing.image);
                fs.unlink(oldPath, () => {});
            }

        }

        await productCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        res.redirect("/product/manage?updated=1");

    });

});

router.get("/manage-orders", requireAdmin, (req, res) => {
    res.redirect("/admin/dashboard");
});

// DELETE A PRODUCT (removes DB entry + its uploaded image file)
router.post("/delete/:id", requireAdmin, async (req, res) => {

    const db = getDB();

    const productCollection = db.collection("products");

    const product = await productCollection.findOne({

        _id: new ObjectId(req.params.id)

    });

    if (product && product.image && product.image.startsWith("uploads/")) {

        const filePath = path.join(__dirname, "..", "public", "images", product.image);

        fs.unlink(filePath, () => {}); // ignore errors (file may already be gone)

    }

    await productCollection.deleteOne({

        _id: new ObjectId(req.params.id)

    });

    res.redirect("/product/manage?deleted=1");

});


// MANAGE CATEGORIES — LIST ALL + DELETE OPTION
router.get("/manage-categories", requireAdmin, async (req, res) => {

    const db = getDB();

    const categoryCollection = db.collection("categories");

    const categories = await categoryCollection.find({}).toArray();

    res.render("manage-categories", {

        categories: categories,
        deleted: req.query.deleted || null

    });

});

// DELETE A CATEGORY (removes DB entry + its uploaded image file)
router.post("/category/delete/:id", requireAdmin, async (req, res) => {

    const db = getDB();

    const categoryCollection = db.collection("categories");

    const category = await categoryCollection.findOne({

        _id: new ObjectId(req.params.id)

    });

    if (category && category.image && category.image.startsWith("uploads/")) {

        const filePath = path.join(__dirname, "..", "public", "images", category.image);

        fs.unlink(filePath, () => {});

    }

    await categoryCollection.deleteOne({

        _id: new ObjectId(req.params.id)

    });

    res.redirect("/product/manage-categories?deleted=1");

});




router.get("/cart", requireLogin, async (req, res) => {

    const db = getDB();

    const nav = await getNavData(db, req);

    const cartCollection = db.collection("cart");

    const cartItems = await cartCollection.find({

        userId: req.session.user._id

    }).toArray();

    res.render("cart", Object.assign({}, nav, {

        products: cartItems

    }));

});

router.post("/cart/add/:id", requireLogin, async (req, res) => {

    try {
        const db = getDB();
        const productCollection = db.collection("products");
        const cartCollection = db.collection("cart");

        const product = await productCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!product) return res.redirect("/product/home");

        const normalized = normalizeExistingSizes(product);
        const selectedSize = String(req.body.size || "").trim();

        if (normalized.sizes && normalized.sizes.length && !selectedSize) {
            return res.redirect("/product/view/" + product._id + "?sizeRequired=1");
        }

        if (selectedSize && !normalized.sizes.includes(selectedSize)) {
            return res.redirect("/product/view/" + product._id + "?sizeRequired=1");
        }

        if (selectedSize && normalized.sizeStock && Number(normalized.sizeStock[selectedSize] || 0) <= 0) {
            return res.redirect("/product/view/" + product._id + "?sizeUnavailable=1");
        }

        // Keep product + size as a separate cart line, so M and XL can coexist.
        const existing = await cartCollection.findOne({
            userId: req.session.user._id,
            productId: product._id,
            size: selectedSize
        });

        if (existing) {
            await cartCollection.updateOne(
                { _id: existing._id },
                { $inc: { quantity: 1 } }
            );
        } else {
            await cartCollection.insertOne({
                productId: product._id,
                title: product.title,
                price: product.price || 0,
                image: product.image,
                categoryId: product.categoryId,
                size: selectedSize,
                quantity: 1,
                userId: req.session.user._id,
                createdAt: new Date()
            });
        }

        const backPage = req.get("Referer") || "/product/home";
        res.redirect(backPage);
    } catch (err) {
        console.error("Cart add error:", err);
        res.status(500).send("Could not add product to cart.");
    }

});

// REMOVE PRODUCT FROM CART
router.post("/cart/delete/:id", requireLogin, async (req, res) => {

    const db = getDB();

    const cartCollection =
    db.collection("cart");

    await cartCollection.deleteOne({

        _id: new ObjectId(req.params.id),

        userId: req.session.user._id

    });

    res.redirect("/product/cart");

});


// GET CURRENT CART TOTAL (used by the checkout screen so the amount is always fresh/auto-calculated)
router.get("/cart/total", requireLogin, async (req, res) => {

    const db = getDB();

    const cartCollection = db.collection("cart");

    const cartItems = await cartCollection.find({
        userId: req.session.user._id
    }).toArray();

    const total = cartItems.reduce(function (sum, item) {
        return sum + ((item.price || 0) * Number(item.quantity || 1));
    }, 0);

    res.json({
        success: true,
        itemCount: cartItems.length,
        total: total
    });

});

// FAKE / TEST PAYMENT — simulates a payment gateway locally, no real account needed.
// Auto-sums the cart on the server (never trusts a client-sent amount), "charges" it,
// saves the order, and empties the cart.
router.post("/checkout/fake-pay", requireLogin, async (req, res) => {

    const db = getDB();

    const cartCollection = db.collection("cart");
    const orderCollection = db.collection("orders");

    const cartItems = await cartCollection.find({
        userId: req.session.user._id
    }).toArray();

    if (cartItems.length === 0) {
        return res.status(400).json({ success: false, message: "Your cart is empty." });
    }

    const totalRupees = cartItems.reduce(function (sum, item) {
        return sum + ((item.price || 0) * Number(item.quantity || 1));
    }, 0);

    if (totalRupees <= 0) {
        return res.status(400).json({ success: false, message: "One or more items in your cart don't have a price set yet. Add a price to these products first." });
    }

    const fakePaymentId = "TEST_PAY_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

    const orderResult = await orderCollection.insertOne({

        userId: req.session.user._id,
        items: cartItems,
        total: totalRupees,
        paymentMode: "test",
        paymentId: fakePaymentId,
        status: "paid (test mode)",
        createdAt: new Date()

    });

    await cartCollection.deleteMany({
        userId: req.session.user._id
    });

    const savedOrder = await orderCollection.findOne({ _id: orderResult.insertedId });
    if (req.session.user.phone && req.session.user.whatsappOptIn !== false) {
        sendWhatsAppText(req.session.user.phone, orderBillText(savedOrder, req.session.user))
            .catch(err => console.error("Automatic WhatsApp bill failed:", err));
    }

    res.json({
        success: true,
        redirect: "/product/order-success/" + orderResult.insertedId
    });

});



// CASH ON DELIVERY — create a pending order and clear the user's cart.
router.post("/checkout/cod", requireLogin, async (req, res) => {

    try {

        const db = getDB();

        const cartCollection = db.collection("cart");
        const orderCollection = db.collection("orders");

        const cartItems = await cartCollection.find({
            userId: req.session.user._id
        }).toArray();

        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            });
        }

        const totalRupees = cartItems.reduce(function (sum, item) {
            return sum + ((item.price || 0) * Number(item.quantity || 1));
        }, 0);

        if (totalRupees <= 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart total must be greater than ₹0."
            });
        }

        const orderResult = await orderCollection.insertOne({

            userId: req.session.user._id,
            items: cartItems,
            total: totalRupees,
            paymentMode: "cod",
            status: "pending",
            createdAt: new Date()

        });

        await cartCollection.deleteMany({
            userId: req.session.user._id
        });

        const savedOrder = await orderCollection.findOne({
            _id: orderResult.insertedId
        });

        if (req.session.user.phone && req.session.user.whatsappOptIn !== false) {
            sendWhatsAppText(
                req.session.user.phone,
                orderBillText(savedOrder, req.session.user)
            ).catch(err => console.error("Automatic WhatsApp COD bill failed:", err));
        }

        res.json({
            success: true,
            redirect: "/product/order-success/" + orderResult.insertedId
        });

    } catch (err) {

        console.error("COD order failed:", err);

        res.status(500).json({
            success: false,
            message: "Could not place the COD order. Please try again."
        });

    }

});


// CREATE A RAZORPAY ORDER FOR THE CURRENT USER'S CART
router.post("/checkout/create-order", requireLogin, async (req, res) => {

    if (!razorpay) {
        return res.status(500).json({ success: false, message: "Razorpay keys are not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env." });
    }

    const db = getDB();

    const cartCollection = db.collection("cart");

    const cartItems = await cartCollection.find({
        userId: req.session.user._id
    }).toArray();

    if (cartItems.length === 0) {
        return res.status(400).json({ success: false, message: "Your cart is empty." });
    }

    const totalRupees = cartItems.reduce(function (sum, item) {
        return sum + ((item.price || 0) * Number(item.quantity || 1));
    }, 0);

    if (totalRupees <= 0) {
        return res.status(400).json({ success: false, message: "One or more items in your cart don't have a price set yet. Please ask the store admin to add a price to these products before checkout." });
    }

    try {

        const order = await razorpay.orders.create({
            amount: Math.round(totalRupees * 100), // Razorpay expects amount in paise
            currency: "INR",
            receipt: "receipt_" + Date.now()
        });

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            name: req.session.user.name || "",
            email: req.session.user.email || ""
        });

    } catch (err) {

        console.error("Razorpay order creation failed:", err && err.error ? err.error : err);

        if (err && err.statusCode === 401) {
            return res.status(500).json({ success: false, message: "Payment gateway rejected the request — the Razorpay keys in .env look invalid. Get real TEST keys from dashboard.razorpay.com and update RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET." });
        }

        res.status(500).json({ success: false, message: "Could not start payment. Please try again." });

    }

});

// VERIFY PAYMENT SIGNATURE, SAVE THE ORDER, EMPTY THE CART
router.post("/checkout/verify", requireLogin, async (req, res) => {

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing payment details." });
    }

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    const db = getDB();

    const cartCollection = db.collection("cart");
    const orderCollection = db.collection("orders");

    const cartItems = await cartCollection.find({
        userId: req.session.user._id
    }).toArray();

    const totalRupees = cartItems.reduce(function (sum, item) {
        return sum + ((item.price || 0) * Number(item.quantity || 1));
    }, 0);

    const orderResult = await orderCollection.insertOne({

        userId: req.session.user._id,
        items: cartItems,
        total: totalRupees,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: "paid",
        createdAt: new Date()

    });

    await cartCollection.deleteMany({
        userId: req.session.user._id
    });

    const savedOrder = await orderCollection.findOne({ _id: orderResult.insertedId });
    if (req.session.user.phone && req.session.user.whatsappOptIn !== false) {
        sendWhatsAppText(req.session.user.phone, orderBillText(savedOrder, req.session.user))
            .catch(err => console.error("Automatic WhatsApp bill failed:", err));
    }

    res.json({
        success: true,
        redirect: "/product/order-success/" + orderResult.insertedId
    });

});

// ORDER SUCCESS / RECEIPT PAGE
router.get("/order-success/:id", requireLogin, async (req, res) => {

    const db = getDB();

    const nav = await getNavData(db, req);

    const orderCollection = db.collection("orders");

    let order;

    try {
        order = await orderCollection.findOne({
            _id: new ObjectId(req.params.id),
            userId: req.session.user._id
        });
    } catch (e) {
        order = null;
    }

    if (!order) {
        return res.redirect("/product/home");
    }

    res.render("order-success", Object.assign({}, nav, {
        order: order
    }));

});

module.exports = router;
