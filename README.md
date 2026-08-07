# Todo App — Pro Level (Django REST + React)


Production-style structure: middleware, common reusable modules, env-based CORS,
consistent API response shapes, and a proper component architecture on the frontend.

## 📁 Folder Structure

```
todo-app-pro/
├── backend/
│   ├── backend/                # project core
│   │   ├── settings.py          (env-driven, CORS from .env)
│   │   ├── urls.py
│   │   ├── wsgi.py / asgi.py
│   ├── common/                  # shared/reusable app
│   │   ├── middleware.py         (RequestLoggingMiddleware, ExceptionLoggingMiddleware)
│   │   ├── exceptions.py         (custom DRF exception handler → consistent error JSON)
│   │   ├── pagination.py         (StandardResultsPagination)
│   │   └── responses.py          (success_response helper)
│   ├── todos/                   # feature app
│   │   ├── models.py / serializers.py / views.py / urls.py / admin.py
│   ├── .env / .env.example
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── assets/
    │   │   ├── css/variables.css   (design tokens: colors, spacing)
    │   │   └── images/
    │   ├── components/
    │   │   ├── common/              (Button, Input, Loader, ErrorMessage)
    │   │   └── todo/                (TodoForm, TodoList, TodoItem)
    │   ├── pages/
    │   │   └── TodoPage.js          (wires everything together)
    │   ├── services/
    │   │   ├── api.js               (axios instance + interceptors — the "frontend middleware")
    │   │   └── todoService.js       (all todo API calls)
    │   ├── App.js
    │   └── index.js
    ├── .env / .env.example
    └── package.json
```

## 🔧 What's "pro" about this vs the basic version

**Backend**
- `.env` driven config — `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, and **CORS origins** all come from environment variables, not hardcoded in `settings.py`.
- Custom middleware in `common/middleware.py`:
  - `RequestLoggingMiddleware` — logs every request's method, path, status, and duration.
  - `ExceptionLoggingMiddleware` — catches unhandled exceptions and returns clean JSON instead of an HTML traceback.
- Custom DRF exception handler (`common/exceptions.py`) — every API error comes back in the same `{ success: false, error: {...} }` shape.
- Standard pagination (`common/pagination.py`) — every list endpoint returns `{ success, count, next, previous, results }`.
- `todos/views.py` supports `?search=<text>` and `?completed=true/false` query params.
- Structured logging configured in `settings.py`.

**Frontend**
- `src/services/api.js` — single axios instance with request/response interceptors (logs calls, normalizes errors). Every API call goes through this.
- `src/services/todoService.js` — API calls live here, not scattered inside components.
- `src/components/common/` — reusable `Button`, `Input`, `Loader`, `ErrorMessage`, each with its own CSS.
- `src/components/todo/` — feature components: `TodoForm`, `TodoList`, `TodoItem`.
- `src/assets/css/variables.css` — CSS custom properties (colors, spacing, radius) shared across all components.
- `src/pages/TodoPage.js` — the page-level component that wires services + components together; `App.js` stays a thin shell.

## 🚀 Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

pip install -r requirements.txt

# .env is already included with working local defaults — edit if needed

python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

Runs at **http://127.0.0.1:8000**
- API: `http://127.0.0.1:8000/api/todos/`
- Health check: `http://127.0.0.1:8000/api/health/`
- Admin: `http://127.0.0.1:8000/admin/` (run `python manage.py createsuperuser` first)

## ⚛️ Frontend Setup

```bash
cd frontend
npm install
npm start
```

Runs at **http://localhost:3000**

## 🔐 CORS — how it's handled properly

Instead of hardcoding `CORS_ALLOWED_ORIGINS` in `settings.py`, it's read from `.env`:

```
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

To allow a deployed frontend later, just add its URL to `.env` — no code change needed.
`CORS_ALLOW_METHODS` and `CORS_ALLOW_HEADERS` are explicitly whitelisted rather than left wide open.

## 🧪 Quick API test

```bash
curl http://127.0.0.1:8000/api/health/
curl http://127.0.0.1:8000/api/todos/
curl -X POST http://127.0.0.1:8000/api/todos/ -H "Content-Type: application/json" -d '{"title":"Learn Django"}'
```

## 📌 Extending this

- Add auth: create an `accounts` app, add `rest_framework_simplejwt`, protect `TodoViewSet` with `permission_classes`.
- Add more middleware in `common/middleware.py` and register it in `settings.py` `MIDDLEWARE` list.
- Add more shared UI in `components/common/` — e.g. `Modal.js`, `Toast.js`.
