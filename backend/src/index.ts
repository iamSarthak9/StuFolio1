// StuFolio Backend API - Build Trigger (Feb 24)
import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import studentRoutes from "./routes/students";
import mentorRoutes from "./routes/mentor";
import leaderboardRoutes from "./routes/leaderboard";
import eventRoutes from "./routes/events";
import notificationRoutes from "./routes/notifications";
import analysisRoutes from "./routes/analysis";
import chatRoutes from "./routes/chat";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:5173",
    process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", version: "v1.0.1", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/chat", chatRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`\n StuFolio API running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
