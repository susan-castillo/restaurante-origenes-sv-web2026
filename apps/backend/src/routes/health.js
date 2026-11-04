import { Router } from "express";

const router = Router();

router.get("/health", (request, response) => {
  response.json({ status: "ok" });
});

export default router;
