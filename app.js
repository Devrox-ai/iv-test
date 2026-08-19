require("dotenv").config();

const express = require("express");

const path = require("path");

const session = require("express-session");

const { connectDB } = require("./config/db");

const productRouter =
require("./routes/product");

const userRoutes =
require("./routes/user");

const app = express();


// CONNECT DATABASE

connectDB();


// MIDDLEWARE

app.use(express.urlencoded({

    extended: true

}));

app.use(express.json());


// SESSION

app.use(session({

    secret: "mysecret",

    resave: false,

    saveUninitialized: true

}));


// STATIC FOLDER

app.use(express.static("public"));


// VIEW ENGINE

app.set("view engine", "ejs");


// ROUTES

// HOME PAGE OPENS DIRECTLY (NO LOGIN NEEDED)
app.get("/", (req, res) => {

    res.redirect("/product/home");

});

app.use("/product", productRouter);

app.use("/user", userRoutes);


// SERVER

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(

        `Server running on port ${PORT}`

    );

});