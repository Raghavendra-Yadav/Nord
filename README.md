# Life Tracker App

A personal life OS for tracking habits, health, productivity, and self-improvement — with AI coaching and advanced analytics.

---

## What This Is

A full-stack web app built for one user (Raghavendra) to track every meaningful dimension of daily life: sleep, workouts, nutrition, meditation, mood, career deep work, finances, relationships, skincare, and more. Data feeds into a custom analytics engine that scores each domain, detects patterns, and surfaces actionable insights. An AI coach (Google Gemini) generates a daily review in the style of David Goggins, Andrew Huberman, and James Clear.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Vite 8 |
| Charts | Recharts (radar, line, bar, sparklines) |
| HTTP | Axios with auto-injected auth header |
| Icons | Lucide React |
| Date utils | date-fns |
| Markdown | react-markdown (AI review rendering) |
| Backend | Node.js, Express 5 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT (30-day tokens) + bcryptjs |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Testing | Jest 30 |
| Dev server | Nodemon |

---

## Project Structure

```
life-tracker-app/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Login, Register, Dashboard, ForgotPassword, ResetPassword
│   │   ├── components/     # All tab components + UI primitives
│   │   │   └── ui/         # PetalRadar, NordCharts, etc.
│   │   ├── context/        # AuthContext (user state + localStorage)
│   │   ├── api/            # Axios instance config
│   │   ├── utils/          # analyticsEngine.js (scoring, correlations, IEI)
│   │   └── styles/         # Nord design system CSS
│   ├── .env.example
│   └── vite.config.js
├── backend/
│   ├── models/             # User, Entry, Experiment, Task, SkincareProfile, InsightFeedback
│   ├── controllers/        # Business logic per route
│   ├── routes/             # auth, entries, experiments, tasks, skincare, reviews, insights
│   ├── middleware/         # JWT protect middleware
│   ├── config/             # MongoDB connection
│   ├── index.js            # Express entry point (port 5555)
│   ├── demo_seed.js        # Seeds demo user with 14 days of realistic data
│   └── seedTestData.js     # Seeds test user with patterned data
└── design_handoff_insights_redesign/  # Design mockups / reference assets
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- MongoDB (Atlas URI or local)
- Google Gemini API key

### Backend

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run dev            # nodemon, port 5555
```

Required `.env` keys:
```
PORT=5555
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
GEMINI_API_KEY=AIzaSy...
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# VITE_API_BASE_URL=http://localhost:5555/api
npm install
npm run dev            # Vite, port 5173
```

### Seed Data

```bash
node backend/demo_seed.js      # demo user, 14 days realistic data
node backend/seedTestData.js   # test user, 14 days patterned data
```

---

## Authentication

- Register → bcrypt hash password → store in MongoDB
- Login → validate password → return JWT (30-day expiry, contains user `_id`)
- Frontend stores token in localStorage; Axios interceptor attaches `Authorization: Bearer {token}` to every request
- `protect` middleware decodes JWT and attaches user to `req.user`
- Password reset: crypto token generated → hashed + stored with 10-min expiry → user submits new password with token

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Get JWT token |
| GET | `/me` | Current user profile |
| POST | `/xp` | Add XP / trigger level-up |
| PUT | `/profile` | Update name / profile picture |
| POST | `/forgotpassword` | Request reset email |
| PUT | `/resetpassword/:token` | Set new password |

### Entries — `/api/entries`
| Method | Path | Description |
|---|---|---|
| GET | `/history?days=N` | Last N days of entries |
| GET | `/:date` | Single day entry (YYYY-MM-DD) |
| PUT | `/:date` | Upsert entry for date |

### Experiments — `/api/experiments`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create experiment |
| GET | `/` | All user experiments |
| POST | `/:id/checkin` | Log check-in |
| PUT | `/:id/complete` | Complete or abandon |

### Tasks — `/api/tasks`
| Method | Path | Description |
|---|---|---|
| GET | `/:date` | Get task matrix |
| PUT | `/:date` | Upsert task matrix |

### Skincare — `/api/skincare`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get profile (creates if missing) |
| PUT | `/settings` | Update stacks and concerns |
| PUT | `/log` | Log daily routine |
| POST | `/analyze` | Gemini AI dermatologist analysis |

### Reviews — `/api/reviews`
| Method | Path | Description |
|---|---|---|
| POST | `/generate` | AI coaching review for a date |

### Insights — `/api/insights`
| Method | Path | Description |
|---|---|---|
| POST | `/feedback` | Log insight feedback |
| GET | `/feedback` | Insight feedback history |

---

## Database Models

### User
```
name, email, password (hashed), profilePic,
xp, level, badges[{id, title, dateEarned, icon}],
resetPasswordToken, resetPasswordExpire
```

