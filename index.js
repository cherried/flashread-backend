import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/summarize", async (req, res) => {
  try {
    const { text, lengthSetting = "Medium", formatSetting = "Bullets" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No text provided" });
    }

    const originalWordCount = text.trim().split(/\s+/).filter(Boolean).length;

    let targetLength;
    if (lengthSetting === "Short") targetLength = "1–3 bullet points";
    else if (lengthSetting === "Detailed") targetLength = "7–10 bullet points";
    else targetLength = "4–6 bullet points";

    const formatInstruction =
      formatSetting === "Bullets"
        ? "Return the summary as concise bullet points."
        : "Return the summary as 1–3 short paragraphs.";

    const messages = [
      {
        role: "system",
        content:
          "You are a professional summarization engine. You provide clean, neutral, concise summaries with no fluff or opinions."
      },
      {
        role: "user",
        content: `
Summarize the following content:

Requirements:
- Respect this length: ${targetLength}
- ${formatInstruction}
- No meta commentary or extra explanation

Text:
"""${text}"""
        `
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.2,
    });

    const summaryText = completion.choices[0].message.content.trim();
    const summaryWordCount = summaryText.split(/\s+/).filter(Boolean).length;

    res.json({
      summaryText,
      originalWordCount,
      summaryWordCount,
    });
  } catch (err) {
    console.error("Error generating summary:", err);
    res.status(500).json({ error: "Summarization failed" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FlashRead backend running on port ${PORT}`));
