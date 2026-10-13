
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from pymongo.errors import PyMongoError

load_dotenv()

MONGODB_URL = os.getenv(
    "MONGODB_URL", "mongodb://localhost:27017"
)
DATABASE_NAME = os.getenv("DATABASE_NAME", "taskflow_db")

client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=3000)
db = client[DATABASE_NAME]
tasks_collection = db["tasks"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    client.admin.command("ping")
    tasks_collection.create_index("created_at")
    yield
    client.close()


app = FastAPI(
    title="TaskFlow API",
    description="REST API for managing to-do tasks",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)


class TaskUpdate(BaseModel):
    completed: bool


def serialize_task(task: dict) -> dict:
    return {
        "id": str(task["_id"]),
        "title": task["title"],
        "description": task.get("description", ""),
        "completed": task.get("completed", False),
        "created_at": task["created_at"].isoformat(),
    }


def find_task(task_id: str) -> dict:
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=400, detail="Invalid task ID"
        )

    task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    if task is None:
        raise HTTPException(
            status_code=404, detail="Task not found"
        )
    return task


@app.get("/")
def root():
    return {"message": "Welcome to TaskFlow API", "docs": "/docs"}


@app.get("/api/health")
def health():
    try:
        client.admin.command("ping")
        return {"status": "healthy", "database": "connected"}
    except PyMongoError:
        raise HTTPException(
            status_code=503, detail="Database unavailable"
        )


@app.get("/api/tasks")
def get_tasks():
    tasks = tasks_collection.find().sort("created_at", -1)
    return [serialize_task(task) for task in tasks]


@app.post("/api/tasks", status_code=status.HTTP_201_CREATED)
def create_task(task_data: TaskCreate):
    title = task_data.title.strip()
    if not title:
        raise HTTPException(
            status_code=422, detail="Task title cannot be empty"
        )

    task = {
        "title": title,
        "description": task_data.description.strip(),
        "completed": False,
        "created_at": datetime.now(timezone.utc),
    }

    result = tasks_collection.insert_one(task)
    task["_id"] = result.inserted_id
    return serialize_task(task)


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: str, update_data: TaskUpdate):
    find_task(task_id)

    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"completed": update_data.completed}},
    )

    return serialize_task(find_task(task_id))


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str):
    find_task(task_id)

    tasks_collection.delete_one({"_id": ObjectId(task_id)})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
