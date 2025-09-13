# Aurio Video Screening – MVP


Thin-slice MVP with hexagonal architecture: FastAPI backend + React/TS frontend. Swappable adapters for storage (LocalFS → S3) and DB (InMemory → real DB).


## Prereqs
- Python 3.11+
- Node 18+


## Run – Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```


## Run – Frontend
```bash
cd frontend
npm install
# set API base if needed: echo "VITE_API_BASE=http://localhost:8000/api/v1" > .env
npm run dev
```


Open http://localhost:5173/admin to create invites.


## Docker quickstart


```bash
# from repo root
make dev # builds and runs api + web (hot reload via bind-mounts)
# open http://localhost:5173/admin
```


## Notes
- Tokens are long random strings with 7‑day default TTL.
- Uploads are limited by MIME (webm/mp4) and size (50 MB default).
- Swap storage by implementing `StoragePort` (see `LocalFSStorage`).
- API base is versioned at `/api/v1`.


## Next steps
- S3 adapter with presigned PUT/GET.
- Real DB repo (Mongo or Dynamo) implementing `InviteRepoPort` & `VideoRepoPort`.
- Thumbnail + duration probe in a background worker.