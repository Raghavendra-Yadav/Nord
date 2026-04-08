const Entry = require('../models/Entry');

exports.generateReview = async (req, res) => {
  try {
    const { date } = req.body;
    
    // 1. Fetch the user's entry for the requested date
    const entry = await Entry.findOne({ user: req.user.id, date });
    
    if (!entry) {
      return res.status(404).json({ message: "No data logged for this date. Please fill out your log before generating a review." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Build the system prompt
    const systemPrompt = `You are a tough, stoic, and incredibly analytical Life Coach heavily inspired by David Goggins, Huberman, and James Clear.
Your task is to analyze the user's daily life-tracking JSON log below. 
1. Give a ruthless 2-sentence summary of today's performance.
2. Provide exactly 3 highly specific, actionable steps the user MUST execute tomorrow to get 1% better.
Format your output in clean Markdown. Be direct, authoritative, and do not use fluffy language.`;

    const userPrompt = `Here is my raw JSON data for today:\n${JSON.stringify(entry, null, 2)}`;

    // Fallback if no real API key is provided
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      return res.json({
        review: `### Simulated AI Coaching Review
⚠️ **Notice:** A valid \`GEMINI_API_KEY\` was not found in your \`.env\` file. 

**Summary:** 
Your data indicates you survived today, but you left massive potential on the table. You are tracking the metrics, but you need to push harder on your zone 2 cardio and strictly adhere to your Deep Work blocks.

**Actionables for Tomorrow:**
1. **Optimize Light Exposure:** Get exactly 15 minutes of sunlight within 30 minutes of waking to set your circadian rhythm correctly.
2. **Eliminate Friction:** You noted doomscrolling as a minor issue; place your phone in a completely different room before you begin your first Deep Work block.
3. **Execute The Hard Thing:** Tomorrow, pick the single most uncomfortable task you've been avoiding and execute it before 10:00 AM. No excuses.

*(To activate real AI generation, please add your Google Gemini API Key to the backend .env file).*`
      });
    }

    // Call Gemini API using Official SDK
    const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Disable all safety filters since we are tracking raw, unfiltered personal habits (including vices)
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", safetySettings });
    
    const result = await model.generateContent(`${systemPrompt}\n\n---\n\n${userPrompt}`);
    const reviewText = result.response.text();
    
    return res.json({ review: reviewText });

  } catch (err) {
    console.error("Review Gen Error:", err);
    res.status(500).json({ message: `Server Error: ${err.message || err}` });
  }
};
