const { MongoClient } = require("mongodb");

const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_DATABASE}.jrs1tu5.mongodb.net/?appName=${process.env.MONGO_DATABASE}`;
//process.env.MONGO_URI;

const client = new MongoClient(uri);

let db;
async function connectDB() {
    try {

        console.log(uri);

        await client.connect();

        console.log("MongoDB Connected");

        db = client.db("todoDB");
        // db2 = client.db2("cotegary")

    } catch (err) {
        console.error("MongoDB connection FAILED:", err.message);
        console.error("Check your .env values (MONGO_USERNAME, MONGO_PASSWORD, MONGO_DATABASE) and your Atlas Network Access (IP whitelist).");
        process.exit(1); // stop the server instead of letting every route fail silently
    }
}

function getDB() {
    return db;
}

module.exports = { connectDB, getDB };
