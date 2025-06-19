// api/index.js

const { Configuration, OpenAIApi } = require("openai");

// إعداد OpenAI
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

module.exports = async (req, res) => {
  // تفعيل CORS للجميع
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "POST" && req.url.endsWith("/analyze")) {
      const { userId, answers } = req.body;
      // ... (بنَاء prompt و استدعاء GPT-4 كما أرسلنا لك سابقاً)
      const prompt = `
You are an IQ test analyst. The user (ID: ${userId}) completed an IQ test:
${answers.map(a => `- Q${a.questionId}: ${a.correct ? 'Correct' : 'Incorrect'}, time ${a.responseTime}s`).join('\n')}
Please:
1. Compute the estimated IQ score (µ=100, σ=15).
2. Classify the user.
3. Provide feedback.
4. Suggest three exercises.

Respond in JSON: iqScore, classification, feedback, recommendations.
`;
      const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user",   content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      const analysis = JSON.parse(completion.data.choices[0].message.content);
      return res.status(200).json({ success: true, analysis });
    }

    if (req.method === "POST" && req.url.endsWith("/chat")) {
      const { messages } = req.body;
      const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      const reply = completion.data.choices[0].message;
      return res.status(200).json({ success: true, reply });
    }

    // Default root path
    if (req.method === "GET" && (req.url === "/" || req.url === "")) {
      return res.status(200).send("IQ Middleware is up and running.");
    }

    return res.status(404).json({ success: false, message: "Not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
