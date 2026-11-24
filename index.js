import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import connectDB from './database/dbConnection.js';
import { errorMiddleware } from './middlewares/error.js';
dotenv.config();
connectDB();

export const app = express();

//  origins from environment variables
const getOrigins = () => {
  const origins = [
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.trim();
    origins.push(frontendUrl);
    
    if (frontendUrl.endsWith('/')) {
      origins.push(frontendUrl.slice(0, -1));
    } else {
      origins.push(frontendUrl + '/');
    }
  }}

const allowedOrigins = getOrigins();

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
    } else {
        callback(new Error('Not allowed by CORS'));
    }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    expressHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours

}

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


app.use(errorMiddleware)

export default app;