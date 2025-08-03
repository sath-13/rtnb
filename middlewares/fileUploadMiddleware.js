import multer from 'multer';
import { ImportProjectMessages } from '../constants/enums.js';

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error(ImportProjectMessages.INVALID_FILE_TYPE), false);
        }
    }
}).single('file');

export default upload;
