# CodeArena: Online Coding Platform

A LeetCode-style platform. Admins create coding problems with visible and hidden test cases. Students sign in, write Python or JavaScript in the browser, run it against sample tests, submit it for judging, earn points, and compete on a leaderboard.

**Tech:** Node.js 18+, Express, MongoDB (Mongoose), JWT authentication, React 18 (Vite, React Router). Submitted code is run by a built-in judge (Python 3 and Node.js runtimes).

> Note on "upgrade your existing Online Test Platform": this is a complete, standalone build. If you have code from an earlier test platform, its users, questions or UI can be merged in later.

## Features
- **User authentication:** register and sign in, bcrypt-hashed passwords, JWT bearer tokens, roles (`user`, `admin`)
- **Coding question management (admin):** create, edit and delete problems with title, statement, difficulty, points, tags, time limit, starter code per language
- **Test cases:** any number per problem; mark each as **visible** (shown as an example) or **hidden** (only pass/fail is revealed)
- **Code submission:** Python 3 and JavaScript. "Run samples" is a free dry run on visible tests; "Submit" judges every test and saves the attempt
- **Judge verdicts:** Accepted, Wrong answer, Runtime error (with the error message), Time limit exceeded, Output limit exceeded
- **Score calculation:** partial credit. `score = round(points × tests passed ÷ total tests)`. Your best submission per problem counts
- **Leaderboard:** total of best scores, then problems fully solved, then whoever reached the score first
- **Submission history** per problem, with "Load code" to restore an earlier attempt
- Six sample problems (Easy and Medium) are added on first run

## Prerequisites
| Tool | Version |
|---|---|
| Node.js | 18 or newer |
| MongoDB | 6 or 7, on localhost:27017 (or use the included Docker Compose file) |
| Python | 3.8+ available as `python3` (or `python` on Windows), needed to judge Python submissions |

## How to run

### 1. Start MongoDB
Either use your own MongoDB, or with Docker installed:
```bash
docker compose up -d
```

### 2. Backend (port 5000)
```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm start
```
On first start it creates the admin account and the sample problems. Edit `.env` to change settings. If Python is not found, set `PYTHON_CMD=python` (or `py`).

**Admin login:** `admin@example.com` / `Admin@12345` (change `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before first start).

### 3. Frontend (port 5173)
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. The dev server forwards `/api` to the backend.

### Optional: one server for everything
```bash
cd frontend && npm install && npm run build
cd ../backend && npm start        # now open http://localhost:5000
```
The backend serves `frontend/dist` automatically when it exists.

### Run the tests
```bash
cd backend
npm test
```
13 tests cover the judge (accepted, wrong answer, crash, infinite loop, endless output, both languages) and check every seeded problem's test cases against a reference solution.

## Try it
1. Create a student account, open **Sum of Two Numbers**, write a solution, press **Run samples**, then **Submit**.
2. Check your score on the problem list and the **Leaderboard**.
3. Sign in as admin, open **Manage problems**, create a new problem with a few hidden test cases.

How programs are judged: your program reads the test input from **stdin** and prints the answer to **stdout**. Trailing spaces and blank lines at the end are ignored when comparing.

## API reference
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | none | `name`, `email`, `password` |
| POST | `/api/auth/login` | none | returns `token` and `user` |
| GET | `/api/auth/me` | user | current user |
| GET | `/api/problems` | optional | list, with your solved/attempted status when signed in |
| GET | `/api/problems/:id` | none | statement, starter code, sample cases (hidden tests never included) |
| POST | `/api/problems` | admin | create problem |
| GET | `/api/problems/:id/admin` | admin | full problem including hidden tests |
| PUT / DELETE | `/api/problems/:id` | admin | update / delete (delete also removes its submissions) |
| POST | `/api/problems/:id/run` | user | `language`, `code`. Dry run on sample tests |
| POST | `/api/problems/:id/submit` | user | `language`, `code`. Judge all tests, save, score |
| GET | `/api/problems/:id/submissions` | user | your last 20 submissions |
| GET | `/api/leaderboard?limit=50` | none | ranked users |

Errors use `{ "message", "fieldErrors" }` with status 400 (validation), 401, 403, 404, 409, 429 (too many runs), 503 (language runtime missing), 500.

Example:
```bash
TOKEN=$(curl -s -X POST localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@12345"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")
curl localhost:5000/api/problems -H "Authorization: Bearer $TOKEN"
```

## How the judge works and its limits
Each submission is written to a temporary folder and run once per test case in a **separate process**: input on stdin, wall-clock time limit (process killed), 64 KB output cap, scrubbed environment, no shell, at most `JUDGE_CONCURRENCY` submissions judged at once, and 15 runs per user per minute.

**Important:** this protects against slow and runaway programs, but it is *not* a security sandbox. Submitted code runs with the same file and network access as the Node.js server. That is fine for learning, demos and trusted users on your own machine. Before exposing it to the public, run the backend in a locked-down container (read-only filesystem, no network, CPU and memory limits, non-root user), or move judging to a separate worker with a proper sandbox such as Docker or nsjail. Say this in interviews: it shows you understand the real engineering problem.

## Project structure
```
coding-platform/
├── docker-compose.yml           MongoDB for local development
├── backend/
│   ├── src/
│   │   ├── server.js, app.js, config.js, seed.js
│   │   ├── models/              User, Problem, Submission
│   │   ├── routes/              auth, problems (+ run/submit), leaderboard
│   │   ├── middleware/          JWT auth and roles, error handling
│   │   └── services/judge.js    sandboxed-process code runner
│   └── tests/                   judge and seed tests (node:test)
└── frontend/src/
    ├── App.jsx, api.js, auth.jsx, styles.css
    ├── pages/                   Problems, Problem, Leaderboard, Login, Admin, ProblemForm
    └── components/              CodeEditor, Results
```

## Troubleshooting
- **"Could not connect to MongoDB"**: start MongoDB (`docker compose up -d`) or fix `MONGO_URI` in `backend/.env`.
- **"The python runtime is not installed on the server"**: install Python 3, or set `PYTHON_CMD` in `.env`.
- **Port 5000 in use** (common on macOS): set `PORT=5001` in `.env` and update the proxy target in `frontend/vite.config.js`.
- **Editing a problem's test cases** does not re-score old submissions.

## Resume bullets (adapt as you like)
- Built a full-stack online coding platform (Node.js, Express, MongoDB, React) with JWT authentication, role-based admin tools and problem and test-case management.
- Implemented a code-judging service that runs Python and JavaScript submissions in isolated processes with time, output and concurrency limits, producing per-test verdicts and partial-credit scoring.
- Designed a leaderboard using MongoDB aggregation pipelines (best-submission-per-problem, tie-breaking), plus rate limiting, input validation (Zod) and automated tests.

## Ideas to extend it
Timed contests, Java and C++ support, Docker-based sandbox workers with a job queue, code-diff view, discussion threads, email verification, per-problem leaderboards.
