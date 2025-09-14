import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "nflfantasy"
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10)
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
};
