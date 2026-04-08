
import { useState, useEffect, useCallback } from "react";

// ─── Storage helpers ───────────────────────────────────────────────
const STORAGE_KEY = "lifetracker-data";
const REVIEW_KEY = "lifetracker-reviews";

async function loadData() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : {};
  } catch { return {}; }
}
async function saveData(data) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
async function loadReviews() {
  try {
    const r = await window.storage.get(REVIEW_KEY);
    return r ? JSON.parse(r.value) : {};
  } catch { return {}; }
}
async function saveReview(weekKey, text) {
  const reviews = await loadReviews();
  reviews[weekKey] = text;
  try { await window.storage.set(REVIEW_KEY, JSON.stringify(reviews)); } catch {}
}

// ─── Date helpers ──────────────────────────────────────────────────
function toDateKey(d) {
  return d.toISOString().split("T")[0];
}
function today() { return toDateKey(new Date()); }
function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d); mon.setDate(diff);
  return toDateKey(mon);
}
function isSunday() { return new Date().getDay() === 0; }
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return toDateKey(d);
  });
}
function formatDate(str) {
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
}
function formatDateShort(str) {
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Default entry shape ────────────────────────────────────────────
function emptyEntry() {
  return {
    // Body & Health
    steps: "",
    sleepHours: "",
    sleepQuality: "",   // 1-5
    waterLitres: "",
    exercise: "",       // none / light / moderate / intense
    exerciseMin: "",
    // Mind
    meditation: "",     // done / not done
    meditationMin: "",
    journaling: "",
    // Mood & Energy
    mood: "",           // 1-10
    energyLevel: "",    // 1-10
    anxietyLevel: "",   // 1-10
    // Vices / patterns
    masturbation: "",   // 0/1/2/more
    coffee: "",         // cups
    vaping: "",         // yes/no/how many
    alcohol: "",
    // Skincare
    skincareAM: "",
    skincarePM: "",
    // Nutrition
    mealsEaten: "",
    ateHealthy: "",     // yes / mostly / no
    // Career
    careerHours: "",    // hours on job search / learning
    applicationsOut: "",
    skillPractice: "",
    // Finance
    spent: "",
    savedToday: "",
    // Relationships / social
    socialInteraction: "", // none / little / good
    // Notes
    notes: "",
    wins: "",
    struggles: "",
    gratitude: "",
  };
}

// ─── 7 Areas config ────────────────────────────────────────────────
const AREAS = [
  { id: "body", label: "Body & Health", icon: "◈" },
  { id: "mind", label: "Mind", icon: "◉" },
  { id: "mood", label: "Mood & Energy", icon: "◐" },
  { id: "vices", label: "Patterns & Vices", icon: "◯" },
  { id: "career", label: "Career & Skills", icon: "◆" },
  { id: "relations", label: "Relationships", icon: "◇" },
  { id: "reflection", label: "Reflection", icon: "◌" },
];

// ─── Scoring logic ─────────────────────────────────────────────────
function scoreEntry(e) {
  let scores = {};
  // Body
  let body = 0, bc = 0;
  if (e.steps) { body += Math.min(parseInt(e.steps)/10000, 1)*25; bc++; }
  if (e.sleepHours) { const s = parseFloat(e.sleepHours); body += (s >= 7 && s <= 9 ? 25 : s >= 6 ? 15 : 5); bc++; }
  if (e.waterLitres) { const w = parseFloat(e.waterLitres); body += Math.min(w/2.5,1)*25; bc++; }
  if (e.exercise) { body += e.exercise === "intense" ? 25 : e.exercise === "moderate" ? 20 : e.exercise === "light" ? 10 : 0; bc++; }
  scores.body = bc ? Math.round(body / bc) : null;

  // Mind
  let mind = 0, mc = 0;
  if (e.meditation) { mind += e.meditation === "done" ? 50 : 0; mc++; }
  if (e.journaling) { mind += e.journaling === "yes" ? 50 : 0; mc++; }
  scores.mind = mc ? Math.round(mind / mc) : null;

  // Mood
  let mood = 0, mdc = 0;
  if (e.mood) { mood += (parseInt(e.mood)/10)*100; mdc++; }
  if (e.energyLevel) { mood += (parseInt(e.energyLevel)/10)*100; mdc++; }
  // anxiety inverted
  if (e.anxietyLevel) { mood += ((10-parseInt(e.anxietyLevel))/10)*100; mdc++; }
  scores.mood = mdc ? Math.round(mood / mdc) : null;

  // Vices (higher = better discipline)
  let vices = 100, vc = 0;
  if (e.masturbation !== "") {
    const m = parseInt(e.masturbation) || 0;
    vices -= m > 1 ? 30 : m === 1 ? 15 : 0; vc++;
  }
  if (e.coffee !== "") { const c = parseInt(e.coffee)||0; vices -= c > 2 ? 20 : c > 1 ? 10 : 0; vc++; }
  if (e.vaping !== "") { vices -= e.vaping === "yes" ? 30 : 0; vc++; }
  if (e.alcohol !== "") { vices -= e.alcohol === "yes" ? 25 : 0; vc++; }
  scores.vices = vc ? Math.max(0, Math.round(vices * vc / (vc+0.001))) : null;

  // Career
  let car = 0, cc = 0;
  if (e.careerHours) { car += Math.min(parseInt(e.careerHours)/4,1)*50; cc++; }
  if (e.skillPractice) { car += e.skillPractice === "yes" ? 50 : 0; cc++; }
  scores.career = cc ? Math.round(car / cc) : null;

  // Relations
  let rel = 0, rc = 0;
  if (e.socialInteraction) { rel += e.socialInteraction === "good" ? 100 : e.socialInteraction === "little" ? 50 : 10; rc++; }
  scores.relations = rc ? Math.round(rel/rc) : null;

  // Reflection
  let ref = 0, rfc = 0;
  if (e.wins) { ref += 33; rfc++; }
  if (e.struggles) { ref += 33; rfc++; }
  if (e.gratitude) { ref += 34; rfc++; }
  scores.reflection = rfc ? Math.min(100, ref) : null;

  return scores;
}

function overallScore(scores) {
  const vals = Object.values(scores).filter(v => v !== null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a,b) => a+b, 0) / vals.length);
}

