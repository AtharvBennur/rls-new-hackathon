# AI-Assign-Eval

**Smart AI Assignment Evaluator + Blog Generator System**

A full-stack web application for evaluating assignments using AI, getting quick writing feedback, and generating SEO-optimized blog content.

## Features

### 📝 Assignment Evaluator
- Upload PDF assignments for AI-powered analysis
- Get scores (0-10) with detailed feedback
- Grammar, structure, content, tone evaluation
- Plagiarism & AI content detection
- Download evaluation reports as PDF

### 💬 Quick AI Feedback
- Instant feedback on any text
- Chat-based writing assistant
- Grammar fixes and tone suggestions
- Export chat history

### ✍️ Blog Generator
- AI-generated blog posts with SEO optimization
- Custom tone, audience, and length settings
- AI review before publishing
- Plagiarism & AI pattern detection

### 🌐 Public Blog Feed
- Browse community blogs
- Like, comment, bookmark
- AI-powered toxicity filter for comments

### 🎮 Gamification
- Points for evaluations and blogs
- Level progression system
- Achievement badges

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas
- **Storage:** Cloudinary
- **Auth:** Firebase Authentication
- **AI:** GROQ AI (Llama 3.1)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Firebase project
- GROQ API key

### Installation

1. **Clone and install dependencies:**
```bash
cd "hackathon rls new"
npm run install:all
```

2. **Configure environment variables:**

Edit the `.env` file in the root directory:

```env
# MongoDB - Get from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-assign-eval

# Get these from respective services:
FIREBASE_PROJECT_ID=your-firebase-project-id
GROQ_API_KEY=your-groq-api-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

3. **Set up MongoDB Atlas:**
   - Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
   - Create a free cluster
   - Add database user and whitelist IP
   - Copy connection string to `.env`

4. **Run the application:**
```bash
npm run dev
```

This starts both:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, Navbar, Layout
│   │   │   └── ui/            # Reusable UI components
│   │   ├── pages/
│   │   │   ├── AssignmentEvaluator.jsx
│   │   │   ├── QuickFeedbackAI.jsx
│   │   │   ├── BlogGenerator.jsx
│   │   │   ├── PublicBlogs.jsx
│   │   │   ├── Account.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── context/           # Auth & Theme providers
│   │   ├── services/          # API & Firebase services
│   │   └── styles/            # TailwindCSS styles
│   └── package.json
│
├── backend/
│   ├── api/                   # Route handlers
│   ├── services/              # GROQ, Firebase, Cloudinary
│   ├── middleware/            # Auth verification
│   ├── models/                # MongoDB schemas
│   ├── utils/                 # PDF parsing, plagiarism check
│   └── index.js               # Express server
│
├── .env                       # Environment variables
└── package.json               # Root scripts
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/evaluate` | POST | Evaluate PDF assignment |
| `/api/evaluate/text` | POST | Evaluate text directly |
| `/api/feedback` | POST | Get quick feedback |
| `/api/feedback/chat` | POST | Chat-based feedback |
| `/api/blog/generate` | POST | Generate blog |
| `/api/blog/review` | POST | AI review blog |
| `/api/blogs` | GET/POST | Blog CRUD |
| `/api/blogs/feed` | GET | Public blog feed |
| `/api/comments/:blogId` | GET/POST | Comments |
| `/api/auth/sync` | POST | Sync user profile |
| `/api/history/dashboard` | GET | Dashboard stats |

## Scripts

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend

# Build frontend for production
npm run build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase admin email |
| `FIREBASE_PRIVATE_KEY` | Firebase admin private key |
| `GROQ_API_KEY` | GROQ AI API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Backend (Render/Railway)
1. Push to GitHub
2. Create new web service
3. Set environment variables
4. Deploy

## License

MIT License - feel free to use for your hackathon!

---

Built with ❤️ for the hackathon
