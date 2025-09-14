aurio – Video Screening MVP
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

*   [Architecture at a glance](#architecture-at-a-glance)
    
*   [Tech stack](#tech-stack)
    
*   [Project structure](#project-structure)
    
*   [Prerequisites](#prerequisites)
    
*   [Configuration (env)](#configuration-env)
    
*   [Run locally (no Docker)](#run-locally-no-docker)
    
*   [Run with Docker](#run-with-docker)
    
*   [Using MongoDB (and accessing it)](#using-mongodb-and-accessing-it)
    
*   [Switch DB backends: in-memory ↔ MongoDB](#switch-db-backends-in-memory--mongodb)
    
*   [API overview](#api-overview)
    
*   [Frontend routes](#frontend-routes)
    
*   [Design choices & extensibility](#design-choices--extensibility)
    
*   [Future enhancements](#future-enhancements)
    
    

Architecture at a glance
------------------------

**Hexagonal (“ports & adapters”)** design:

*   **Domain & Services** (pure Python): invite & video flows, validation, business rules
    
*   **Ports (interfaces)**: InviteRepo, VideoRepo, Storage
    
*   **Adapters**:
    
    *   Repos: InMemory or Mongo
        
    *   Storage: LocalFS (local folder); later: S3
        
*   **HTTP API**: FastAPI (/api/v1)
    
*   **Frontend**: React + TypeScript (Vite)
    

This keeps the core flow stable while letting you **swap infrastructure** with minimal code.

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

*   Python **3.12+** (or your installed Python; project tested with 3.12)
    
*   Node.js **v20+** and npm
    
*   (Optional) MongoDB **7.x** for persistent DB locally
    

**Docker:**

*   Docker Desktop (or Docker Engine + Compose v2)
    

Configuration (env)
-------------------

### Backend (local)

Create your backend/.env using backend/.env.example
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
    python3 -m venv .environment && . .environment/bin/activate
    pip install -r requirements.txt
    # frontend
    cd ../frontend
    npm install
    ```
    
2.  **Run api and web**
    
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
    
*   Mongo Express: [**http://localhost:8081**](http://localhost:8081)
    

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

*   Ensure `MONGO\_URL=mongodb://localhost:27017` and `DB_BACKEND=mongo` in `backend/.env`.
    
*   Use `mongosh`
    ```bash
    mongosh "mongodb://127.0.0.1:27017/aurio"
    ```
    

Switch DB backends: in-memory ↔ MongoDB
---------------------------------------

*   **In-memory** (default):
    
    *   No external services required
        
    *   Ephemeral; restart clears data
        
    *   Set: DB_BACKEND=inmemory
        
*   **MongoDB** (persistent):
    
    *   DB_BACKEND=mongoMONGO\_URL=mongodb://localhost:27017MONGO\_DB=aurio
        
    *   Docker: compose already wires DB_BACKEND=mongo and MONGO\_URL=mongodb://mongo:27017.
        

Restart the API after changing.

API overview
------------

Open Swagger: [**http://localhost:8000/docs**](http://localhost:8000/docs)

Key endpoints (all prefixed with /api/v1):

*   POST /invitesCreate an invite. Body: {"email": "candidate@example.com"}→ Returns { id, email, token, status }
    
*   GET /invitesList invites.
    
*   GET /invites/{token}Validate a candidate token, returns { ok: true, inviteId } if valid.
    
*   POST /upload/{token}Upload recorded video (multipart/form-data) as file.
    
*   GET /videos?inviteId={inviteId}List videos for an invite.
    
*   GET /videos/{videoId}Get single video metadata.
    
*   GET /videos/{videoId}/streamStream video content (served from uploads/).
    
*   POST /videos/{videoId}/tagBody: {"tag": "review"} → update tag.
    

Optional debug:

*   GET /\_debug/config → Shows active repo/storage (handy during setup).
    

Frontend routes
---------------

*   /admin
    
    *   Create invites (shows shareable r/:token link)
        
    *   See latest video per invite
        
    *   **Play / Preview** video & **Tag** it
        
*   /r/:token
    
    *   Candidate recording page (2-minute cap)
        
    *   Uploads to /upload/:token
        
*   /v/:id
    
    *   Playback page for a single video
        

Design choices & extensibility
------------------------------

*   **Clean boundaries** via Ports/Adapters (hexagonal):
    
    *   ports/ define **interfaces** (InviteRepo, VideoRepo, Storage)
        
    *   adapters/ implement them (InMemory/Mongo repos, LocalFS storage)
        
    *   **Swap** infra by changing env/config & DI wiring; no domain changes required
        
*   **Storage swap (S3-ready)**:
    
    *   Add adapters/storage/s3.py implementing Storage:
        
        *   save(key, bytes) → upload to S3
            
        *   get\_stream(key) → stream via presigned URL or proxy stream
            
    *   Configure via STORAGE\_BACKEND=s3 + AWS\_\* env + bucket name
        
    *   Optional: client-side direct uploads with **presigned POST** for large files
        
*   **Database swap**:
    
    *   Add adapters/repos/dynamo.py implementing repo interfaces
        
    *   Keep services/ untouched; only DI wiring and env change
        
*   **HTTP/API**:
    
    *   FastAPI schemas give clear contracts and Swagger UI for demos
        
    *   CORS locked to the FE origin (env override per environment)
        
*   **Maintainability**:
    
    *   Small, focused modules; readable services; explicit error types
        
    *   In-memory adapters make dev/testing trivial
        
    *   Mongo adapters add persistence without changing domain logic
        

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
    



App Demo script 
------------------

1.  Open **Admin**: [http://localhost:5173/admin](http://localhost:5173/admin) (local) or [http://localhost:8080/admin](http://localhost:8080/admin) (Docker)
    
2.  Create invite → copy link → open /r/:token
    
3.  Record ~10s → Upload
    
4.  Back to **Admin** → Refresh → **Play** + **Preview** + **Tag**
    
5.  (Optional) Open **Mongo Express** at [http://localhost:8081](http://localhost:8081) to show metadata