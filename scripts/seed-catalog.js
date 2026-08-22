require("dotenv").config();
const { MongoClient } = require("mongodb");
const { seedCatalog } = require("../services/seedCatalog");

const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_DATABASE}.jrs1tu5.mongodb.net/?appName=${process.env.MONGO_DATABASE}`;

async function main() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db("todoDB");
        const result = await seedCatalog(db);
        console.log(`Catalog ready. Added: ${result.added}, skipped existing: ${result.skipped}, total checked: ${result.total}`);
    } finally {
        await client.close();
    }
}

main().catch(err => {
    console.error("Catalog seed failed:", err);
    process.exit(1);
});
