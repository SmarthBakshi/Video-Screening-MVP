.PHONY: dev down logs api web


dev:
	docker compose up -d --build


down:
	docker compose down


logs:
	docker compose logs -f


api:
	cd backend && uvicorn app.main:app --reload --port 8000


web:
	cd frontend && npm run dev