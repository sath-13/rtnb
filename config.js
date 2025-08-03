import dotEnv from "dotenv";
import path from 'path';
    // path: path.resolve(`${process.cwd()}`, `.env.${process.env.NODE_ENV}`),
import 'dotenv/config';
dotEnv.config({

    path: path.resolve(`${process.cwd()}`, `.env.${process.env.NODE_ENV}`),
});
const config = {
	NODE_ENV: process.env.NODE_ENV || 'dev',
    PORT: process.env.PORT || 8011,
    BACKEND_API_URL: process.env.BACKEND_API_URL,
    MONGO_URI: process.env.MONGO_URI || '',
    JWT_LIFETIME: process.env.JWT_LIFETIME || 90,
    JWT_SECRET: process.env.JWT_SECRET,
    CLIENT_URL: process.env.CLIENT_URL,
    MONGODB_NAME: process.env.MONGODB_NAME,
    GOOGLE_CREDENTIALS_PATH: process.env.GOOGLE_CREDENTIALS_PATH,
    SYNC_DVDS_DOC_AUTOMATION_CRON: process.env.SYNC_DVDS_DOC_AUTOMATION_CRON || 'false',
    SYNC_DVDS_DOC_AUTOMATION_CRON_TIME: process.env.SYNC_DVDS_DOC_AUTOMATION_CRON_TIME || '0 7 * * *',
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
}

export default config;
