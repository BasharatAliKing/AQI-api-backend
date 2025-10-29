import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cron from "node-cron";
import moment from "moment-timezone";

dotenv.config();
const app = express();
app.use(express.json());

// ======================
// MongoDB Connection
// ======================
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

// ======================
// Schema & Model
// ======================
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
    default: () => moment().tz("Asia/Karachi").toDate(), // 🇵🇰
  },
});

const AirQuality = mongoose.model("AirQuality", airQualitySchema);

// ======================
// Buffer for Incoming Sensor Data
// ======================
let readingsBuffer = [];

// Receive data every 10s from hardware — DO NOT save
app.post("/api/aqi", (req, res) => {
  const data = req.body.air_quality;
  if (data) {
    readingsBuffer.push(data); // store in buffer
  }
  res.status(200).json({ message: "📩 Reading received (buffered)" });
});

// Optional — check buffer size
app.get("/api/aqi/latest", (req, res) => {
  res.json({
    bufferCount: readingsBuffer.length,
    latest: readingsBuffer[readingsBuffer.length - 1] || null,
  });
});

// ======================
// Cron job — Every 30 minutes, average & save
// ======================
cron.schedule(
  "*/30 * * * *",
  async () => {
    if (readingsBuffer.length === 0) {
      console.log("⚠️ No data in buffer to save");
      return;
    }

    // --- Compute averages ---
    const fields = Object.keys(readingsBuffer[0]);
    const avgReading = {};

    for (const field of fields) {
      const values = readingsBuffer.map((r) => r[field]);
      avgReading[field] =
        values.reduce((sum, val) => sum + Number(val || 0), 0) /
        readingsBuffer.length;
    }

    const newRecord = new AirQuality({ air_quality: avgReading });
    await newRecord.save();

    console.log(
      `✅ 30-min avg saved at ${moment()
        .tz("Asia/Karachi")
        .format("YYYY-MM-DD HH:mm:ss")} (🇵🇰)`
    );

    // Clear buffer for next 30-min window
    readingsBuffer = [];
  },
  { scheduled: true, timezone: "Asia/Karachi" }
);

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (🇵🇰 Pakistan Time)`)
);
