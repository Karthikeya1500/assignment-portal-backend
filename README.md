# Assignment Portal — Backend

REST API for the Assignment Workflow Portal. Built with **Node.js**, **Express.js** and **MongoDB**.

## Features

- JWT-based authentication (register / login)
- Role-based access control (teacher & student)
- Full assignment lifecycle: **Draft → Published → Completed**
- File upload support via Multer (max 50 MB)
- Server-side validation on every endpoint
- Submissions with "mark as reviewed" functionality
- Due-date enforcement — late submissions are rejected

## Tech Stack

| Layer       | Technology         |
|-------------|--------------------|
| Runtime     | Node.js            |
| Framework   | Express.js         |
| Database    | MongoDB (Mongoose) |
| Auth        | JWT + bcrypt       |
| File Upload | Multer             |

## Prerequisites

- Node.js v18+  
- npm  
- A MongoDB Atlas cluster (or local MongoDB instance)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file in the project root
MONGO_URI=<your-mongodb-connection-string>
PORT=5001
JWT_SECRET=<your-secret-key>

# 3. Start in development mode
npm run dev

# 4. Or start in production mode
npm start
```

The server runs on `http://localhost:5001` by default.

## API Endpoints

### Auth
| Method | Endpoint            | Description       |
|--------|---------------------|--------------------|
| POST   | /api/auth/register  | Register new user  |
| POST   | /api/auth/login     | Login, get JWT     |

### Assignments (Teacher)
| Method | Endpoint                                  | Description                 |
|--------|-------------------------------------------|-----------------------------|
| GET    | /api/assignments                          | Get own assignments         |
| POST   | /api/assignments                          | Create assignment (Draft)   |
| PUT    | /api/assignments/:id                      | Edit assignment             |
| PUT    | /api/assignments/:id/publish              | Publish (Draft → Published) |
| PUT    | /api/assignments/:id/complete             | Complete (Published → Done) |
| DELETE | /api/assignments/:id                      | Delete (Draft only)         |
| GET    | /api/assignments/:id/submissions          | View student submissions    |
| PUT    | /api/assignments/:id/submissions/:subId/review | Mark submission reviewed |

### Assignments (Student)
| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| GET    | /api/assignments/published     | List published assignments |
| GET    | /api/assignments/my-submissions| Get own submissions       |
| POST   | /api/assignments/submit        | Submit answer + file      |

## Project Structure

```
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authcontroller.js     # Register & login logic
│   └── assignmentcontroller.js # Assignment CRUD + submissions
├── middleware/
│   └── authmiddleware.js     # JWT verification + role auth
├── models/
│   ├── user.js               # User schema
│   ├── assignment.js         # Assignment schema
│   └── submission.js         # Submission schema
├── routes/
│   ├── authroutes.js         # Auth endpoints
│   └── assignmentroutes.js   # Assignment endpoints
├── uploads/                  # Uploaded files directory
├── server.js                 # Express app entry point
└── .env                      # Environment variables
```

## Notes

- Assignment status follows a strict workflow: Draft → Published → Completed.
- Published assignments **cannot** be deleted.
- Completed assignments are fully locked — no edits allowed.
- Students cannot submit after the due date has passed.
- Each student can submit only once per assignment.
