const SkincareProfile = require('../models/SkincareProfile');
const Entry = require('../models/Entry');
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.getProfile = async (req, res) => {
  try {
    let profile = await SkincareProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = await SkincareProfile.create({
        user: req.user.id,
        stacks: [
          { id: 'am1', name: 'Standard AM', type: 'AM', steps: ['Water Wash', 'Sunscreen'] },
          { id: 'pm1', name: 'Recovery PM', type: 'PM', steps: ['Cleanser', 'Moisturizer'] },
          { id: 'pm2', name: 'Active PM', type: 'PM', steps: ['Cleanser', 'Serum', 'Moisturizer'] }
        ],
        concerns: [],
        logs: []
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { stacks, concerns } = req.body;
    let profile = await SkincareProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: { stacks, concerns, aiAnalysis: {} } },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logDay = async (req, res) => {
  try {
    const { date, amCompleted, pmCompleted, amStackName, pmStackName, skinState } = req.body;
    let profile = await SkincareProfile.findOne({ user: req.user.id });
    
    const logIndex = profile.logs.findIndex(l => l.date === date);
    if (logIndex > -1) {
      if (amCompleted) profile.logs[logIndex].amCompleted = amCompleted;
      if (pmCompleted) profile.logs[logIndex].pmCompleted = pmCompleted;
      if (amStackName !== undefined) profile.logs[logIndex].amStackName = amStackName;
      if (pmStackName !== undefined) profile.logs[logIndex].pmStackName = pmStackName;
      if (skinState !== undefined) profile.logs[logIndex].skinState = skinState;
    } else {
      profile.logs.push({ date, amCompleted: amCompleted || [], pmCompleted: pmCompleted || [], amStackName: amStackName || '', pmStackName: pmStackName || '', skinState: skinState || '' });
    }
    
    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.analyzeRoutine = async (req, res) => {
  try {
    let profile = await SkincareProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Fetch Last 7 Days of Daily Logs for Holistic Context
    const last7Days = await Entry.find({ user: req.user.id }).sort({ date: -1 }).limit(7);
    
    let avgWater = 0, avgSleep = 0, avgJunk = 0, daysTracked = last7Days.length;
    if (daysTracked > 0) {
      avgWater = (last7Days.reduce((acc, curr) => acc + (Number(curr.body?.water) || 0), 0) / daysTracked).toFixed(1);
      avgSleep = (last7Days.reduce((acc, curr) => acc + (Number(curr.body?.sleep) || 0), 0) / daysTracked).toFixed(1);
      avgJunk = (last7Days.filter(e => e.vices?.sugar === 'yes').length);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are an elite, brutally honest Holistic Skincare Dermatologist AI.
You are analyzing a user's Skincare Stacks (Skin Cycling) AND their recent daily lifestyle habits.
Return ONLY a strictly formatted JSON object with no markdown fences, exactly matching this structure:
{
  "routineAnalysis": "A 2-3 sentence critique of their stacks and ingredient combinations.",
  "lifestyleImpact": "How their water/sleep/diet is currently helping or destroying their skin.",
  "timeline": {
    "week2": "What will happen by week 2",
    "week6": "What will happen by week 6",
    "week12": "What will happen by week 12 (collagen/deep results)"
  },
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    const userPrompt = `SKIN CONCERNS: ${profile.concerns.join(', ')}
ROUTINE STACKS: ${JSON.stringify(profile.stacks.map(s => ({ name: s.name, type: s.type, steps: s.steps })))}
RECENT LIFESTYLE (Last 7 Days Average):
- Water: ${avgWater}L/day
- Sleep: ${avgSleep} hrs/night
- Junk Food Days: ${avgJunk}/${daysTracked}`;

    const result = await model.generateContent(`${systemPrompt}\n\n---\n\n${userPrompt}`);
    let analysisText = result.response.text();
    // Clean JSON formatting
    analysisText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let analysisObj = {};
    try {
      analysisObj = JSON.parse(analysisText);
    } catch(e) {
      console.error(e);
      return res.status(500).json({ message: "Failed to parse AI response. Try again." });
    }

    profile.aiAnalysis = analysisObj;
    await profile.save();
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: `AI Error: ${err.message}` });
  }
};
