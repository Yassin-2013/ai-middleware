// index.js

// استيراد الحزم
const express = require("express");
const cors    = require("cors");
const { OpenAI } = require("openai");

// إعداد OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// إنشاء تطبيق Express
const app = express();
const port = process.env.PORT || 3000;

// 1. تفعيل CORS لجميع النشآت
app.use(cors({ origin: "*" }));
// 2. JSON body parsing
app.use(express.json());

/** 
 * GET /  → للتأكد أن الخادم يعمل 
 */
app.get("/", (req, res) => {
  res.send("IQ & Chat Middleware is up and running.");
});

/**
 * POST /api/analyze
 */
app.post("/api/analyze", async (req, res) => {
  try {
    const { userId, answers } = req.body;
    const prompt = `
You are an IQ test analyst. The user (ID: ${userId}) completed an IQ test:
${answers.map(a => `- Q${a.questionId}: ${a.correct ? 'Correct' : 'Incorrect'}, time ${a.responseTime}s`).join("\n")}
Please:
1. Compute the estimated IQ score (µ=100, σ=15).
2. Classify the user.
3. Provide personalized feedback.
4. Suggest three targeted exercises.

Respond in JSON with: iqScore, classification, feedback, recommendations.
`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system",  content: "You are a helpful assistant." },
        { role: "user",    content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    const analysis = JSON.parse(completion.choices[0].message.content.trim());
    res.json({ success: true, analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/chat
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    const reply = completion.choices[0].message;
    res.json({ success: true, reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// بدء الاستماع على المنفذ
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
