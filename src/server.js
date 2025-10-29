import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cron from "node-cron";
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
    default: () => moment().tz("Asia/Karachi").toDate(),
  },
});

const AirQuality = mongoose.model("AirQuality", airQualitySchema);

// =========================
// Store Latest Sensor Data in Memory
// =========================
let latestReading = null;

// 🟢 POST route — Receives data from sensor every 10s
app.post("/api/aqi", (req, res) => {
  latestReading = req.body; // Store latest data only
  res.status(200).json({ message: "📩 Data received (not saved yet)" });
});

// 🔵 GET route — Check current buffered data
app.get("/api/aqi/latest", (req, res) => {
  if (!latestReading) return res.json({ message: "No data received yet" });
  res.json({ latestReading });
});

// =========================
// 🕒 Auto-save every 30 minutes
// =========================
cron.schedule(
  "*/30 * * * *",
  async () => {
    if (latestReading) {
      try {
        const record = new AirQuality(latestReading);
        await record.save();
        console.log(
          `✅ Saved latest reading at ${moment()
            .tz("Asia/Karachi")
            .format("YYYY-MM-DD HH:mm:ss")}`
        );
      } catch (err) {
        console.error("❌ Error saving data:", err.message);
      }
    } else {
      console.log("⚠️ No data available to save yet");
    }
  },
  { scheduled: true, timezone: "Asia/Karachi" }
);

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (🇵🇰 Pakistan Time)`)
);
