// senseiRoutes.js
import express from "express";
import { analyzeCreativePerformance, analyzeOffer, analyzeHooks } from "./sensei-api.js";

const router = express.Router();

/**
 * HEALTH CHECK
 * Wird vom Frontend genutzt, um schnell festzustellen,
 * ob der Sensei-Service überhaupt erreichbar ist.
 */
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "sensei-module-active" });
});

/**
 * MAIN ANALYSIS ENDPOINT
 * Das Frontend sendet:
 * {
 *   creatives: [...],
 *   campaigns: [...],
 *   settings: {...}
 * }
 */
router.post("/analyze", async (req, res) => {
  try {
    const { creatives, campaigns, settings } = req.body;

    if (!creatives || !Array.isArray(creatives)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid creatives array"
      });
    }

    // Sensei Core Analysis (Regelbasiert + Light KI)
    const performance = analyzeCreativePerformance(creatives);
    const offer = analyzeOffer(campaigns || []);
    const hook = analyzeHooks(creatives);

    return res.json({
      success: true,
      performance,
      offer,
      hook,
      recommendations: [
        ...performance.recommendations,
        ...hook.recommendations,
        ...offer.recommendations
      ]
    });

  } catch (err) {
    console.error("Sensei analyze error:", err);
    return res.status(500).json({
      success: false,
      error: "Sensei processing failed",
      details: err.message
    });
  }
});

export default router;
