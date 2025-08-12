import express from "express";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";
import Redis from "ioredis";
import dotenv from "dotenv";
import Prediction from "./models/Prediction.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/stocks";
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://ml-service:8000";
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error", err));

const redis = new Redis(REDIS_URL);

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Basic route: check cache -> call ML service -> save to mongo -> cache
app.post("/api/predict", async (req, res) => {
  const { symbol, start, end } = req.body;
  if (!symbol || !start || !end) return res.status(400).json({ error: "symbol, start, end required" });

  const cacheKey = `${symbol}:${start}:${end}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // call ML service
    const mlResp = await axios.post(`${ML_SERVICE_URL}/predict`, { symbol, start, end });
    const data = mlResp.data;

    // store DB
    await Prediction.create({ symbol, start, end, data: data.results });

    // cache
    await redis.set(cacheKey, JSON.stringify(data), "EX", 3600);

    return res.json(data);
  } catch (err) {
    console.error(err.message || err);
    if (err.response?.data) return res.status(err.response.status || 500).json(err.response.data);
    res.status(500).json({ error: "Prediction failed", details: err.message });
  }
});

// Endpoint to list recent predictions from Mongo
app.get("/api/predictions", async (req, res) => {
  try {
    const docs = await Prediction.find().sort({ createdAt: -1 }).limit(20);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Gateway listening on ${PORT}`));
