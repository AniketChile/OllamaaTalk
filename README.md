# 💬 Ollama Talk

A full-stack AI chat application powered by **Node.js**, **Express**, **PostgreSQL**, **Next.js**, and **Ollama** for local LLM inference. The app allows users to create chat sessions, send messages, and receive AI responses **streamed in realtime**, token-by-token.

## ✨ Features

- 🧠 AI Assistant using Ollama and local LLMs (e.g., `gemma3`)
- 📡 Server-Sent Events (SSE) for realtime streaming responses
- 📂 Chat history storage with PostgreSQL
- 🌐 Frontend built with Next.js
- 🗃️ Backend with Express and RESTful APIs
- 💬 Live typing effect in the frontend
- 🔒 Abort/Stop generation via API

---

## 🛠️ Tech Stack

**Frontend**
- [Next.js](https://nextjs.org/)
- React hooks (`useEffect`, `useState`)
- Fetch API with EventSource for SSE

**Backend**
- Node.js with Express
- PostgreSQL with `pg` package
- Streaming LLM generation with Ollama API

**Database**
- PostgreSQL
- `chats` table: Stores chat session metadata
- `messages` table: Stores messages per chat

---

