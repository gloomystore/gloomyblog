import mysql from 'mysql2/promise';

const nodeEnv = process.env.NODE_ENV;
const host = process.env.NEXT_PUBLIC_DB_HOST;
const user = process.env.NEXT_PUBLIC_DB_USER;
const password = process.env.NEXT_PUBLIC_DB_PASSWORD;
const database = process.env.NEXT_PUBLIC_DB;
const port = process.env.NEXT_PUBLIC_DB_PORT;

const config = {
  host,
  user,
  password,
  database,
  port: port ? parseInt(port) : undefined,
};

if (!(nodeEnv === 'development' || nodeEnv === 'test' || nodeEnv === 'production') || !host || !user || !password || !database || !port) {
  throw new Error('One or more required environment variables are missing or nodeEnv is unsupported. nodeEnv : ' + nodeEnv + '\nhost: ' + host + '\nuser: ' + user + '\npassword: ' + password);
}

const pool = mysql.createPool(config);

export default pool;