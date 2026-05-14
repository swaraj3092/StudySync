# ✦ StudySync AI: The Autonomous Study Ecosystem

StudySync is a next-generation AI-powered study platform designed to transform passive content consumption into active, high-retention learning. Built for the modern student, it combines deep analysis of YouTube lectures with an agentic study companion that manages your revision schedule.

## 🚀 Key Features

- **Mission Control Dashboard**: A premium, distraction-free interface for managing your academic life.
- **YouTube Intelligence**: Extract key concepts and visual notes from lectures in real-time.
- **Agentic Planner**: An autonomous study companion that build and syncs revision schedules directly to your calendar.
- **Active Recall Engine**: Instant AI-generated quizzes based on your study history to solidify knowledge.
- **Neural Handover Protocol**: Seamlessly switch between specialist AI agents (Math, Coding, Research) depending on your subject.
- **Cross-Platform Sync**: Browser extension for capture, Web app for revision.

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: Flask (Python)
- **AI Brain**: Google Gemini 2.5 Flash
- **Database**: MongoDB Atlas
- **Deployment**: Vercel (Frontend & Serverless Backend)

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB Atlas Account
- Google AI Studio (Gemini) API Key

### Setup
1. Clone the repository
2. **Frontend**:
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```
3. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

## 🌐 Deployment

This project is configured for one-click deployment on **Vercel**.
- The `vercel.json` maps the `/api` route to the Python serverless functions.
- Ensure all environment variables (`GEMINI_API_KEY`, `MONGO_URI`) are set in the Vercel Dashboard.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ for the Google Cloud & Gemini Hackathon.*
