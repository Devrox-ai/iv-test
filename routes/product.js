const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const upload = require("../middleware/upload");

const router = express.Router();


// =========================
// PRODUCT HOME
// =========================

router.get("/home", async (req, res) => {

    const db = getDB();

    const products = await db
        .collection("products")
        .find({})
        .toArray();

    const categories = await db
        .collection("categories")
        .find({})
        .toArray();

    res.render("home", {
        products,
        categories
    });

});


// =========================
// CATEGORY FORM
// =========================

router.get("/category-form", (req, res) => {

    res.render("category-form", {
        error: req.query.error || null,
        added: req.query.added || null
    });

});


// =========================
// ADD CATEGORY
// =========================

router.post("/category/add", (req, res) => {

    upload.single("image")(req, res, async function (err) {

        if (err) {

            return res.redirect(
                "/product/category-form?error=" +
                encodeURIComponent(err.message)
            );

        }

        try {

            const db = getDB();

            await db.collection("categories").insertOne({

                name: req.body.name,

                image: req.file
                    ? `uploads/${req.file.filename}`
                    : ""

            });

            res.redirect("/product/category-form?added=1");

        } catch (error) {

            console.log(error);

            res.redirect(
                "/product/category-form?error=" +
                encodeURIComponent("Category add nahi hui")
            );

        }

    });

});


// =========================
// PRODUCT FORM
// =========================

router.get("/product-form", async (req, res) => {

    try {

        const db = getDB();

        const categories = await db
            .collection("categories")
            .find({})
            .toArray();

        res.render("product-form", {

            categories,

            error: req.query.error || null,

            added: req.query.added || null

        });

    } catch (error) {

        console.log(error);

        res.render("product-form", {

            categories: [],

            error: "Categories load nahi hui",

            added: null

        });

    }

});


// =========================
// ADD PRODUCT
// =========================

router.post("/add", (req, res) => {

    upload.single("image")(req, res, async function (err) {

        if (err) {

            return res.redirect(
                "/product/product-form?error=" +
                encodeURIComponent(err.message)
            );

        }

        try {

            const db = getDB();

            await db.collection("products").insertOne({

                title: req.body.title,

                categoryId: req.body.categoryId,

                image: req.file
                    ? `uploads/${req.file.filename}`
                    : ""

            });

            res.redirect("/product/product-form?added=1");

        } catch (error) {

            console.log(error);

            res.redirect(
                "/product/product-form?error=" +
                encodeURIComponent("Product add nahi hua")
            );

        }

    });

});


// =========================
// MANAGE PRODUCTS
// =========================

router.get("/manage", async (req, res) => {

    const db = getDB();

    const products = await db
        .collection("products")
        .find({})
        .toArray();

    const categories = await db
        .collection("categories")
        .find({})
        .toArray();

    const categoryMap = {};

    categories.forEach(category => {

        categoryMap[category._id.toString()] =
            category.name;

    });

    res.render("manage-products", {

        products,

        categoryMap,

        deleted: req.query.deleted || null

    });

});


// =========================
// DELETE PRODUCT
// =========================

router.post("/delete/:id", async (req, res) => {

    try {

        const db = getDB();

        await db.collection("products").deleteOne({

            _id: new ObjectId(req.params.id)

        });

        res.redirect("/product/manage?deleted=1");

    } catch (error) {

        console.log(error);

        res.redirect("/product/manage");

    }

});


// =========================
// MANAGE CATEGORIES
// =========================

router.get("/manage-categories", async (req, res) => {

    const db = getDB();

    const categories = await db
        .collection("categories")
        .find({})
        .toArray();

    res.render("manage-categories", {

        categories,

        deleted: req.query.deleted || null

    });

});


// =========================
// DELETE CATEGORY
// =========================

router.post("/category/delete/:id", async (req, res) => {

    try {

        const db = getDB();

        await db.collection("categories").deleteOne({

            _id: new ObjectId(req.params.id)

        });

        res.redirect("/product/manage-categories?deleted=1");

    } catch (error) {

        console.log(error);

        res.redirect("/product/manage-categories");

    }

});


module.exports = router;