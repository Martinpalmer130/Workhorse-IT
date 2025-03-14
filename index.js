const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS so Hostinger can call this API
app.use(cors());
app.use(express.json());

// ✅ Rate Limiting: Max 5 requests per minute
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { 
    error: "You've reached the limit. Meet Martin! Click below to get real IT help.", 
    showArchie: true 
  }
});

app.use("/chatgpt", limiter);

// ✅ Common IT support responses (to save API calls)
const commonResponses = {
  "how to reset my router": "Try turning your router off for 30 seconds, then back on.",
  "how to remove a virus": "Run a full scan with Windows Defender or your antivirus software.",
};

// ✅ ChatGPT API Route
app.post("/chatgpt", async (req, res) => {
  const userMessage = req.body.userMessage.toLowerCase();

  // If it's a common question, return an instant answer
  if (commonResponses[userMessage]) {
    return res.json({ reply: commonResponses[userMessage] });
  }

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OpenAI API Key" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0].message) {
      return res.json({ reply: data.choices[0].message.content });
    }

    res.status(500).json({ error: "No response from OpenAI" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
