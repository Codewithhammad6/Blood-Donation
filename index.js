import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import connectDB from './database/dbConnection.js';
import { errorMiddleware } from './middlewares/error.js';
import userRoutes from './routes/userRoute.js';
import bloodRequestRoutes from './routes/bloodRequestRoutes.js';

dotenv.config();
connectDB();

export const app = express();

const getOrigins = () => {
  const origins = [
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, "");
    origins.push(frontendUrl);
  }

  return origins;
};

const allowedOrigins = getOrigins();


const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

app.use(cors(corsOptions));

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



app.get('/api/health', (req, res) => {
 res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
 })
});

app.use('/api/user', userRoutes);
app.use('/api/blood', bloodRequestRoutes);


app.use(errorMiddleware)

export default app;