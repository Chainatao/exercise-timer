# Exercise Timer

A browser-based exercise timer served via FastAPI, deployable as a Docker microservice with GitHub Actions CI/CD.

## State category: `ephemeral`

Fully stateless — no local storage, no database. The container can be freely restarted or replaced.

---

## Local development

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000`.

---

## Docker

```bash
docker build -t exercise-timer .
docker run -p 8000:8000 exercise-timer
```

---

## Deployment

### Prerequisites

On the VPS, create the service directory and `.env` file:

```bash
mkdir -p /opt/services/exercise-timer
cp .env.example /opt/services/exercise-timer/.env
# edit .env with your real values
cp docker-compose.yml /opt/services/exercise-timer/docker-compose.yml
```

### GitHub Actions secrets required

None. `GITHUB_TOKEN` is provided automatically by GitHub Actions for GHCR image pushes.

### CI/CD flow

1. Push to `main`
2. GitHub Actions builds the Docker image
3. Image is pushed to `ghcr.io/<owner>/exercise-timer:latest` + commit SHA tag
4. **Watchtower** on the VPS detects the new image and restarts the container automatically

---

## Health check

```
GET /health
→ {"success": true, "data": {"status": "ok"}, "error": null}
```

---

## Project structure

```
exercise-timer/
├── app/
│   ├── main.py          # FastAPI entry point
│   └── static/          # Served static assets
│       ├── index.html
│       ├── app.js
│       └── styles.css
├── tests/
│   └── test_health.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── .github/
    └── workflows/
        └── deploy.yml
```
