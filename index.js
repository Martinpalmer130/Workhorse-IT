const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

// 1️⃣ Enable CORS (so Hostinger can access it)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// 2️⃣ Rate Limiting (Max 5 requests per minute per IP)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Allow only 5 requests per minute per IP
  message: { 
    error: "Sounds like you need more help. Why not contact Workhorse IT for expert support?"
  }
});

app.use("/chatgpt", limiter); // Apply rate limiting to the chatbot API

app.use(express.json());

// 3️⃣ Define ChatGPT Route
app.post("/chatgpt", async (req, res) => {
  try {
    const userMessage = req.body.userMessage;
    if (!userMessage) {
      return res.status(400).json({ error: "No userMessage provided" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    // 4️⃣ Send request to OpenAI API
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
    console.log("OpenAI raw response:", data);

    // 5️⃣ Handle OpenAI response
    if (data.error) {
      console.error("OpenAI Error:", data.error);
      return res.status(500).json({ error: data.error.message || "OpenAI returned an error" });
    }

    if (data.choices && data.choices[0].message) {
      return res.json({ reply: data.choices[0].message.content });
    }

    // Fallback if no response
    res.status(500).json({ error: "No response from OpenAI" });
  } catch (err) {
    console.error("Error in /chatgpt:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 6️⃣ Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