// ─── Radar chart SVG ───────────────────────────────────────────────
function RadarChart({ scores }) {
  const areas = ["body","mind","mood","vices","career","relations","reflection"];
  const labels = ["Body","Mind","Mood","Patterns","Career","Social","Reflection"];
  const n = areas.length;
  const cx = 120, cy = 120, r = 90;
  const pts = areas.map((a, i) => {
    const angle = (Math.PI*2*i/n) - Math.PI/2;
    const val = scores[a] ?? 0;
    return [cx + r*(val/100)*Math.cos(angle), cy + r*(val/100)*Math.sin(angle)];
  });
  const polygon = pts.map(p => p.join(",")).join(" ");
  const gridLevels = [20,40,60,80,100];

  return (
    <svg viewBox="0 0 240 240" style={{width:"100%",maxWidth:240,height:"auto"}}>
      {gridLevels.map(lv => {
        const gpts = areas.map((_,i) => {
          const angle = (Math.PI*2*i/n)-Math.PI/2;
          return [cx + r*(lv/100)*Math.cos(angle), cy + r*(lv/100)*Math.sin(angle)].join(",");
        }).join(" ");
        return <polygon key={lv} points={gpts} fill="none" stroke="rgba(200,200,200,0.3)" strokeWidth="0.5"/>;
      })}
      {areas.map((_,i) => {
        const angle = (Math.PI*2*i/n)-Math.PI/2;
        return <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(angle)} y2={cy+r*Math.sin(angle)} stroke="rgba(200,200,200,0.25)" strokeWidth="0.5"/>;
      })}
      <polygon points={polygon} fill="rgba(99,153,34,0.18)" stroke="#639922" strokeWidth="1.5"/>
      {pts.map((p,i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#639922"/>)}
      {areas.map((_,i) => {
        const angle = (Math.PI*2*i/n)-Math.PI/2;
        const lx = cx + (r+18)*Math.cos(angle);
        const ly = cy + (r+18)*Math.sin(angle);
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="var(--color-text-secondary)">{labels[i]}</text>;
      })}
    </svg>
  );
}

// ─── Score bar ─────────────────────────────────────────────────────
function ScoreBar({ value, color="#639922" }) {
  if (value === null) return <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>No data</div>;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:5,background:"rgba(128,128,128,0.15)",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,background:color,borderRadius:3,transition:"width 0.6s ease"}}/>
      </div>
      <span style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)",minWidth:28}}>{value}</span>
    </div>
  );
}

