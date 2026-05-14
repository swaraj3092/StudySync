# 📚 StudySync Agent — Full Project Plan
### Google Cloud Rapid Agent Hackathon Submission
**Track:** MongoDB Partner Bucket  
**IDE:** Google Antigravity  
**Team Size:** Up to 4  

---

## 🧠 Project Overview

**StudySync** is an AI-powered personal learning agent that lives in your Chrome extension and grows with you on a personalised dashboard platform. It automatically creates study sessions, captures notes, and manages tasks — while a Gemini-powered agent analyzes your entire study history to give you personalized plans, insights, and suggestions.

> *"Your AI study co-pilot, active on every tab."*

---

## 🎯 Problem Statement

Students face three core problems:
1. **Scattered notes** — highlights on browser, notes in notebooks, todos in apps, all disconnected
2. **No visibility** — they don't know how much time they're spending on what, or what needs revision
3. **Passive studying** — they consume content but don't get guided on what to do next

StudySync solves all three with a single toggle.

---

## 🏗️ Architecture Overview

┌─────────────────────────────────────────────────────────┐
│                  CHROME EXTENSION                        │
│  Toggle on any tab → Auto-detect page context            │
│  Create Session | Add Notes | Add Tasks | Open Dashboard │
└───────────────────────────┬─────────────────────────────┘
                            │ REST API calls
┌───────────────────────────▼─────────────────────────────┐
│                  FLASK BACKEND (Python)                  │
│  Session API | Notes API | Tasks API | Hybrid Agent Proxy│
└──────────┬─────────────┬─────────────┬─────────────┬────────┘
           │             │             │             │
┌──────────▼──────────┐  │  ┌──────────▼──────────┐  │  ┌──────────────▼─────────────┐
│   MongoDB Atlas      │  │  │  Google Cloud       │  │  │   Gemini 2.5 Flash GA      │
│   (MCP Server)       │  │  │  Agent Builder      │  │  │   (Generative Brain)       │
│                      │  │  │                     │  │  │                            │
│  sessions collection │  │  │  PDF-Grounded       │  │  │  - Reasoning & Planning     │
│  notes collection    │  ◄──┤  Librarian Engine   │  ◄──┤  - Conversational Logic    │
│  tasks collection    │     │                     │     │  - Study Planner Creation  │
└─────────────────────┘     └─────────────────────┘     └────────────────────────────┘
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Chrome Extension | HTML, CSS, JavaScript (Manifest V3) |
| Backend | Python, Flask |
| Frontend Dashboard | React.js |
| Database | MongoDB Atlas |
| AI Agent | Smart Hybrid (Agent Builder + Gemini 2.5 Flash) |
| Partner MCP | MongoDB MCP Server |
| IDE | Google Antigravity |
| Deployment | Google Cloud Run (backend), Vercel (frontend) |
| Auth | Google OAuth 2.0 |

---

## 📦 MongoDB Schema Design

### Collection 1: `users`
```json
{
  "_id": "ObjectId",
  "google_id": "string",
  "name": "string",
  "email": "string",
  "avatar": "string",
  "created_at": "timestamp",
  "streak": "number",
  "total_study_hours": "number"
}
```

### Collection 2: `sessions`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "title": "string",
  "source_url": "string",
  "source_type": "youtube | article | pdf | other",
  "subject": "string",
  "started_at": "timestamp",
  "ended_at": "timestamp",
  "duration_minutes": "number",
  "status": "active | completed"
}
```

### Collection 3: `notes`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "session_id": "ObjectId",
  "content": "string",
  "tags": ["string"],
  "created_at": "timestamp",
  "summary": "string (AI-generated)"
}
```

### Collection 4: `tasks`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "session_id": "ObjectId",
  "title": "string",
  "due_date": "timestamp",
  "priority": "high | medium | low",
  "status": "pending | done",
  "created_at": "timestamp"
}
```

### Collection 5: `insights`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "week_start": "timestamp",
  "total_hours": "number",
  "subjects_studied": ["string"],
  "weak_topics": ["string"],
  "recommended_topics": ["string"],
  "generated_at": "timestamp"
}
```

---

## 🔌 Chrome Extension — Layer 1

### What it does
- Detects the current tab's URL and page title automatically
- Toggles a sidebar panel on any website
- Auto-creates a study session when the user opens the extension
- Allows quick note-taking while staying on the tab
- Allows task creation with due date and priority
- "Open Dashboard" button to navigate to the full platform

