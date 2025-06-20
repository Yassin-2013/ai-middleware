// index.js

// ❌ أزلنا require('dotenv').config();
// const { Configuration, OpenAIApi } = require("openai");
const { OpenAI } = require("openai");  // واجهة العميل الحديثة

// أنشئ مثيلاً من عميل OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async (req, res) => {
  // تفعيل CORS للجميع
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // تحليل اختبار الذكاء
    if (req.method === "POST" && req.url.endsWith("/analyze")) {
      const { userId, answers } = req.body;
      const prompt = `
You are an IQ test analyst. The user (ID: ${userId}) completed an IQ test:
${answers.map(a => `- Q${a.questionId}: ${a.correct ? 'Correct' : 'Incorrect'}, time ${a.responseTime}s`).join('\n')}
Please:
1. Compute the estimated IQ score (µ=100, σ=15).
2. Classify the user.
3. Provide personalized feedback (verbal, logical, spatial...).
4. Suggest three targeted exercises or resources.

Respond in JSON with: iqScore, classification, feedback, recommendations.
`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user",   content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      const analysis = JSON.parse(completion.choices[0].message.content.trim());
      return res.status(200).json({ success: true, analysis });
    }

    // نقطة الدردشة
    if (req.method === "POST" && req.url.endsWith("/chat")) {
      const { messages } = req.body;
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages,
        temperature: 0.7,
        max_tokens: 1000
      });
      const reply = completion.choices[0].message;
      return res.status(200).json({ success: true, reply });
    }

    // الجذر
    if (req.method === "GET" && (req.url === "/" || req.url === "")) {
      return res.status(200).send("IQ Middleware is up and running.");
    }

    // باقي المسارات → 404
    return res.status(404).json({ success: false, message: "Not found" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
