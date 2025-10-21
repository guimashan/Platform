import express, { type Express } from "express";
import { mountRoutes } from "./routes";

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 掛載 API 路由
const httpServer = mountRoutes(app);

// 端口處理（自動遞增找可用端口）
let PORT = process.env.PORT ? parseInt(process.env.PORT) : 5173;

function startServer(port: number): void {
  httpServer
    .listen(port, "0.0.0.0", () => {
      console.log(`✅ Server running on http://0.0.0.0:${port}`);
    })
    .on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error("❌ Server error:", err);
        process.exit(1);
      }
    });
}

startServer(PORT);
