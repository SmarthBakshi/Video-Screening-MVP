Video Screening MVP
===========================

A pragmatic, end-to-end MVP for async video screening:

*   **Create** invite links for candidates

*   **Record** a short video in the browser (≤ 2 minutes)
    
*   **Upload & store** the video file
    
*   **Play back** videos in the app
    
*   **Tag** videos (e.g., pending, review, advance, pass)
    

Built with clean, swappable boundaries so you can later swap **storage** (Local FS → S3) and **database** (In-memory → MongoDB → DynamoDB) with minimal changes.

Table of Contents
-----------------
    
*   [Tech stack](#tech-stack)
    
*   [Project structure](#project-structure)
    
*   [Prerequisites](#prerequisites)
    
*   [Configuration (env)](#configuration-env)
    
*   [Run locally (no Docker)](#run-locally-no-docker)
    
*   [Run with Docker](#run-with-docker)
    
*   [Accessing metadata stored in MongoDB](#accessing-metadata-stored-in-mongodb)
    
*   [Switch DB backends](#switch-db-backends)
    
*   [Future enhancements](#future-enhancements)
    
*   [App Walkthrough](#app-walkthrough)      


Tech stack
----------

*   **Backend**: Python 3.12, FastAPI, Uvicorn
    
*   **Frontend**: React 18, TypeScript, Vite
    
*   **Storage**: Local filesystem (readily swappable with AWS S3)
    
*   **Database**: In-memory (default) or MongoDB 7
    
*   **Containerization**: Docker, docker compose
    
*   **Dev comfort**: Minimal Makefile targets
    

Project structure
-----------------
```
├── .gitignore
├── Makefile
├── README.md
├── backend
    ├── .dockerignore
    ├── .env.docker
    ├── .env.example
    ├── .gitignore
    ├── Dockerfile
    ├── app
    │   ├── __init__.py
    │   ├── adapters
    │   │   ├── __init__.py
    │   │   ├── repos
    │   │   │   ├── __init__.py
    │   │   │   ├── inmemory.py
    │   │   │   └── mongo.py
    │   │   └── storage
    │   │   │   ├── __init__.py
    │   │   │   └── local_fs.py
    │   ├── config.py
    │   ├── domain
    │   │   ├── __init__.py
    │   │   ├── errors.py
    │   │   └── models.py
    │   ├── http
    │   │   ├── __init__.py
    │   │   ├── api_v1.py
    │   │   └── schemas.py
    │   ├── main.py
    │   ├── ports
    │   │   ├── __init__.py
    │   │   ├── repos.py
    │   │   └── storage.py
    │   └── services
    │   │   ├── __init__.py
    │   │   ├── invites.py
    │   │   └── videos.py
    └── requirements.txt
├── docker-compose.yml
└── frontend
    ├── .dockerignore
    ├── .env.docker
    ├── Dockerfile
    ├── index.html
    ├── nginx.conf
    ├── package-lock.json
    ├── package.json
    ├── src
        ├── App.tsx
        ├── api
        │   └── client.ts
        ├── components
        │   └── Recorder.tsx
        ├── main.tsx
        ├── pages
        │   ├── Admin.tsx
        │   ├── Playback.tsx
        │   ├── Record.tsx
        │   └── Video.tsx
        └── vite-env.d.ts
    ├── tsconfig.json
    └── vite.config.ts

```

Prerequisites
-------------

**Local (no Docker):**

*   Python **3.12+** 
    
*   Node.js **v20+** and npm
    
*   (Optional) MongoDB **7.x** for persistent DB locally
    

**Docker:**

*   Docker Desktop (or Docker Engine + Compose v2)
    

Configuration (env)
-------------------

### Backend (local)

Create your `backend/.env` using `backend/.env.example`
 > Set `DB_BACKEND=mongo` to use MongoDB locally, by default it uses 'inmemory'.

### Backend (Docker)

`backend/.env.docker` (already used by compose):

### Frontend

Local dev uses VITE\_API\_BASE from the Makefile (defaults to http://localhost:8000/api/v1). Docker build uses `frontend/.env.docker`

Run locally (no Docker)
-----------------------


### Steps

1. **Install requirements**
    ```bash
    # backend
    cd backend
    python3 -m venv .environment && source .environment/bin/activate # For Unix/Linux
    python3 -m venv .environment && .environment\Scripts\activate # For Windows
    pip install -r requirements.txt
    # frontend
    cd ../frontend
    npm install
    ```
    
2.  **Run api and web (from root)**
    
    ```bash
    make api # API → http://localhost:8000/docs
    make web # Web → http://localhost:5173/admin
    ```
        
3.  **Switch DB backend** 

    Set `DB_BACKEND=inmemory` (default) or `mongo` in `backend/.env` and restart API.
    

Run with Docker
---------------
 **One command from repo root**
    
    make dev 
    

Open:

*   Web (Admin): [**http://localhost:8080/admin**](http://localhost:8080/admin)
    
*   API docs: [**http://localhost:8000/docs**](http://localhost:8000/docs)
        

**To stop:**

    make down



> Docker compose spins up: **api**, **web**, **mongo**, **mongo-express**.Uploaded files persist in the backend\_uploads volume; Mongo data in mongo\_data.

Accessing metadata stored in MongoDB
--------------------------------

### In Docker

*   Web UI: [**http://localhost:8081**](http://localhost:8081)
    
*   Shell:
    ```bash
    docker compose exec mongo mongosh "mongodb://localhost:27017/aurio"
    show collections
    db.invites.find().sort({created\_at:-1}).limit(3).pretty()
    db.videos.find().sort({created\_at:-1}).limit(3).pretty()
    ```

### Locally (no Docker)

*   Ensure `MONGO_URL=mongodb://localhost:27017` and `DB_BACKEND=mongo` in `backend/.env`.
    
*   Use `mongosh`
    ```bash
    mongosh "mongodb://127.0.0.1:27017/aurio"
    ```
    

Switch DB backends
---------------------------------------

*   **In-memory** (default):
    
    *   No external services required
        
    *   Ephemeral; restart clears data
        
    *   Set: DB_BACKEND=inmemory
        
*   **MongoDB** (persistent):
    
    *   Local: run MongoDB locally and set:
    ```bash
    DB_BACKEND=mongo
    MONGO_URL=mongodb://localhost:27017
    MONGO_DB=aurio
    ```    
    *   Docker: compose already wires `DB_BACKEND=mongo` and `MONGO_URL=mongodb://mongo:27017`.
        

Restart the API after changing.

Future enhancements
-------------------

*   **Storage**: AWS S3 integration (presigned uploads, lifecycle rules, CDN)
    
*   **Video processing**: background transcoding (e.g., to MP4/HLS), thumbnails

*   **Automatic tagging**: analyse the video and automatically suggest tags
    
*   **Security**: auth for admin UI, signed/expiring links, rate limiting
    
*   **Observability**: structured logging, request IDs, /healthz, metrics
    
*   **Scalability**: chunked uploads/resume, object storage events, job queue
    
    
*   **Testing**: service/integration tests, fixtures for in-memory repos
    
*   **CI/CD**: lint/typecheck/build/test on PRs; push images on main
    



App Walkthrough 
------------------

1.  Open **Admin**: [http://localhost:5173/admin](http://localhost:5173/admin) (local) or [http://localhost:8080/admin](http://localhost:8080/admin) (Docker)
    
2.  Create invite → copy link → open /r/:token
    
3.  Record ~10s → Upload
    
4.  Back to **Admin** → Refresh → **Play** + **Preview** + **Tag**
    
5.  (Optional) Open **Mongo Express** at [http://localhost:8081](http://localhost:8081) to show metadata
