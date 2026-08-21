const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { sendWhatsAppText, orderBillText } = require("../services/whatsapp");
const router = express.Router();

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
        related: related

    }));

});

router.get("/category-form", (req, res) => {

    res.render("category-form", {

        error: req.query.error || null,
        added: req.query.added || null

    });

});

// ADD CATEGORY (WITH REAL IMAGE UPLOAD)
router.post("/category/add", (req, res) => {

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

router.get("/product-form", async (req, res) => {

    const db = getDB();

    const collection = db.collection("categories");

    const data = await collection.find({}).toArray();

    res.render("product-form", {

        categories: data,

        error: req.query.error || null,
        added: req.query.added || null

    });

});

// ADD PRODUCT (WITH REAL IMAGE UPLOAD)
router.post("/add", (req, res) => {

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

            categoryId: req.body.categoryId

        });

        res.redirect("/product/product-form?added=1");

    });

});


// EDIT PRODUCT FORM
router.get("/edit/:id", async (req, res) => {

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

        product: product,
        categories: categories,
        error: req.query.error || null

    });

});

// UPDATE PRODUCT (price, title, category, and optionally a new image)
router.post("/update/:id", (req, res) => {

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
            categoryId: req.body.categoryId

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

router.get("/manage-orders", (req, res) => {
    res.redirect("/admin/dashboard");
});

// DELETE A PRODUCT (removes DB entry + its uploaded image file)
router.post("/delete/:id", async (req, res) => {

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
router.get("/manage-categories", async (req, res) => {

    const db = getDB();

    const categoryCollection = db.collection("categories");

    const categories = await categoryCollection.find({}).toArray();

    res.render("manage-categories", {

        categories: categories,
        deleted: req.query.deleted || null

    });

});

// DELETE A CATEGORY (removes DB entry + its uploaded image file)
router.post("/category/delete/:id", async (req, res) => {

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

    const db = getDB();

    const productCollection =
    db.collection("products");

    const cartCollection =
    db.collection("cart");

    const product =
    await productCollection.findOne({

        _id: new ObjectId(req.params.id)

    });

    await cartCollection.insertOne({

    title: product.title,

    price: product.price || 0,

    image: product.image,

    categoryId: product.categoryId,

    userId: req.session.user._id

});

    res.redirect("/product/cart");

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
        return sum + (item.price || 0);
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
        return sum + (item.price || 0);
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
        return sum + (item.price || 0);
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
        return sum + (item.price || 0);
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
