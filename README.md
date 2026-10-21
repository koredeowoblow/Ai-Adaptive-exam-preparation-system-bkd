# AI Adaptive Exam Preparation System - Backend

Backend service that powers adaptive question delivery, session state management, and automated theory grading using AI.

## Tech Stack

- Node.js and Express (TypeScript)
- MongoDB with Mongoose
- BullMQ and Redis for background job queues
- Groq Cloud SDK for AI theory question evaluation
- Zod for validation and Winston for logging

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Required variables (use your own credentials):

- `PORT`: Server port (default 3000)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_HOST`: Redis host address
- `REDIS_PORT`: Redis port (default 6379)
- `JWT_SECRET`: Secret key for JWT signing (at least 32 characters)
- `GROQ_API_KEY`: Groq API key for AI grading
- `LOG_LEVEL`: Logging verbosity level (info, debug, etc.)

### 3. Run the development server

```bash
npm run dev
```

To build for production:

```bash
npm run build
npm start
```

> [!IMPORTANT]
> **Redis Requirement & Mock Redis Limitations:**
> In development/testing environments, setting `REDIS_HOST=mock` activates an in-memory Redis mock (`ioredis-mock`). Note that **mock Redis loses all queued, active, and deduplication jobs on server restart or process exit**. Production environments require a real, dedicated Redis deployment with persistence (AOF/RDB) enabled to guarantee job durability and prevent dropped grading sessions.

## Note

This repository is part of a final year undergraduate engineering project.
