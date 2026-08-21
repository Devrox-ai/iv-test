const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");

router.get("/chat", async (req, res) => {
    res.render("ai-chat", { shopName: process.env.SHOP_NAME || "Vastraa" });
});

router.post("/chat", async (req, res) => {
    try {
        const question = String(req.body.message || "").trim();
        if (!question) return res.status(400).json({ error: "Please ask something." });

        const db = getDB();
        const products = await db.collection("products").find({}).toArray();
        const categories = await db.collection("categories").find({}).toArray();

        const catalog = products.map(p => ({
            name: p.title,
            price: Number(p.price || 0),
            category: categories.find(c => String(c._id) === String(p.categoryId))?.name || "General"
        }));

        // If no API key is configured, still answer basic price/product queries from the store data.
        if (!process.env.OPENAI_API_KEY) {
            const q = question.toLowerCase();
            const under = q.match(/(?:under|below|less than|upto|up to)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
            let list = catalog;
            if (under) list = catalog.filter(p => p.price <= Number(under[1].replace(/,/g, "")));
            const words = q.split(/\s+/).filter(w => w.length > 2);
            if (!under && words.length) {
                const matched = catalog.filter(p => words.some(w => p.name.toLowerCase().includes(w)));
                if (matched.length) list = matched;
            }
            const answer = list.length
                ? list.slice(0, 8).map(p => `• ${p.name} — ₹${p.price.toLocaleString("en-IN")}`).join("\n")
                : "I couldn't find a matching product in the current store catalog.";
            return res.json({ answer });
        }

        const prompt = [
            `You are the shopping assistant for ${process.env.SHOP_NAME || "Vastraa"}.`,
            "Only use the catalog below for product names, prices, categories and availability.",
            "If a detail is not present, say you don't have that information and suggest contacting the store.",
            "For price filters such as under ₹2000, calculate from the catalog and list matching products.",
            "Answer in the same language/style as the customer (Hindi/Hinglish/English). Keep answers helpful and concise.",
            "",
            "CATALOG:",
            JSON.stringify(catalog),
            "",
            "CUSTOMER QUESTION:",
            question
        ].join("\n");

        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
                input: prompt,
                max_output_tokens: 500
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("OpenAI error:", data);
            return res.status(500).json({ error: "AI service is not available right now." });
        }

        res.json({ answer: data.output_text || "Sorry, I could not generate a response." });
    } catch (err) {
        console.error("AI chat error:", err);
        res.status(500).json({ error: "AI chat failed." });
    }
});

module.exports = router;
