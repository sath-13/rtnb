import StatusCodes from 'http-status-codes';
import upload from '../middlewares/fileUploadMiddleware.js';
import { BadRequest, InternalServer } from '../middlewares/customError.js';
import { ImportProjectMessages } from '../constants/enums.js';
import { parseExcelFile } from '../utils/excelParser.js';
import { importProjects } from '../service/importProjects.service.js';

export const importExcelData = async (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) return next(BadRequest(err.message));
        if (!req.file) return next(BadRequest(ImportProjectMessages.NO_FILE_UPLOADED));

        try {
            const jsonDataArray = parseExcelFile(req.file.buffer);
            const results = await importProjects(jsonDataArray);
            res.status(StatusCodes.OK).json({ message: ImportProjectMessages.IMPORT_COMPLETED, results });
        } catch (error) {
            next(InternalServer(ImportProjectMessages.ERROR_DURING_IMPORT));
        }
    });
};




