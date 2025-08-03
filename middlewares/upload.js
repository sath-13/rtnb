import multer from "multer";
import fs from "fs";
import path from "path"; 

const uploadDir = "uploads/";

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const date = new Date().toISOString().split("T")[0];
        cb(null, date+ "-" + file.originalname); 
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) || fileExtension === '.docx') {
        cb(null, true); // Accept file
    } else {
        cb(new Error("Invalid file type. Allowed: PDF, DOC, DOCX, PPT, JPG, PNG, GIF, XLSX"));
    }
};

// Upload middleware for multiple files (max 5 files)
const upload = multer({ storage, fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }  // 10 MB limit
 });

export default upload;
