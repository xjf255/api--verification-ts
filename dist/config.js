import dotenv from 'dotenv';
dotenv.config();
const { DATABASE_URL: supabaseUrl = '', DB_API_KEY: supabaseKey = '', SALT_ROUND = 10 } = process.env;
export { supabaseUrl, supabaseKey, SALT_ROUND };
