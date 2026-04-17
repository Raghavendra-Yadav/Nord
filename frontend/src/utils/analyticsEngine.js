/**
 * 🛰️ LifeOS Analytics & Physics-Informed Internal Engine
 * Centralized mathematical models for all biometric and productivity scoring.
 */

export const getVal = (entry, path) => {
  if (!entry) return null;
  const parts = path.split('.');
  let val = entry;
  for (const p of parts) {
    if (val && val[p] !== undefined) val = val[p];
    else return null;
  }
  return val === '' ? null : Number(val);
};

export const calculateScore = (entry, domain) => {
  if (!entry) return null;
  let score = null;

  switch (domain) {
    case 'Body':
      if (entry.body?.sleepH) {
        // Gaussian Curve Model (Target: 7.5h, Variance: 1.8h)
        const sleep = Number(entry.body.sleepH);
        score = 100 * Math.exp(-Math.pow(sleep - 7.5, 2) / 6.48);
      }
      break;

    case 'Mind':
      if (entry.mind?.readMin !== undefined || entry.mind?.meditMin !== undefined) {
        // Logarithmic Saturation Model
        const totalMind = Number(entry.mind?.readMin || 0) + Number(entry.mind?.meditMin || 0);
        score = 100 * (1 - Math.exp(-totalMind / 20));
      }
      break;

    case 'Mood':
      if (entry.mood?.mood) {
        // Sigmoid Model for psychological variance
        const m = Number(entry.mood.mood);
        score = 100 / (1 + Math.exp(-0.8 * (m - 5)));
      }
      break;

    case 'Vices':
      if (entry.vices?.screenT !== undefined) {
        // Exponential Decay Model (Half-life approx 3.0h)
        const t = Number(entry.vices.screenT || 0);
        score = 100 * Math.exp(-0.231 * t);
      }
      break;

    case 'Career':
      if (entry.career?.deepWorkBlocks !== undefined) {
        // Step-function magnitude (Target: 4 blocks)
        const b = Number(entry.career.deepWorkBlocks || 0);
        score = Math.min(100, (b / 4) * 100);
      }
      break;

    case 'Finance':
      if (entry.finance?.spent !== undefined) {
        // Power-law Decay (Guilt-free threshold: $30)
        const s = Number(entry.finance.spent || 0);
        score = s <= 30 ? 100 : Math.max(0, 100 * Math.pow(30 / s, 0.7));
      }
      break;

    case 'Relations':
      if (entry.relations?.meaningConvo) {
        score = entry.relations.meaningConvo === 'yes' ? 100 : 0;
      }
      break;

    case 'Environment':
      if (entry.environ?.roomClean || entry.environ?.bedMade) {
        const clean = entry.environ.roomClean === 'yes' ? 1 : (entry.environ.roomClean === 'partial' ? 0.5 : 0);
        const bed = entry.environ.bedMade === 'yes' ? 1 : 0;
        score = (clean * 0.7 + bed * 0.3) * 100;
      }
      break;

    case 'Reflect':
      if (entry.reflect?.dayRating) {
        // Quadratic Power Model
        const r = Number(entry.reflect.dayRating);
        score = Math.pow(r / 10, 2) * 100;
      }
      break;

    default: break;
  }

  return score;
};

export const calculateDayAverage = (entry) => {
  const domains = ['Body', 'Mind', 'Mood', 'Vices', 'Career', 'Finance', 'Relations', 'Environment', 'Reflect'];
  let sum = 0;
  let count = 0;

  domains.forEach(d => {
    const s = calculateScore(entry, d);
    if (s !== null) {
      sum += s;
      count++;
    }
  });

  return count > 0 ? Math.round(sum / count) : null;
};

export const calculatePearsonCorrelation = (arr, key1, key2) => {
  const data = arr.map(d => ({ x: getVal(d, key1), y: getVal(d, key2) }))
    .filter(d => d.x !== null && d.y !== null);

  if (data.length < 5) return 0;

  const x = data.map(d => d.x);
  const y = data.map(d => d.y);
  const n = x.length;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
};

export const calculateIEI = (entry) => {
  if (!entry) return null;
  let score = 50; // starts neutral
  
  // Extrinsic Signals (Hurried, minimal reflection, phone addiction)
  if (!entry.reflect?.gratitude || entry.reflect.gratitude.length < 5) score -= 20;
  if (!entry.reflect?.wins || entry.reflect.wins.length < 5) score -= 10;
  if (Number(entry.vices?.screenT || 0) > 4.5) score -= 10;
  
  // Intrinsic Signals (Depth, intentionality, social connection)
  if (entry.reflect?.gratitude && entry.reflect.gratitude.length > 20) score += 20;
  if (entry.reflect?.struggles && entry.reflect.struggles.length > 15) score += 15;
  if (entry.relations?.meaningConvo === 'yes') score += 15;
  
  return Math.max(0, Math.min(100, score));
};
