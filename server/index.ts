process.on("uncaughtException", (err) => {
  console.error("FATAL UNCAUGHT EXCEPTION:");
  console.error(err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("FATAL UNHANDLED REJECTION at:", promise, "reason:", reason);
  process.exit(1);
});

import "dotenv/config";
import { env } from "./env";

import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { Server as SocketServer } from "socket.io";
import { serveStatic } from "./static";
import fs from "fs";
import { createServer } from "http";
import { setupChatServer } from "./chat";

const app = express();
const httpServer = createServer(app);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for dev flexibility, can be tightened in prod
}));

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use("/api", apiLimiter);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: env.NODE_ENV,
  });
});


declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

const runServer = async () => {
  try {
    console.log("Starting server initialization...");
    const { initializeDatabase } = await import("./db");
    await initializeDatabase();

    console.log("Registering routes...");

    await registerRoutes(httpServer, app);
    console.log("Routes registered successfully.");

    setupChatServer(httpServer);
    console.log("Chat WebSocket server initialized.");

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Internal Server Error:", err);

      if (res.headersSent) {
        return next(err);
      }

      return res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(env.PORT, 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`serving on port ${port}`);
      },
    );

  } catch (error) {
    console.error("CRITICAL ERROR DURING SERVER INITIALIZATION:");
    console.error(error);
    process.exit(1);
  }
};

runServer();
