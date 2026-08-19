const multer = require("multer");
const path = require("path");
const fs = require("fs");

// FOLDER WHERE UPLOADED IMAGES ARE SAVED
const uploadDir = path.join(__dirname, "..", "public", "images", "uploads");

// MAKE SURE THE FOLDER EXISTS
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {

        // CLEAN, UNIQUE FILE NAME: timestamp-original-name.ext
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBase = path
            .basename(file.originalname, ext)
            .replace(/[^a-z0-9]/gi, "-")
            .toLowerCase()
            .slice(0, 40);

        cb(null, `${Date.now()}-${safeBase}${ext}`);
    }

});

function fileFilter(req, file, cb) {

    const allowed = /jpeg|jpg|png|webp|gif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);

    if (extOk && mimeOk) {
        return cb(null, true);
    }

    cb(new Error("Only image files (jpg, jpeg, png, webp, gif) are allowed"));
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

module.exports = upload;