// ─── Field components ──────────────────────────────────────────────
const inputStyle = {
  width:"100%",padding:"7px 10px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",
  background:"var(--color-background-primary)",color:"var(--color-text-primary)",
  fontSize:13,boxSizing:"border-box",outline:"none"
};
const labelStyle = { fontSize:11,color:"var(--color-text-secondary)",marginBottom:3,display:"block" };

function Field({ label, children }) {
  return (
    <div style={{marginBottom:12}}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, placeholder, min, max }) {
  return <input type="number" value={value} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} min={min} max={max} style={inputStyle}/>;
}

function SegControl({ value, onChange, options }) {
  return (
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {options.map(o => (
        <button key={o.value} onClick={()=>onChange(o.value)}
          style={{padding:"5px 12px",borderRadius:20,border:`0.5px solid ${value===o.value?"#639922":"var(--color-border-tertiary)"}`,
            background:value===o.value?"rgba(99,153,34,0.12)":"transparent",
            color:value===o.value?"#3B6D11":"var(--color-text-secondary)",
            fontSize:12,cursor:"pointer",transition:"all 0.15s"}}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StarRating({ value, onChange, max=10 }) {
  return (
    <div style={{display:"flex",gap:3}}>
      {Array.from({length:max},(_,i)=>i+1).map(n => (
        <button key={n} onClick={()=>onChange(String(n))}
          style={{width:22,height:22,borderRadius:4,border:"none",
            background:parseInt(value)>=n?"#639922":"var(--color-background-secondary)",
            color:parseInt(value)>=n?"white":"var(--color-text-tertiary)",
            fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {n}
        </button>
      ))}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────
export default function LifeTracker() {
  const [allData, setAllData] = useState({});
  const [reviews, setReviews] = useState({});
  const [selectedDate, setSelectedDate] = useState(today());
  const [activeTab, setActiveTab] = useState("log"); // log | history | review
  const [activeArea, setActiveArea] = useState("body");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState("");

  useEffect(() => {
    (async () => {
      const d = await loadData();
      const rv = await loadReviews();
      setAllData(d);
      setReviews(rv);
      setLoading(false);
    })();
  }, []);

  const entry = allData[selectedDate] || emptyEntry();

  function updateEntry(field, val) {
    const updated = { ...allData, [selectedDate]: { ...entry, [field]: val } };
    setAllData(updated);
    saveData(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function u(field) { return val => updateEntry(field, val); }

  // Sunday review via Claude API
  async function generateReview() {
    setReviewLoading(true);
    setReviewResult("");
    const last7 = getLast7Days();
    const weekData = last7.map(d => ({ date: formatDate(d), entry: allData[d] || null }));
    const weekKey = getWeekKey(selectedDate);

    const prompt = `You are a personal life coach reviewing someone's week of self-tracking data. Here is their data for the past 7 days:

${JSON.stringify(weekData, null, 2)}

The 7 life areas tracked: Body & Health, Mind (meditation/journaling), Mood & Energy, Patterns & Vices (masturbation, coffee, vaping), Career & Skills, Relationships, and Reflection.

Write a warm, honest, deeply personal Sunday review covering:
1. **What's working** — genuinely celebrate wins, be specific
2. **What's struggling** — name patterns honestly, not judgmentally  
3. **The hidden pattern** — what's the deeper thing connecting the dots across areas?
4. **Where to focus this week** — 1-2 specific priorities only, with a concrete micro-action
5. **One honest truth** — something they might not want to hear but need to

Use "you" language. Be direct but kind. Around 300 words. No fluff.`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data = await resp.json();
      const text = data.content?.map(c=>c.text||"").join("") || "Could not generate review.";
      setReviewResult(text);
      await saveReview(weekKey, text);
      const updated = await loadReviews();
      setReviews(updated);
    } catch(e) {
      setReviewResult("Failed to generate review. Please try again.");
    }
    setReviewLoading(false);
  }

  const scores = scoreEntry(entry);
  const overall = overallScore(scores);

  // History: last 7 days summary
  const last7 = getLast7Days();

  // Tabs
  const tabs = [
    { id:"log", label:"Daily Log" },
    { id:"history", label:"This Week" },
    { id:"review", label:"Sunday Review" },
  ];

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300,color:"var(--color-text-secondary)",fontSize:14}}>
      Loading your data...
    </div>
  );

  return (
    <div style={{fontFamily:"'DM Sans', system-ui, sans-serif",maxWidth:600,margin:"0 auto",padding:"1rem 0"}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:4}}>
          <h1 style={{fontSize:20,fontWeight:600,color:"var(--color-text-primary)",margin:0,letterSpacing:"-0.02em"}}>Life Tracker</h1>
          {saved && <span style={{fontSize:11,color:"#639922",fontWeight:500}}>Saved ✓</span>}
        </div>
        <p style={{fontSize:12,color:"var(--color-text-tertiary)",margin:0}}>7 areas · daily check-in · sunday review</p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:"var(--color-background-secondary)",borderRadius:10,padding:3}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{flex:1,padding:"7px 4px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:500,
              background:activeTab===t.id?"var(--color-background-primary)":"transparent",
              color:activeTab===t.id?"var(--color-text-primary)":"var(--color-text-secondary)",
              transition:"all 0.15s"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DAILY LOG TAB ─────────────────────────────── */}
      {activeTab === "log" && (
        <div>
          {/* Date picker */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}
              style={{...inputStyle,width:"auto",flex:1}}/>
            <button onClick={()=>setSelectedDate(today())}
              style={{padding:"7px 12px",borderRadius:6,border:"0.5px solid var(--color-border-tertiary)",
                background:"transparent",color:"var(--color-text-secondary)",fontSize:12,cursor:"pointer"}}>
              Today
            </button>
          </div>

          {/* Overall score ring */}
          {overall !== null && (
            <div style={{display:"flex",alignItems:"center",gap:16,background:"var(--color-background-secondary)",borderRadius:12,padding:"12px 16px",marginBottom:16}}>
              <div style={{position:"relative",width:52,height:52,flexShrink:0}}>
                <svg viewBox="0 0 52 52" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",transform:"rotate(-90deg)"}}>
                  <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="4"/>
                  <circle cx="26" cy="26" r="22" fill="none" stroke="#639922" strokeWidth="4"
                    strokeDasharray={`${2*Math.PI*22*(overall/100)} ${2*Math.PI*22}`} strokeLinecap="round"/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"var(--color-text-primary)"}}>{overall}</div>
              </div>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>Today's score</p>
                <p style={{margin:"2px 0 0",fontSize:11,color:"var(--color-text-tertiary)"}}>{formatDate(selectedDate)}</p>
              </div>
            </div>
          )}

          {/* Area tabs */}
          <div style={{display:"flex",gap:4,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
            {AREAS.map(a => (
              <button key={a.id} onClick={()=>setActiveArea(a.id)}
                style={{flexShrink:0,padding:"5px 10px",borderRadius:20,border:`0.5px solid ${activeArea===a.id?"#639922":"var(--color-border-tertiary)"}`,
                  background:activeArea===a.id?"rgba(99,153,34,0.1)":"transparent",
                  color:activeArea===a.id?"#3B6D11":"var(--color-text-secondary)",
                  fontSize:11,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          {/* Area score */}
          {scores[activeArea] !== null && scores[activeArea] !== undefined && (
            <div style={{marginBottom:14}}>
              <ScoreBar value={scores[activeArea]}/>
            </div>
          )}

          {/* ── Body & Health ── */}
          {activeArea === "body" && (
            <div>
              <Field label="Steps today">
                <NumInput value={entry.steps} onChange={u("steps")} placeholder="e.g. 8500" min="0"/>
              </Field>
              <Field label="Sleep (hours)">
                <NumInput value={entry.sleepHours} onChange={u("sleepHours")} placeholder="e.g. 7.5" min="0" max="24"/>
              </Field>
              <Field label="Sleep quality (1–10)">
                <StarRating value={entry.sleepQuality} onChange={u("sleepQuality")} max={10}/>
              </Field>
              <Field label="Water (litres)">
                <NumInput value={entry.waterLitres} onChange={u("waterLitres")} placeholder="e.g. 2.0" min="0"/>
              </Field>
              <Field label="Exercise">
                <SegControl value={entry.exercise} onChange={u("exercise")} options={[
                  {value:"none",label:"None"},{value:"light",label:"Light"},{value:"moderate",label:"Moderate"},{value:"intense",label:"Intense"}
                ]}/>
              </Field>
              {entry.exercise && entry.exercise !== "none" && (
                <Field label="Exercise duration (mins)">
                  <NumInput value={entry.exerciseMin} onChange={u("exerciseMin")} placeholder="e.g. 30"/>
                </Field>
              )}
              <Field label="Skincare AM">
                <SegControl value={entry.skincareAM} onChange={u("skincareAM")} options={[{value:"done",label:"Done ✓"},{value:"skipped",label:"Skipped"}]}/>
              </Field>
              <Field label="Skincare PM">
                <SegControl value={entry.skincarePM} onChange={u("skincarePM")} options={[{value:"done",label:"Done ✓"},{value:"skipped",label:"Skipped"}]}/>
              </Field>
              <Field label="Ate healthy?">
                <SegControl value={entry.ateHealthy} onChange={u("ateHealthy")} options={[{value:"yes",label:"Yes"},{value:"mostly",label:"Mostly"},{value:"no",label:"No"}]}/>
              </Field>
              <Field label="Meals eaten">
                <NumInput value={entry.mealsEaten} onChange={u("mealsEaten")} placeholder="Number of meals" min="0" max="10"/>
              </Field>
            </div>
          )}

          {/* ── Mind ── */}
          {activeArea === "mind" && (
            <div>
              <Field label="Meditation">
                <SegControl value={entry.meditation} onChange={u("meditation")} options={[{value:"done",label:"Done ✓"},{value:"not done",label:"Not done"}]}/>
              </Field>
              {entry.meditation === "done" && (
                <Field label="Meditation duration (mins)">
                  <NumInput value={entry.meditationMin} onChange={u("meditationMin")} placeholder="e.g. 10"/>
                </Field>
              )}
              <Field label="Journaling">
                <SegControl value={entry.journaling} onChange={u("journaling")} options={[{value:"yes",label:"Yes ✓"},{value:"no",label:"No"}]}/>
              </Field>
              <Field label="Reading / learning (mins)">
                <NumInput value={entry.readingMin} onChange={u("readingMin")} placeholder="e.g. 20"/>
              </Field>
            </div>
          )}

          {/* ── Mood & Energy ── */}
          {activeArea === "mood" && (
            <div>
              <Field label="Mood (1–10)">
                <StarRating value={entry.mood} onChange={u("mood")} max={10}/>
              </Field>
              <Field label="Energy level (1–10)">
                <StarRating value={entry.energyLevel} onChange={u("energyLevel")} max={10}/>
              </Field>
              <Field label="Anxiety level (1–10, lower is better)">
                <StarRating value={entry.anxietyLevel} onChange={u("anxietyLevel")} max={10}/>
              </Field>
              <Field label="Overall feeling today">
                <textarea value={entry.feelingNote||""} onChange={e=>updateEntry("feelingNote",e.target.value)}
                  placeholder="How did today feel in a sentence?"
                  style={{...inputStyle,height:60,resize:"vertical"}}/>
              </Field>
            </div>
          )}

          {/* ── Patterns & Vices ── */}
          {activeArea === "vices" && (
            <div>
              <Field label="Masturbation (times today)">
                <SegControl value={entry.masturbation} onChange={u("masturbation")} options={[
                  {value:"0",label:"0"},{value:"1",label:"1"},{value:"2",label:"2"},{value:"3",label:"3+"}
                ]}/>
              </Field>
              <Field label="Coffee (cups)">
                <NumInput value={entry.coffee} onChange={u("coffee")} placeholder="cups" min="0"/>
              </Field>
              <Field label="Vaping today?">
                <SegControl value={entry.vaping} onChange={u("vaping")} options={[{value:"no",label:"No ✓"},{value:"yes",label:"Yes"}]}/>
              </Field>
              {entry.vaping === "yes" && (
                <Field label="Vaping — approx. puffs/sessions">
                  <NumInput value={entry.vapingAmount} onChange={u("vapingAmount")} placeholder="sessions"/>
                </Field>
              )}
              <Field label="Alcohol today?">
                <SegControl value={entry.alcohol} onChange={u("alcohol")} options={[{value:"no",label:"No ✓"},{value:"yes",label:"Yes"}]}/>
              </Field>
              <Field label="Porn today?">
                <SegControl value={entry.porn} onChange={u("porn")} options={[{value:"no",label:"No ✓"},{value:"yes",label:"Yes"}]}/>
              </Field>
              <Field label="Screen time (hrs, non-work)">
                <NumInput value={entry.screenTime} onChange={u("screenTime")} placeholder="hours" min="0"/>
              </Field>
            </div>
          )}

          {/* ── Career & Skills ── */}
          {activeArea === "career" && (
            <div>
              <Field label="Hours on career today (job search / learning)">
                <NumInput value={entry.careerHours} onChange={u("careerHours")} placeholder="hours" min="0"/>
              </Field>
              <Field label="Job applications sent today">
                <NumInput value={entry.applicationsOut} onChange={u("applicationsOut")} placeholder="0" min="0"/>
              </Field>
              <Field label="Skill practice (ML/coding) done?">
                <SegControl value={entry.skillPractice} onChange={u("skillPractice")} options={[{value:"yes",label:"Yes ✓"},{value:"no",label:"No"}]}/>
              </Field>
              <Field label="What did you work on today?">
                <textarea value={entry.careerNote||""} onChange={e=>updateEntry("careerNote",e.target.value)}
                  placeholder="Brief note on what you learned or did"
                  style={{...inputStyle,height:60,resize:"vertical"}}/>
              </Field>
              <Field label="Money spent today (₹)">
                <NumInput value={entry.spent} onChange={u("spent")} placeholder="0"/>
              </Field>
            </div>
          )}

          {/* ── Relationships ── */}
          {activeArea === "relations" && (
            <div>
              <Field label="Social interaction today">
                <SegControl value={entry.socialInteraction} onChange={u("socialInteraction")} options={[
                  {value:"none",label:"None"},{value:"little",label:"Little"},{value:"good",label:"Good"},{value:"great",label:"Great"}
                ]}/>
              </Field>
              <Field label="Meaningful conversation?">
                <SegControl value={entry.meaningfulConvo} onChange={u("meaningfulConvo")} options={[{value:"yes",label:"Yes"},{value:"no",label:"No"}]}/>
              </Field>
              <Field label="Who did you connect with?">
                <input type="text" value={entry.connectedWith||""} onChange={e=>updateEntry("connectedWith",e.target.value)}
                  placeholder="Friend, family, colleague..."
                  style={inputStyle}/>
              </Field>
              <Field label="Helped someone today?">
                <SegControl value={entry.helpedSomeone} onChange={u("helpedSomeone")} options={[{value:"yes",label:"Yes"},{value:"no",label:"No"}]}/>
              </Field>
            </div>
          )}

          {/* ── Reflection ── */}
          {activeArea === "reflection" && (
            <div>
              <Field label="Today's win (big or small)">
                <textarea value={entry.wins} onChange={e=>updateEntry("wins",e.target.value)}
                  placeholder="What went right today?"
                  style={{...inputStyle,height:60,resize:"vertical"}}/>
              </Field>
              <Field label="Today's struggle">
                <textarea value={entry.struggles} onChange={e=>updateEntry("struggles",e.target.value)}
                  placeholder="What was hard or where did you slip?"
                  style={{...inputStyle,height:60,resize:"vertical"}}/>
              </Field>
              <Field label="Gratitude (3 things)">
                <textarea value={entry.gratitude} onChange={e=>updateEntry("gratitude",e.target.value)}
                  placeholder="I'm grateful for..."
                  style={{...inputStyle,height:60,resize:"vertical"}}/>
              </Field>
              <Field label="Tomorrow's #1 intention">
                <input type="text" value={entry.tomorrowIntention||""} onChange={e=>updateEntry("tomorrowIntention",e.target.value)}
                  placeholder="One thing that will make tomorrow count"
                  style={inputStyle}/>
              </Field>
              <Field label="Overall notes">
                <textarea value={entry.notes} onChange={e=>updateEntry("notes",e.target.value)}
                  placeholder="Anything else worth remembering..."
                  style={{...inputStyle,height:70,resize:"vertical"}}/>
              </Field>
            </div>
          )}

          {/* Nav between areas */}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:20,paddingTop:16,borderTop:"0.5px solid var(--color-border-tertiary)"}}>
            <button onClick={()=>{
              const i=AREAS.findIndex(a=>a.id===activeArea);
              if(i>0) setActiveArea(AREAS[i-1].id);
            }} disabled={AREAS[0].id===activeArea}
              style={{padding:"7px 14px",borderRadius:6,border:"0.5px solid var(--color-border-tertiary)",background:"transparent",
                color:"var(--color-text-secondary)",fontSize:12,cursor:"pointer",opacity:AREAS[0].id===activeArea?0.3:1}}>
              ← Prev
            </button>
            <span style={{fontSize:11,color:"var(--color-text-tertiary)",alignSelf:"center"}}>
              {AREAS.findIndex(a=>a.id===activeArea)+1} / {AREAS.length}
            </span>
            <button onClick={()=>{
              const i=AREAS.findIndex(a=>a.id===activeArea);
              if(i<AREAS.length-1) setActiveArea(AREAS[i+1].id);
            }} disabled={AREAS[AREAS.length-1].id===activeArea}
              style={{padding:"7px 14px",borderRadius:6,border:"0.5px solid var(--color-border-tertiary)",background:"transparent",
                color:"var(--color-text-secondary)",fontSize:12,cursor:"pointer",opacity:AREAS[AREAS.length-1].id===activeArea?0.3:1}}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ─────────────────────────────────── */}
      {activeTab === "history" && (
        <div>
          <p style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:14}}>Last 7 days overview</p>
          {/* Radar for avg */}
          {(() => {
            const avgScores = {};
            AREAS.forEach(a => {
              const vals = last7.map(d => scoreEntry(allData[d]||emptyEntry())[a.id]).filter(v=>v!==null);
              avgScores[a.id] = vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : 0;
            });
            return (
              <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
                <RadarChart scores={avgScores}/>
              </div>
            );
          })()}

          {/* Area breakdown */}
          <div style={{background:"var(--color-background-secondary)",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
            <p style={{fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",margin:"0 0 12px",textTransform:"uppercase",letterSpacing:"0.06em"}}>7-day area averages</p>
            {AREAS.map(a => {
              const vals = last7.map(d => scoreEntry(allData[d]||emptyEntry())[a.id]).filter(v=>v!==null);
              const avg = vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : null;
              return (
                <div key={a.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{a.icon} {a.label}</span>
                    <span style={{fontSize:12,fontWeight:500,color:avg>=70?"#3B6D11":avg>=40?"#BA7517":"#A32D2D"}}>{avg??'—'}</span>
                  </div>
                  <ScoreBar value={avg} color={avg>=70?"#639922":avg>=40?"#EF9F27":"#E24B4A"}/>
                </div>
              );
            })}
          </div>

          {/* Day by day */}
          <p style={{fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Day by day</p>
          {last7.map(d => {
            const e = allData[d];
            const sc = e ? scoreEntry(e) : {};
            const ov = overallScore(sc);
            const isToday = d===today();
            return (
              <div key={d} onClick={()=>{setSelectedDate(d);setActiveTab("log");}}
                style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
                  background:isToday?"rgba(99,153,34,0.07)":"var(--color-background-secondary)",
                  borderRadius:10,marginBottom:8,cursor:"pointer",
                  border:`0.5px solid ${isToday?"rgba(99,153,34,0.3)":"var(--color-border-tertiary)"}`}}>
                <div style={{width:38,flexShrink:0,textAlign:"center"}}>
                  <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"})}</div>
                  <div style={{fontSize:15,fontWeight:600,color:"var(--color-text-primary)"}}>{new Date(d+"T12:00:00").getDate()}</div>
                </div>
                <div style={{flex:1}}>
                  {e ? (
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {e.steps && <span style={{fontSize:10,padding:"2px 6px",borderRadius:10,background:"rgba(99,153,34,0.1)",color:"#3B6D11"}}>{parseInt(e.steps).toLocaleString()} steps</span>}
                      {e.sleepHours && <span style={{fontSize:10,padding:"2px 6px",borderRadius:10,background:"rgba(24,95,165,0.1)",color:"#185FA5"}}>{e.sleepHours}h sleep</span>}
                      {e.meditation==="done" && <span style={{fontSize:10,padding:"2px 6px",borderRadius:10,background:"rgba(99,153,34,0.1)",color:"#3B6D11"}}>🧘 med</span>}
                      {e.masturbation && e.masturbation!=="0" && <span style={{fontSize:10,padding:"2px 6px",borderRadius:10,background:"rgba(186,117,23,0.1)",color:"#BA7517"}}>M×{e.masturbation}</span>}
                      {e.vaping==="yes" && <span style={{fontSize:10,padding:"2px 6px",borderRadius:10,background:"rgba(226,75,74,0.1)",color:"#A32D2D"}}>vape</span>}
                    </div>
                  ) : (
                    <span style={{fontSize:12,color:"var(--color-text-tertiary)"}}>No entry</span>
                  )}
                </div>
                <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,
                  background:ov!==null?(ov>=70?"rgba(99,153,34,0.15)":ov>=40?"rgba(239,159,39,0.15)":"rgba(226,75,74,0.15)"):"var(--color-background-secondary)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,fontWeight:600,
                  color:ov!==null?(ov>=70?"#3B6D11":ov>=40?"#BA7517":"#A32D2D"):"var(--color-text-tertiary)"}}>
                  {ov??"—"}
                </div>
              </div>
            );
          })}

          {/* Streaks */}
          {(() => {
            let meditationStreak = 0;
            let skincareStreak = 0;
            const revDays = [...last7].reverse();
            for (const d of revDays) {
              const e = allData[d];
              if (e?.meditation === "done") meditationStreak++;
              else break;
            }
            for (const d of revDays) {
              const e = allData[d];
              if (e?.skincareAM === "done" && e?.skincarePM === "done") skincareStreak++;
              else break;
            }
            return (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                <div style={{background:"var(--color-background-secondary)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:600,color:"#639922"}}>{meditationStreak}</div>
                  <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>meditation streak</div>
                </div>
                <div style={{background:"var(--color-background-secondary)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:600,color:"#185FA5"}}>{skincareStreak}</div>
                  <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>skincare streak</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── SUNDAY REVIEW TAB ───────────────────────────── */}
      {activeTab === "review" && (
        <div>
          <div style={{background:"var(--color-background-secondary)",borderRadius:12,padding:"14px",marginBottom:16,borderLeft:"3px solid #639922"}}>
            <p style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",margin:"0 0 4px"}}>Weekly AI Review</p>
            <p style={{fontSize:12,color:"var(--color-text-secondary)",margin:0}}>
              {isSunday() ? "It's Sunday — perfect time to review your week." : "Available any time, best on Sundays. Based on your last 7 days of data."}
            </p>
          </div>

          {/* Week data quick summary */}
          {(() => {
            const filled = last7.filter(d => allData[d] && Object.values(allData[d]).some(v=>v!==""));
            return (
              <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:14}}>
                {filled.length} of 7 days tracked this week
              </div>
            );
          })()}

          <button onClick={generateReview} disabled={reviewLoading}
            style={{width:"100%",padding:"12px",borderRadius:10,border:"none",
              background:reviewLoading?"var(--color-background-secondary)":"#3B6D11",
              color:reviewLoading?"var(--color-text-secondary)":"white",
              fontSize:14,fontWeight:500,cursor:reviewLoading?"wait":"pointer",
              marginBottom:16,transition:"all 0.2s"}}>
            {reviewLoading ? "Generating your review..." : "Generate Sunday Review ✦"}
          </button>

          {reviewResult && (
            <div style={{background:"var(--color-background-secondary)",borderRadius:12,padding:"16px",marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                Week of {formatDateShort(getLast7Days()[0])} – {formatDateShort(getLast7Days()[6])}
              </div>
              <div style={{fontSize:13,color:"var(--color-text-primary)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>
                {reviewResult}
              </div>
            </div>
          )}

          {/* Past reviews */}
          {Object.keys(reviews).length > 0 && (
            <div>
              <p style={{fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Past reviews</p>
              {Object.entries(reviews).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,4).map(([wk, txt]) => (
                <details key={wk} style={{marginBottom:8}}>
                  <summary style={{cursor:"pointer",fontSize:12,color:"var(--color-text-secondary)",padding:"8px 10px",
                    background:"var(--color-background-secondary)",borderRadius:8,listStyle:"none"}}>
                    Week of {formatDateShort(wk)} ›
                  </summary>
                  <div style={{fontSize:12,color:"var(--color-text-primary)",lineHeight:1.7,
                    padding:"12px 10px",background:"var(--color-background-secondary)",
                    borderRadius:"0 0 8px 8px",marginTop:1,whiteSpace:"pre-wrap"}}>
                    {txt}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
