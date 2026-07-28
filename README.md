# CreatorIQ

AI-powered content intelligence platform for content creators.

## Features
- Competitor Monitoring
- Trend Detection
- Content Ideation
- Performance Prediction
- Multi-Platform Optimization
- Team Collaboration

## Tech Stack
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Frontend**: React 19 + TypeScript (Create React App)
- **APIs**: YouTube, Twitter, Instagram
- **Hosting**: Vercel (frontend) + Railway (backend)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (either a local install, or Docker — a `docker-compose.yml` is included in `backend/` that runs Postgres on port `5433`)

### Installation

```bash
# Clone repo
git clone https://github.com/aashish21code/creatoriq-mvp.git
cd creatoriq-mvp

# Backend setup
cd backend
npm install
cp .env.example .env
# If using the bundled Postgres container:
docker compose up -d
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
# The dev server defaults to port 3000, which the backend already uses —
# run it on a different port:
PORT=3001 npm start
```

The backend runs at `http://localhost:3000`, the frontend at `http://localhost:3001`.

### Environment Variables
Create `.env` in the backend folder (see `backend/.env.example` for the full list):

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5433/creatoriq
JWT_SECRET=change_this_to_a_long_random_string
YOUTUBE_API_KEY=
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
REDIS_URL=redis://localhost:6379
```

Create `.env.local` in the frontend folder:

```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_AUTH0_DOMAIN=
REACT_APP_AUTH0_CLIENT_ID=
```

## Development Roadmap
- Week 1-3: Foundation & Authentication
- Week 4-6: Competitor Monitoring
- Week 7-9: Content Ideation
- Week 10-12: Performance Prediction
- Week 13-14: Multi-Platform Optimization
- Week 15-16: Team Collaboration

## License
MIT

## Author
Aashish Prajapati
