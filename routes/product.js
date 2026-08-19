const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const router = express.Router();


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

    res.render("home", nav);

});

router.get("/category-form", (req, res) => {

    res.render("category-form");

});

router.post("/category/add", async (req, res) => {

    const db = getDB();

    const collection = db.collection("categories");

    await collection.insertOne({

        name: req.body.name,

        image: req.body.image

    });

    res.redirect("/product/category-form");

});

router.get("/product-form", async (req, res) => {

    const db = getDB();

    const collection = db.collection("categories");

    const data = await collection.find({}).toArray();

    res.render("product-form", {

        categories: data

    });

});

router.post("/add", async (req, res) => {

    const db = getDB();

    const collection =
    db.collection("products");

    await collection.insertOne({

        title: req.body.title,

        image: req.body.image,

        categoryId: req.body.categoryId

    });

    res.redirect("/product/product-form");

});



router.get("/category/:id", async (req, res) => {

    const db = getDB();

    const categoryCollection = db.collection("categories");

    // CATEGORY FIND
    const category = await categoryCollection.findOne({

        _id: new ObjectId(req.params.id)

    });

    if (!category) {

        return res.redirect("/product/home");

    }

    const nav = await getNavData(db, req);

    // PRODUCTS FILTERED FOR THIS CATEGORY
    const categoryProducts = nav.products.filter(

        p => p.categoryId == req.params.id

    );

    res.render("category-product", Object.assign({}, nav, {

        products: categoryProducts,

        categoryName: category.name,

        activeCategoryId: req.params.id

    }));

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



// router.post("/add", async (req, res) => {

//     const db = getDB();

//     const collection = db.collection("products");

//     await collection.insertOne({

//         title: req.body.title,
//         completed: false

//     });

//     res.redirect("/product");

// });


// router.post("/delete/:id", async (req, res) => {

//     const db = getDB();

//     const collection = db.collection("products");

//     await collection.deleteOne({

//         _id: new ObjectId(req.params.id)

//     });

//     res.redirect("/product");

// });


module.exports = router;
