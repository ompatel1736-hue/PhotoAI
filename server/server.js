require("dotenv").config();
const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

const allowedSizes = new Set(["1024x1024", "1024x1536", "1536x1024"]);
const allowedQualities = new Set(["low", "medium", "high"]);
const allowedStyles = new Set([
  "Photorealistic", "Anime", "3D render", "Cinematic", "Watercolor", "Fantasy art"
]);

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "PhotoAI" }));

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, style, size, quality } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Please enter an image prompt." });
    }
    if (prompt.length > 2000) {
      return res.status(400).json({ error: "Prompt must be 2,000 characters or fewer." });
    }

    const chosenStyle = allowedStyles.has(style) ? style : "Photorealistic";
    const chosenSize = allowedSizes.has(size) ? size : "1024x1024";
    const chosenQuality = allowedQualities.has(quality) ? quality : "medium";
    const finalPrompt = `${prompt.trim()}. Visual style: ${chosenStyle}. Create one original, polished image.`;

    const result = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
      prompt: finalPrompt,
      size: chosenSize,
      quality: chosenQuality,
      n: 1
    });

    const image = result.data && result.data[0] && result.data[0].b64_json;
    if (!image) throw new Error("The image service returned no image.");
    res.json({ success: true, image });
  } catch (error) {
    console.error("PhotoAI generation error:", error.message);
    const status = error.status === 429 ? 429 : 500;
    res.status(status).json({
      error: status === 429
        ? "The image service is busy or the API quota is unavailable. Please try again later."
        : "Image generation failed. Check the server API key, model access, and billing."
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`PhotoAI running on port ${port}`);
});
