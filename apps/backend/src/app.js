import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import testRouter from "./routes/test.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900_000),
    limit: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use("/api", testRouter);

app.use((request, response) => {
  response.status(404).json({ error: "Not found" });
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;

  if (status === 500) {
    console.error(error);
  }

  response.status(status).json({
    error: status === 500 ? "Internal server error" : "Invalid request",
  });
});

export default app;