### Entry (one per user per day, keyed by 'YYYY-MM-DD')
```
body:    sleepH, sleepBedtime, sleepWakeTime, sleepQ, wakeWithoutAlarm,
         workoutType, muscleGroup, exerciseMin, zone2Cardio, prHit, steps,
         meals, proteinGrams, ifFasting, firstMealTime, ateJunk, water,
         hubermanSunlight, coldShower, restingHR, hrv, weight, creatine, supplements

mind:    meditMin, journalMin, noPhoneFirstHour, readMin, podcastDone,
         learnNote, gogginsHardThing

mood:    mood, energy, focus, anxiety, stress, feelNote, emotionTags[]

vices:   mast, porn, coffee, vaping, vapAmt, alcohol, alcDrinks,
         screenT, doomScroll

career:  carHours, appsOut, skillPractice, projectWork, leetcode,
         networkingDone, carNote, deepWorkBlocks, flowState

finance: budget, spent, spentCat, saved, income, invested, investAmt,
         impulse, finNote

relations: social, meaningConvo, calledFamily, helpedSomeone,
           connectedWith, conflict, lonely

environ: roomClean, bedMade, mornRoutine, nightRoutine, outdoorTime,
         sunlight, phoneFree, creative

reflect: wins, struggles, gratitude, dayRating (1–10),
         onePercentBetter, intention, notes
```

### Experiment
```
title, hypothesis, durationDays, frequency,
startDate, status (active|completed|abandoned),
checkIns[{date, notes}], finalReflection
```

### Task
```
frog: {text, completed}
ivyTasks: [{text, completed, poms}]   (up to 6)
notToDo:  [{text, broken}]            (up to 3)
```

### SkincareProfile
```
stacks:     [{id, name, type: 'AM'|'PM', steps[]}]
concerns:   string[]
aiAnalysis: {routineAnalysis, lifestyleImpact, timeline, tips}
logs:       [{date, amStackName, pmStackName, amCompleted[], pmCompleted[], skinState}]
```

### InsightFeedback
```
insightId (e.g. 'sleep-mood-corr'), category, 
actionType (helpful|dismissed|saved|acted), context
```

---

## Frontend Tabs

### Log Tab
Daily entry form across 9 domains. Saves to `PUT /api/entries/:date` on submit.

### History Tab
Last 7 days:
- **PetalRadar** — 6-domain radar chart
- Weekly intelligence panel (wins/losses ratio, sleep debt, best day, creation/noise ratio)
- SparkBars for sleep, mood, energy
- Multiline chart for mood + energy correlation

### Month Tab
90-day view:
- Heatmap calendar (color intensity = day quality score)
- Consistency percentage
- 14-day deep work bar chart
- 7-day logging streak

### Insights Tab
Rolling 90-day window:
- Overall life score + delta vs previous period
- 9-domain radar
- Weekly trend line + 90-day moving average
- Correlation analysis (sleep↔mood, deep work↔focus, etc.)
- Smart insights: momentum, anomalies, behavioral patterns
- Per-insight feedback buttons (trains future analysis)

### Execution Tab
Daily task matrix (Ivy Lee method):
- **The Frog** — one must-do priority task (30 XP)
- **Ivy Tasks** — up to 6 tasks with Pomodoro estimates (10 XP each)
- **Not-To-Do** — 3 rules, tracks when broken

### Experiments Tab
Self-improvement trials:
- Create with title, hypothesis, duration, frequency
- Daily check-ins with notes
- Built-in Protocol Library: Dopamine Detox, Monk Mode, Carnivore Diet, Cold Shower Protocol
- XP: 20 per check-in, 100 on completion, 10 on abandon

### Coach Tab
AI daily review via Gemini 2.5 Flash:
- Ruthless, actionable tone (Goggins / Huberman / Clear)
- 2-sentence summary + 3 specific next-day actionables
- Gemini safety filters disabled to handle raw personal data

### Skincare Tab
- Define AM/PM skincare stacks
- Track daily routine completion
- AI dermatologist analysis: routine critique, lifestyle impact, 2/6/12-week projections

---

## Analytics Engine (`frontend/src/utils/analyticsEngine.js`)

Domain scoring uses physics-informed curves rather than linear scales:

| Domain | Model |
|---|---|
| Body | Gaussian (target: 7.5h sleep) |
| Mind | Logarithmic saturation (meditation + reading) |
| Mood | Sigmoid |
| Vices | Exponential decay (screen time half-life ~3h) |
| Career | Linear to 4 deep work blocks |
| Finance | Power-law decay ($30 guilt-free threshold) |
| Relations | Binary (meaningful conversation yes/no) |
| Environment | Weighted (room 70% + bed 30%) |
| Reflect | Quadratic power model |

**Pearson correlations** computed for: sleep↔mood, deep work↔focus, exercise↔energy, etc.

**IEI (Internal-External Indicator)**: detects "speedrunning" — when the user is maximizing extrinsic busy work instead of intrinsic depth. Surfaces a nudge in the UI.

---

## Gamification

- XP awarded on: completing the Frog (+30), each Ivy Task (+10), experiment check-in (+20), experiment completion (+100), experiment abandon (+10)
- Level formula: `nextLevelXp = level × 100 × 1.5`
- Badges stored on User model (future expansion)
- XP and level displayed in the right sidebar

---

## Design System

- Nord-inspired minimal aesthetic
- CSS custom properties in `frontend/src/styles/`
- Notion-like spacing and typography
- Custom chart components: PetalRadar, NordCharts, SparkBars

---

## Known Gaps / Future Work

- No Docker or production deployment config
- Email sending for password reset not wired (token returned directly in dev)
- Badge system exists on the model but no badge-awarding logic yet
- Test coverage is minimal (Jest configured, a few unit tests in `backend/tests/`)
- No rate limiting on API routes
- Single-user app — no multi-tenancy concerns but also no admin tooling
