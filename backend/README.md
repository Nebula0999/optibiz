# OptiBiz — Backend

OptiBiz is a business management platform designed to help SMEs and growing businesses manage their operations with efficiency and clarity. This is the backend service powering the platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Django 5.2 + Django REST Framework |
| Database | PostgreSQL (via psycopg3) |
| Auth | JWT (SimpleJWT) + Session Auth |
| Async Tasks | Celery + Redis |
| Real-time | Django Channels + Redis |
| API Docs | drf-spectacular (OpenAPI 3) |
| File Storage | django-storages (S3-compatible) |
| Static Files | WhiteNoise |
| PDF Generation | ReportLab |
| Server | Gunicorn + ASGI (Daphne) |

---

## Project Structure

```
backend/
├── apps/
│   ├── core/           # Shared utilities, base models
│   ├── users/          # Custom user model, auth (email or username login)
│   ├── business/       # Business profile & multi-business support
│   ├── products/       # Product catalog & categories
│   ├── inventory/      # Stock tracking & adjustments
│   ├── customers/      # Customer records & history
│   ├── sales/          # Sales orders & transactions
│   ├── expenses/       # Expense logging & categorization
│   ├── sacco/          # SACCO (savings & credit) module
│   └── notifications/  # In-app & push notifications
├── config/
│   ├── settings.py     # Django settings (env-driven)
│   ├── urls.py         # Root URL configuration
│   ├── celery.py       # Celery app setup
│   ├── asgi.py         # ASGI entrypoint (Channels)
│   └── wsgi.py         # WSGI entrypoint (Gunicorn)
├── manage.py
├── requirements.txt
└── .env                # Local environment variables (not committed)
```

---

## Key Features

- Multi-business support — one account can manage multiple business profiles
- Custom user model with email or username login
- Role-based permissions per business
- Inventory tracking with stock adjustments
- Sales and expense recording with reporting support
- SACCO module for savings and credit cooperative management
- Async background tasks via Celery (e.g. report generation, notifications)
- Real-time notifications via Django Channels (WebSocket)
- Auto-generated OpenAPI docs at `/api/schema/` and `/api/docs/`

---

## Getting Started

### Prerequisites

- Python 3.13+
- PostgreSQL
- Redis

## Docker

If you prefer to use Docker, you can run the backend in a containerized environment. Make sure you have Docker and Docker Compose installed.


### Setup

```bash
# Clone and navigate to backend
cd backend

# Create and activate virtual environment
python -m venv ../myvenv
source ../myvenv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env  # edit with your values

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

### Running Celery

```bash
# Worker
celery -A config worker --loglevel=info

# Beat scheduler (for periodic tasks)
celery -A config beat --loglevel=info
```

---

## API Documentation

Once the server is running, interactive API docs are available at:

- Swagger UI: `http://localhost:8000/api/docs/`
- OpenAPI schema: `http://localhost:8000/api/schema/`

---

## Environment Variables

All configuration is driven by environment variables. Copy `.env.example` to `.env` and fill in the required values. Never commit your `.env` file.

Key variables include database credentials, Django secret key, Redis URL, allowed hosts, and CORS origins.

---

## Frontend

The frontend is a separate React + Vite application located in the `../frontend/` directory. See its own README for setup instructions.
