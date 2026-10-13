
# TaskFlow — To-Do List Application

TaskFlow is a full-stack task management application built with React,
FastAPI, and MongoDB. It allows users to create, view, complete, filter,
and delete tasks through a responsive interface.

## Features

- Create tasks with a title and optional description
- View tasks saved in MongoDB
- Mark tasks as completed or pending
- Delete tasks with confirmation
- Filter tasks by all, pending, and completed
- Dashboard statistics and completion progress
- Responsive desktop and mobile layout
- REST API with input validation and error handling
- Interactive API documentation through Swagger UI

## Technology Stack

- Frontend: React, Vite, JavaScript, CSS
- HTTP client: Axios
- Backend: Python, FastAPI
- Database: MongoDB
- Database driver: PyMongo

## Prerequisites

- Python 3.10 or later
- Node.js and npm
- MongoDB Community Server or an accessible MongoDB instance
- Git

## Project Structure

TaskFlow/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py
│   ├── .env.example
│   └── requirements.txt
├── .gitignore
└── README.md

## Backend Setup

Open a terminal in the project root.

Create and activate a virtual environment:

Windows PowerShell:

    cd backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt

Copy `.env.example` to `.env` in the backend directory and configure
the MongoDB connection string and database name.

Start MongoDB before running the API.

Run the backend:

    uvicorn app.main:app --reload

Backend URL: http://127.0.0.1:8000

Swagger documentation: http://127.0.0.1:8000/docs

Health check: http://127.0.0.1:8000/api/health

## Frontend Setup

Open a second terminal:

    cd frontend
    npm install

Copy `frontend/.env.example` to `frontend/.env`.

Run the development server:

    npm run dev

Open the local URL displayed by Vite, usually
http://localhost:5173.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Check API and database health |
| GET | /api/tasks | Retrieve all tasks |
| POST | /api/tasks | Create a task |
| PATCH | /api/tasks/{task_id} | Update task completion |
| DELETE | /api/tasks/{task_id} | Delete a task |

## Database

Database: `taskflow_db`

Collection: `tasks`

Each task stores an ID, title, description, completion status, and
creation timestamp. MongoDB creates the database and collection when
the first task is inserted.

## Testing

1. Verify that the API health check reports a healthy database.
2. Create a task and verify it appears in the list.
3. Mark the task as completed and verify its status.
4. Filter tasks by status.
5. Delete a task and verify that it is removed.
6. Refresh the browser and verify database persistence.

## Author

Developed as a full-stack technical assessment project.
