const express = require("express");

const router = express.Router();

const { getDB } = require("../config/db");

router.get("/register", (req, res) => {

    res.render("register");

});

router.post("/register", async (req, res) => {

    const db = getDB();

    const collection =
    db.collection("users");

    await collection.insertOne({

        name: req.body.name,

        password: req.body.password

    });

    res.redirect("/user/login");

});

router.get("/login", (req, res) => {

    res.render("login");

});

router.post("/login", async (req, res) => {

    const db = getDB();

    const collection =
    db.collection("users");

    const user =
    await collection.findOne({

        name: req.body.name,

        password: req.body.password

    });

    if(user){

        req.session.user = user;

        res.redirect("/product/home");

    }else{

        res.send("Invalid User");

    }

});

router.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/product/home");

    });

});

module.exports = router;