const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");
const { sendWhatsAppText } = require("../services/whatsapp");

function cleanPhone(phone) {
    return String(phone || "").replace(/\D/g, "").slice(-15);
}

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

router.get("/login", (req, res) => {
    // If the current browser already has a valid session, there is no reason
    // to make the customer log in again.
    if (req.session.user) return res.redirect(req.query.next || "/product/home");

    res.render("auth", {
        step: "start",
        name: "",
        phone: "",
        next: req.query.next || "",
        error: req.query.error || null
    });
});

// Direct registration entry point for customers who do not have an account yet.
router.get("/register", (req, res) => {
    if (req.session.user) return res.redirect("/product/home");
    res.render("auth", {
        step: "register",
        name: "",
        phone: "",
        next: req.query.next || "",
        error: null
    });
});

router.post("/continue", async (req, res) => {
    try {
        const db = getDB();
        const phone = cleanPhone(req.body.phone);
        const next = String(req.body.next || "");

        if (phone.length < 10) {
            return res.render("auth", {
                step: "start",
                name: "",
                phone: req.body.phone || "",
                next,
                error: "Please enter a valid mobile number."
            });
        }

        const user = await db.collection("users").findOne({ phone });

        if (user) {
            return res.render("auth", {
                step: "password",
                name: user.name || "",
                phone,
                next,
                error: null
            });
        }

        return res.render("auth", {
            step: "register",
            name: "",
            phone,
            next,
            error: null
        });
    } catch (err) {
        console.error("Auth continue error:", err);
        res.status(500).send("Unable to continue.");
    }
});

router.post("/login", async (req, res) => {
    try {
        const db = getDB();
        const phone = cleanPhone(req.body.phone);
        const password = String(req.body.password || "");

        const user = await db.collection("users").findOne({ phone, password });

        if (!user) {
            return res.render("auth", {
                step: "password",
                name: req.body.name || "",
                phone,
                next: req.body.next || "",
                error: "Incorrect password. Please try again."
            });
        }

        req.session.user = user;
        res.redirect(req.body.next || "/product/home");
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Unable to login.");
    }
});

router.post("/register", async (req, res) => {
    try {
        const db = getDB();
        const name = String(req.body.name || "").trim();
        const phone = cleanPhone(req.body.phone);
        const password = String(req.body.password || "");
        const whatsappOptIn = req.body.whatsappOptIn === "on";

        if (!name || phone.length < 10 || password.length < 4) {
            return res.render("auth", {
                step: "register",
                name,
                phone,
                next: req.body.next || "",
                error: "Name, valid mobile number and a 4+ character password are required."
            });
        }

        const existing = await db.collection("users").findOne({ phone });
        if (existing) {
            return res.render("auth", {
                step: "password",
                name: existing.name || name,
                phone,
                next: req.body.next || "",
                error: "This mobile number is already registered. Please enter your password."
            });
        }

        const result = await db.collection("users").insertOne({
            name,
            phone,
            password,
            whatsappOptIn,
            createdAt: new Date()
        });

        const user = await db.collection("users").findOne({ _id: result.insertedId });
        req.session.user = user;
        res.redirect(req.body.next || "/product/home");
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).send("Unable to create account.");
    }
});

// FORGOT PASSWORD — STEP 1: ask for the registered mobile number
router.get("/forgot-password", (req, res) => {
    res.render("auth", {
        step: "forgot",
        name: "",
        phone: "",
        error: req.query.error || null
    });
});

// FORGOT PASSWORD — STEP 2: send a 6-digit OTP to that number on WhatsApp
router.post("/forgot-password/send-otp", async (req, res) => {
    try {
        const db = getDB();
        const phone = cleanPhone(req.body.phone);

        const user = await db.collection("users").findOne({ phone });
        if (!user) {
            return res.render("auth", {
                step: "forgot",
                name: "",
                phone: req.body.phone || "",
                error: "No account found with this mobile number."
            });
        }

        const otp = generateOtp();
        req.session.resetOtp = {
            phone,
            otp,
            expires: Date.now() + 10 * 60 * 1000 // 10 minutes
        };

        const result = await sendWhatsAppText(
            phone,
            `Your Vastraa password reset code is *${otp}*. It is valid for 10 minutes. Do not share this code with anyone.`
        );

        if (!result.ok) {
            console.error("Forgot-password OTP not sent:", result.reason || result.error);
            return res.render("auth", {
                step: "forgot",
                name: "",
                phone: req.body.phone || "",
                error: "Could not send the OTP on WhatsApp right now. Please contact the store, or try again later."
            });
        }

        res.render("auth", {
            step: "forgot-verify",
            name: user.name || "",
            phone,
            error: null
        });
    } catch (err) {
        console.error("Forgot-password send-otp error:", err);
        res.status(500).send("Unable to process this request right now.");
    }
});

// FORGOT PASSWORD — STEP 3: verify the OTP and set a new password
router.post("/forgot-password/reset", async (req, res) => {
    try {
        const db = getDB();
        const phone = cleanPhone(req.body.phone);
        const otp = String(req.body.otp || "").trim();
        const newPassword = String(req.body.password || "");

        const saved = req.session.resetOtp;

        if (!saved || saved.phone !== phone || Date.now() > saved.expires) {
            return res.render("auth", {
                step: "forgot",
                name: "",
                phone,
                error: "This code has expired. Please request a new one."
            });
        }

        if (saved.otp !== otp) {
            return res.render("auth", {
                step: "forgot-verify",
                name: "",
                phone,
                error: "Incorrect code. Please check WhatsApp and try again."
            });
        }

        if (newPassword.length < 4) {
            return res.render("auth", {
                step: "forgot-verify",
                name: "",
                phone,
                error: "Password must be at least 4 characters."
            });
        }

        await db.collection("users").updateOne({ phone }, { $set: { password: newPassword } });
        delete req.session.resetOtp;

        const user = await db.collection("users").findOne({ phone });
        req.session.user = user;
        res.redirect("/product/home");
    } catch (err) {
        console.error("Forgot-password reset error:", err);
        res.status(500).send("Unable to reset password right now.");
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/product/home"));
});

module.exports = router;
