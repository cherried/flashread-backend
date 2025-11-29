app.post("/summarize", async (req, res) => {
  try {
    const {
      text,
      lengthSetting = "Medium",
      formatSetting = "Bullets",
    } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No text provided" });
    }

    const cleanedText = text.trim();
    const originalWordCount = cleanedText.split(/\s+/).filter(Boolean).length;

    // length hint
    let targetLength;
    if (lengthSetting === "Short") targetLength = "1–3 key points";
    else if (lengthSetting === "Detailed") targetLength = "7–10 key points";
    else targetLength = "4–6 key points";

    // format instructions
    const bulletInstruction = `
- Format the summary strictly as bullet points.
- Each bullet MUST start with "• " (bullet + space).
- Put each bullet on its own line.
- Do NOT add any paragraphs or prose outside the bullets.
`;

    const paragraphInstruction = `
- Format the summary as 1–3 cohesive paragraphs.
- Do NOT use bullet points or numbered lists.
- Use natural sentence transitions.
`;

    const formatInstruction =
      formatSetting === "Bullets" ? bulletInstruction : paragraphInstruction;

    const userPrompt = `
Summarize the following text.

Requirements:
- Be neutral, factual, and concise.
- Focus only on the core ideas and important details.
- Aim for ${targetLength}.
${formatInstruction}

Text to summarize:
"""${cleanedText}"""
`;

    const messages = [
      {
        role: "system",
        content:
          "You are a professional summarization engine. You follow formatting instructions exactly and never include meta-commentary.",
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.2,
    });

    const summaryText = (completion.choices[0].message.content || "").trim();
    const summaryWordCount = summaryText
      .split(/\s+/)
      .filter(Boolean).length;

    return res.json({
      summaryText,
      originalWordCount,
      summaryWordCount,
      formatSetting,    // optional, handy for debugging
      lengthSetting,    // optional
    });
  } catch (err) {
    console.error("Summarization error:", err);
    return res.status(500).json({ error: "Summarization failed" });
  }
});

app.listen(PORT, () => console.log(`FlashRead backend running on port ${PORT}`));
