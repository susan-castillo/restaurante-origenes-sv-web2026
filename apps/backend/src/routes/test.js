import { Router } from "express";

const router = Router();

router.get("/test", (request, response) => {
  response.json({ status: "ok" });
});

export default router;
