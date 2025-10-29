import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import moment from "moment-timezone";

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
    default: () => moment().tz("Asia/Karachi").toDate(), // 🇵🇰 Timezone
  },
});

const AirQuality = mongoose.model("AirQuality", airQualitySchema);

// =========================
// Store last saved time
// =========================
let lastSavedTime = null; // will store Date when last record was saved

// =========================
// Routes
// =========================

// 🟢 POST route — Save sensor data every 30 minutes
app.post("/api/aqi", async (req, res) => {
  try {
    const currentTime = moment().tz("Asia/Karachi"); // current time in PKT

    // If we have a saved time, check time difference
    if (lastSavedTime) {
      const diffMinutes = currentTime.diff(lastSavedTime, "minutes");

      // If less than 30 minutes passed → reject new save
      if (diffMinutes < 30) {
        return res.status(429).json({
          message: `❌ Please wait ${
            30 - diffMinutes
          } more minutes before next submission.`,
          nextAllowedAt: lastSavedTime.add(30, "minutes").format("YYYY-MM-DD HH:mm:ss"),
        });
      }
    }

    // Save new data
    const newRecord = new AirQuality(req.body);
    await newRecord.save();

    // Update last saved time
    lastSavedTime = currentTime;

    res.status(201).json({
      message: "✅ Data saved successfully",
      savedAt: currentTime.format("YYYY-MM-DD HH:mm:ss"),
      data: newRecord,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "❌ Error saving data",
      error: err.message,
    });
  }
});

// 🔵 GET route — Fetch all records
app.get("/api/aqi", async (req, res) => {
  try {
    const allData = await AirQuality.find().sort({ createdAt: -1 });
    res.json(allData);
  } catch (err) {
    res.status(500).json({
      message: "❌ Error fetching data",
      error: err.message,
    });
  }
});

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (🇵🇰 Pakistan Standard Time)`)
);
