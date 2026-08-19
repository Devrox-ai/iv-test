// const { getDB } = require("../config/db");


// async function addProduct(req, res) {

//     const db = getDB();

//     const collection = db.collection("products");

//     await collection.insertOne({

//         title: req.body.title,
//         completed: false

//     });

//     res.redirect("/product");

// }


// async function showForm(req, res) {

//     const db = getDB();

//     const collection = db.collection("products");

//     const data = await collection.find({}).toArray();

//     res.render("index", {

//         todos: data

//     });

// }

// module.exports = {

//     addProduct,
//     showForm

// };