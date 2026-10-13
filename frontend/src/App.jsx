
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Check, Circle, ClipboardList, ListTodo, Plus,
  Trash2, RefreshCw, CheckCircle2, Clock3, X
} from "lucide-react";
import "./App.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
});

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/tasks");
      setTasks(response.data);
    } catch {
      setError("Unable to load tasks. Check that FastAPI and MongoDB are running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  const filteredTasks = useMemo(() => {
    if (filter === "pending") return tasks.filter((task) => !task.completed);
    if (filter === "completed") return tasks.filter((task) => task.completed);
    return tasks;
  }, [tasks, filter]);

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/tasks", {
        title: title.trim(),
        description: description.trim(),
      });
      setTasks((current) => [response.data, ...current]);
      setTitle("");
      setDescription("");
      setNotice("Task added successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add the task.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    setBusyId(task.id);
    setError("");
    setNotice("");
    try {
      const response = await api.patch(`/tasks/${task.id}`, {
        completed: !task.completed,
      });
      setTasks((current) =>
        current.map((item) => item.id === task.id ? response.data : item)
      );
      setNotice(response.data.completed ? "Task completed!" : "Task marked pending.");
    } catch {
      setError("Could not update the task. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    setBusyId(task.id);
    setError("");
    setNotice("");
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setNotice("Task deleted successfully.");
    } catch {
      setError("Could not delete the task. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  const filters = [
    { key: "all", label: "All tasks", count: tasks.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "completed", label: "Completed", count: completedCount },
  ];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="TaskFlow home">
          <span className="brand-icon"><ListTodo size={23} /></span>
          <span>TaskFlow<span className="brand-dot">.</span></span>
        </a>
        <span className="topbar-label"><span className="status-dot" /> Personal workspace</span>
      </header>

      <section className="dashboard">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>Stay on top of <span>your day.</span></h1>
            <p className="subtitle">A little progress every day adds up to big results.</p>
          </div>
          <div className="date-chip">
            <Clock3 size={16} />
            <span>{new Date().toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric"
            })}</span>
          </div>
        </div>

        <section className="stats-grid" aria-label="Task statistics">
          <article className="stat-card">
            <div className="stat-top"><span>Total tasks</span><ClipboardList size={19} /></div>
            <strong>{tasks.length}</strong>
            <p>Tasks in your workspace</p>
          </article>
          <article className="stat-card pending-stat">
            <div className="stat-top"><span>In progress</span><Clock3 size={19} /></div>
            <strong>{pendingCount}</strong>
            <p>Waiting to be completed</p>
          </article>
          <article className="stat-card completed-stat">
            <div className="stat-top"><span>Completed</span><CheckCircle2 size={19} /></div>
            <strong>{completedCount}</strong>
            <p>Tasks checked off</p>
          </article>
        </section>

        <section className="workspace">
          <div className="task-panel">
            <div className="panel-heading">
              <div>
                <h2>Your tasks</h2>
                <p>Keep your priorities clear and simple.</p>
              </div>
              <button className="icon-button refresh-button" onClick={loadTasks}
                title="Refresh tasks" aria-label="Refresh tasks">
                <RefreshCw size={17} />
              </button>
            </div>

            <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
              {filters.map((item) => (
                <button key={item.key}
                  className={`filter-tab ${filter === item.key ? "active" : ""}`}
                  onClick={() => setFilter(item.key)}
                  role="tab"
                  aria-selected={filter === item.key}>
                  {item.label}<span>{item.count}</span>
                </button>
              ))}
            </div>

            {error && <div className="feedback error-message" role="alert">{error}</div>}
            {notice && <div className="feedback success-message" role="status">
              <Check size={15} /> {notice}
              <button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15} /></button>
            </div>}

            <div className="task-list">
              {loading ? (
                <div className="empty-state">
                  <RefreshCw className="empty-icon spin" size={28} />
                  <h3>Loading your tasks...</h3>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><ListTodo size={27} /></div>
                  <h3>{filter === "all" ? "Your list starts here" :
                    filter === "pending" ? "All caught up!" : "Nothing completed yet"}</h3>
                  <p>{filter === "all" ? "Add a task using the form to get started." :
                    filter === "pending" ? "You've completed all your tasks. Great work!" :
                    "Complete a task and it will appear here."}</p>
                </div>
              ) : filteredTasks.map((task) => (
                <article key={task.id} className={`task-item ${task.completed ? "is-completed" : ""}`}>
                  <button className={`check-button ${task.completed ? "checked" : ""}`}
                    onClick={() => toggleTask(task)}
                    disabled={busyId === task.id}
                    aria-label={task.completed ? "Mark task pending" : "Mark task completed"}
                    title={task.completed ? "Mark pending" : "Complete task"}>
                    {task.completed ? <Check size={17} /> : <Circle size={21} />}
                  </button>
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <span className={`task-status ${task.completed ? "done" : "open"}`}>
                      {task.completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                  <button className="icon-button delete-button"
                    onClick={() => deleteTask(task)}
                    disabled={busyId === task.id}
                    aria-label={`Delete ${task.title}`} title="Delete task">
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
            <div className="panel-footer">
              <span>{completedCount} of {tasks.length} tasks completed</span>
              <div className="progress-track" aria-label="Task completion progress">
                <div className="progress-fill" style={{
                  width: `${tasks.length ? completedCount / tasks.length * 100 : 0}%`
                }} />
              </div>
            </div>
          </div>

          <aside className="form-panel">
            <div className="form-icon"><Plus size={22} /></div>
            <h2>Create a task</h2>
            <p className="form-subtitle">Write it down. Make it happen.</p>
            <form onSubmit={addTask}>
              <label htmlFor="task-title">Task title <span>*</span></label>
              <input id="task-title" value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Prepare for interview"
                maxLength={120} required />
              <div className="character-count">{title.length}/120</div>

              <label htmlFor="task-description">Description <span className="optional">(optional)</span></label>
              <textarea id="task-description" value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add a few details about this task..."
                rows={4} maxLength={500} />

              <button className="submit-button" type="submit" disabled={saving || !title.trim()}>
                {saving ? <><RefreshCw size={17} className="spin" /> Adding...</> :
                  <><Plus size={18} /> Add task</>}
              </button>
            </form>
            <div className="tip-box">
              <CheckCircle2 size={18} />
              <p><strong>Small tip</strong><br />Break big goals into small, actionable tasks.</p>
            </div>
          </aside>
        </section>
        <footer className="app-footer">TaskFlow <span>·</span> Built with React, FastAPI & MongoDB</footer>
      </section>
    </main>
  );
}

export default App;
