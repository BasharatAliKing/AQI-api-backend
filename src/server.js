import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
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
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// =========================
// Schema & Model
// =========================
const airQualitySchema = new mongoose.Schema({
  project_name: {
    type: String,
    required: true,
    trim: true,
  },
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
    type: String,
    default: () => moment().tz("Asia/Karachi").format("YYYY-MM-DD HH:mm:ss"),
  },
});

const AirQuality = mongoose.model("AirQuality", airQualitySchema);

// =========================
// Routes
// =========================

// 🟢 POST route — Save sensor data
app.post("/api/aqi", async (req, res) => {
  try {
    const { project_name, air_quality } = req.body;
    if (!project_name || !air_quality) {
      return res.status(400).json({
        message: "❌ project_name and air_quality are required",
      });
    }

    const newRecord = new AirQuality({ project_name, air_quality });
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

// 🔵 GET route — Fetch all records, optionally filtered by project
app.get("/api/aqi", async (req, res) => {
  try {
    const { project_name } = req.query;
    const filter = project_name ? { project_name } : {};
    const allData = await AirQuality.find(filter).sort({ createdAt: -1 });

    const formattedData = allData.map((item) => ({
      ...item.toObject(),
      createdAt: moment(item.createdAt)
        .tz("Asia/Karachi")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.json(formattedData);
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Error fetching data", error: err.message });
  }
});

// 🟡 GET route — List distinct projects
app.get("/api/aqi/projects", async (req, res) => {
  try {
    const projects = await AirQuality.distinct("project_name");
    res.json({ projects });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Error fetching project list", error: err.message });
  } 
});
// 🟣 UPDATE — Update one record by ID
app.put("/api/aqi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await AirQuality.findByIdAndUpdate(id, req.body, {
      new: true, // return updated doc
      runValidators: true,
    });
    if (!updated)
      return res.status(404).json({ message: "❌ Record not found" });
    res.json({ message: "✅ Data updated successfully", data: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Error updating data", error: err.message });
  }
});

// 🔴 DELETE — Remove one record by ID
app.delete("/api/aqi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AirQuality.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "❌ Record not found" });
    res.json({ message: "🗑️ Record deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Error deleting data", error: err.message });
  }
});

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
