import dotenv from 'dotenv';
dotenv.config();
const { DATABASE_URL: supabaseUrl = '', DB_API_KEY: supabaseKey = '', SECRET_KEY, CLOUDINARY_API_NAME: CLOUD_NAME, CLOUDINARY_API_KEY: CLOUD_KEY, CLOUDINARY_API_SECRET: CLOUD_SECRET, MAIL, MAIL_PASSWORD, SMS, SMS_SECRET } = process.env;
const SALT_ROUND = Number(process.env.SALT_ROUND) || 10;
export { supabaseUrl, supabaseKey, SALT_ROUND, SECRET_KEY, CLOUD_NAME, CLOUD_KEY, CLOUD_SECRET, MAIL, MAIL_PASSWORD, SMS, SMS_SECRET };