### Extension File Structure
```
extension/
├── manifest.json         ← Manifest V3 config
├── popup.html            ← Main extension UI
├── popup.js              ← Logic for session, notes, tasks
├── popup.css             ← Styles
├── content.js            ← Page context detection
├── background.js         ← Service worker
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### manifest.json (key config)
```json
{
  "manifest_version": 3,
  "name": "StudySync Agent",
  "version": "1.0",
  "permissions": ["activeTab", "storage", "identity"],
  "action": { "default_popup": "popup.html" },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}
```

### Auto Session Creation Flow
```
User opens extension
       ↓
content.js reads → document.title + window.location.href
       ↓
Detect source_type:
  - youtube.com → "YouTube"
  - medium.com / any blog → "Article"
  - *.pdf URL → "PDF"
  - else → "Other"
       ↓
POST /api/sessions with { title, source_url, source_type }
       ↓
Session created in MongoDB
       ↓
Show sidebar with Notes + Tasks panels
```

---

## 🖥️ Flask Backend — API Layer

### File Structure
```
backend/
├── app.py                ← Main Flask app
├── config.py             ← MongoDB URI, Google OAuth config
├── requirements.txt
├── routes/
│   ├── auth.py           ← Google OAuth routes
│   ├── sessions.py       ← Session CRUD
│   ├── notes.py          ← Notes CRUD
│   ├── tasks.py          ← Task CRUD
│   └── agent.py          ← Gemini agent proxy
└── models/
    ├── session.py
    ├── note.py
    └── task.py
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions` | Get all sessions for user |
| PATCH | `/api/sessions/:id` | Update / end session |
| POST | `/api/notes` | Add note to session |
| GET | `/api/notes/:session_id` | Get notes for session |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks` | Get all tasks for user |
| PATCH | `/api/tasks/:id` | Update task status |
| POST | `/api/agent/chat` | Send message to Gemini agent |
| GET | `/api/insights` | Get personalized insights |

---

## 🌐 React Dashboard — Layer 3 (Personalised Platform)

### Pages & Features

#### 🏠 Home Page
- Greeting with user name and today's date
- Today's sessions summary (how many, total time)
- Pending tasks list with checkboxes
- Study streak counter (e.g. "🔥 7-day streak!")
- Gemini suggestion card: *"You studied ML for 2hrs yesterday. Ready to revise Backpropagation?"*
- Quick "Start Session" button

#### 📖 History Page
- Timeline view of all past sessions
- Filter by: Subject | Date Range | Source Type (YouTube/Article/PDF)
- Each session card shows: title, source, duration, notes count
- Click any session → expand to see full notes and tasks
- "Summarize this session" button → calls Gemini agent

#### 📅 Planner Page
- Weekly calendar view of study plan
- Agent-generated plan based on:
  - Pending tasks and their due dates
  - Past session patterns (when the user usually studies)
  - Weak topics detected from notes
- "Generate New Plan" button → triggers multi-step agent workflow:
  1. Agent reads all pending tasks from MongoDB
  2. Agent reads past session history
  3. Agent detects weak areas from notes content
  4. Agent generates a structured 7-day plan
  5. Plan saved back to MongoDB and displayed

#### 📊 Insights Page ← Personalisation Core
- **Study Heatmap** — GitHub-style calendar showing daily study activity
- **Subject Distribution** — Pie chart of time per subject
- **Best Study Times** — Bar chart: when the user studies most (morning/evening/night)
- **Weak Topics Panel** — AI-detected topics that need revision
- **Revision Nudges** — *"You haven't revisited CNNs in 7 days"*
- **Streak & Stats** — Current streak, total hours, sessions this month
- **Weekly Report Card** — AI-generated weekly summary with rating

#### 🤖 Agent Chat Page
- Full chat interface with the Gemini agent
- Agent has full context of the user's MongoDB data via MCP
- Example conversations the agent can handle:
  - *"Create a 5-day revision plan for my ML exam on May 20"*
  - *"What did I study last week?"*
  - *"Quiz me on today's notes"*
  - *"Which topic am I weakest in?"*
  - *"Summarize all my CNN notes"*
  - *"Mark all ML tasks as high priority"*
- Agent performs real multi-step actions — not just chat

