import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// =========================
// MongoDB Connection
// =========================
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://<username>:<password>@cluster0.mongodb.net/aqiDB";

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
// Time + Buffer setup
// =========================
let lastSavedTime = null;
let latestData = null;

// Helper function to get current Pakistan Standard Time
function getPakistanTime() {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const pst = new Date(utc + 5 * 60 * 60 * 1000); // UTC+5 for Pakistan
  return pst;
}

// =========================
// Routes
// =========================

// 🟢 POST route — Receive sensor data every 10 seconds
app.post("/api/aqi", async (req, res) => {
  try {
    latestData = req.body; // store the most recent reading
    const now = new Date();

    // If never saved before, or 30 minutes have passed since last save
    if (!lastSavedTime || now - lastSavedTime >= 30 * 60 * 1000) {
      lastSavedTime = now;

      // Set Pakistan Time for createdAt
      const pakistanTime = getPakistanTime();

      const newRecord = new AirQuality({
        ...latestData,
        createdAt: pakistanTime,
      });

      await newRecord.save();
      console.log(`✅ Saved AQI data at ${pakistanTime.toLocaleString("en-PK")}`);
    }

    res.status(200).json({ message: "✅ Data received (may or may not be saved yet)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Error processing data", error: err.message });
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
