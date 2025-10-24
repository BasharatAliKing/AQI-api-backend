import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json()); // Parse incoming JSON

// =========================
// MongoDB Connection
// =========================
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://<username>:<password>@cluster0.mongodb.net/aqiDB";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// =========================
// Schema & Model
// =========================
const airQualitySchema = new mongoose.Schema({
  air_quality: {
    temp: Number,
    hum: Number,
    co2: Number,
    co: Number,
    no2: Number,
    so2: Number,
    o3: Number,
    pm2_5: Number,
    pm10: Number,
    lat: Number,
    lon: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AirQuality = mongoose.model("AirQuality", airQualitySchema);

// =========================
// Routes
// =========================

// 🟢 POST route — Save sensor data
app.post("/api/aqi", async (req, res) => {
  try {
    const data = req.body;
    const newRecord = new AirQuality(data);
    await newRecord.save();
    res.status(201).json({ message: "✅ Data saved successfully", data: newRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Error saving data", error: err.message });
  }
});

// 🔵 GET route — Fetch all records
app.get("/api/aqi", async (req, res) => {
  try {
    const allData = await AirQuality.find().sort({ createdAt: -1 });
    res.json(allData);
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching data", error: err.message });
  }
});

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