### Dashboard File Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── History.jsx
│   │   ├── Planner.jsx
│   │   ├── Insights.jsx
│   │   └── AgentChat.jsx
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── SessionCard.jsx
│   │   ├── TaskItem.jsx
│   │   ├── NoteEditor.jsx
│   │   ├── StudyHeatmap.jsx
│   │   └── AgentMessage.jsx
│   └── services/
│       └── api.js            ← Axios calls to Flask backend
├── package.json
└── vite.config.js
```

---

## 🤖 Gemini Agent — Google Cloud Agent Builder

### Agent Configuration
- **Platform:** Vertex AI Agent Builder + Gemini API Hybrid
- **Model:** Gemini 2.5 Flash (Generative) + Discovery Engine (Grounded)
- **Tool:** MongoDB MCP Server (partner integration)

### Agent Tools (via MongoDB MCP)
| Tool | What It Does |
|---|---|
| `get_sessions` | Fetch all study sessions for a user |
| `get_notes` | Fetch notes, optionally filtered by session or topic |
| `get_tasks` | Fetch pending/completed tasks |
| `create_task` | Create a new task in MongoDB |
| `update_task` | Mark tasks as done or change priority |
| `save_plan` | Write a generated study plan to MongoDB |
| `get_insights` | Read aggregated study stats |

### Multi-Step Agent Workflow Example
**User:** *"Make me a 5-day study plan for my AI exam"*

```
Step 1: Agent calls get_tasks → finds "AI Exam on May 15"
Step 2: Agent calls get_sessions → scans past AI study sessions
Step 3: Agent calls get_notes → extracts topics already studied
Step 4: Agent identifies gaps (topics in syllabus not in notes)
Step 5: Agent generates day-by-day plan
Step 6: Agent calls save_plan → writes plan to MongoDB
Step 7: Agent returns formatted plan to user
```

### Agent System Prompt (core instruction)
```
You are StudySync, a personal AI study agent. You have access to the 
user's complete study history via MongoDB tools. You can read sessions, 
notes, tasks, and insights — and you can write new tasks and plans.

Your goals:
1. Help the user plan their studies based on their actual history
2. Identify weak areas from their notes
3. Remind them of pending tasks and upcoming deadlines
4. Generate quizzes from their notes on request
5. Always act — don't just answer. Use your tools to complete tasks.

Be concise, encouraging, and specific to the user's actual data.
```

---

## 🗺️ Development Roadmap

### Phase 1 — Foundation (Day 1–2)
- [ ] Set up MongoDB Atlas cluster
- [ ] Create all collections with sample data
- [ ] Set up Flask backend with all API routes
- [ ] Test API with Postman

### Phase 2 — Chrome Extension (Day 3)
- [ ] Build manifest.json and popup UI
- [ ] Implement content.js page detection
- [ ] Connect extension to Flask API
- [ ] Test session creation from YouTube and articles

### Phase 3 — React Dashboard (Day 4–5)
- [ ] Set up React project with Vite
- [ ] Build all 5 pages (Home, History, Planner, Insights, Agent Chat)
- [ ] Connect to Flask API via Axios
- [ ] Build Insights charts with Recharts

### Phase 4 — Gemini Agent (Day 6)
- [ ] Set up Google Cloud project
- [ ] Configure Vertex AI Agent Builder
- [ ] Connect MongoDB MCP server
- [ ] Write and test agent system prompt
- [ ] Test multi-step workflows

### Phase 5 — Polish & Submit (Day 7)
- [ ] Deploy Flask backend to Google Cloud Run
- [ ] Deploy React frontend to Vercel
- [ ] Make GitHub repo public with MIT license
- [ ] Record 3-minute demo video
- [ ] Fill Devpost submission form

---

## 📋 Hackathon Submission Checklist

- [ ] Hosted project URL (Cloud Run + Vercel)
- [ ] Public GitHub repository with MIT license in About section
- [ ] ~3 minute demo video (show extension toggle → session creation → dashboard → agent chat)
- [ ] MongoDB selected as partner track
- [ ] Devpost submission form completed

---

## 🏆 Why This Wins

| Judge Criteria | How StudySync Nails It |
|---|---|
| Moves Beyond Chat | Agent creates sessions, tasks, plans — it acts |
| Multi-Step Mission | 7-step plan generation workflow with MongoDB reads + writes |
| Partner Power (MongoDB) | All data stored and queried via MongoDB MCP |
| Real-World Problem | Every student needs this — the team uses it themselves |
| Technical Depth | Chrome Extension + Flask + React + Gemini + MongoDB MCP |
| Google Cloud Agent Builder | Gemini 3 agent hosted and orchestrated on Vertex AI |

---

## 👨‍💻 About the Builder

**Swaraj Kumar Behera**  
B.Tech CSE, KIIT University (Batch 2023–2027)  
GitHub: github.com/swaraj3092  
LinkedIn: linkedin.com/in/swaraj-kumar-behera-b48b07325  

Skills: Python, Flask, React, MongoDB, Java, ML, Data Analytics  
Previous Projects: Fixxo (WhatsApp AI complaint system), CardioPredict AI, NovaTrade P2P  

---

*Plan version 1.0 — Google Cloud Rapid Agent Hackathon 2026*
