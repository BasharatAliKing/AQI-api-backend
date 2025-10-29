import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cron from "node-cron";
import moment from "moment-timezone";

dotenv.config();
const app = express();
app.use(express.json()); // Parse incoming JSON

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
    default: () => moment().tz("Asia/Karachi").toDate(), // 🇵🇰 Pakistan time
  },
});

const AirQuality = mongoose.model("AirQuality", airQualitySchema);

// =========================
// Routes
// =========================

// 🟢 POST route — Save sensor data manually
app.post("/api/aqi", async (req, res) => {
  try {
    const data = req.body;
    const newRecord = new AirQuality(data);
    await newRecord.save();
    res
      .status(201)
      .json({ message: "✅ Data saved successfully", data: newRecord });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "❌ Error saving data", error: err.message });
  }
});

// 🔵 GET route — Fetch all records
app.get("/api/aqi", async (req, res) => {
  try {
    const allData = await AirQuality.find().sort({ createdAt: -1 });
    res.json(allData);
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Error fetching data", error: err.message });
  }
});

// =========================
// 🕒 Auto Submit Data Every 30 Minutes
// =========================

// Runs every 30 minutes (Asia/Karachi timezone)
cron.schedule(
  "*/30 * * * *",
  async () => {
    try {
      const dummyData = {
        air_quality: {
          temp: Math.random() * 10 + 20,
          hum: Math.random() * 10 + 60,
          co2: Math.random() * 10 + 400,
          co: Math.random() * 10 + 2,
          no2: Math.random() * 10 + 5,
          so2: Math.random() * 10 + 3,
          o3: Math.random() * 10 + 10,
          pm2_5: Math.random() * 10 + 20,
          pm10: Math.random() * 10 + 30,
          lat: 31.5204,
          lon: 74.3587,
        },
      };

      const newRecord = new AirQuality(dummyData);
      await newRecord.save();
      console.log(
        `🕒 Auto data saved at ${moment()
          .tz("Asia/Karachi")
          .format("YYYY-MM-DD HH:mm:ss")}`
      );
    } catch (err) {
      console.error("❌ Auto data save failed:", err.message);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Karachi",
  }
);

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (🇵🇰 Pakistan Time)`)
);
