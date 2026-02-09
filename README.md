# smart-life-api

A Node.js + Express REST API backed by PostgreSQL, designed for secure user management and extensible domain features. The API uses JWT-based authentication, Swagger for API documentation, and is cloud-ready (Google Cloud / Cloud SQL).

---

## 🚀 Features

* Express.js REST API
* PostgreSQL with connection pooling (`pg`)
* JWT Authentication & Authorization middleware
* Swagger (OpenAPI) documentation
* Environment-based configuration (`dotenv`)
* Secure database access & role-based permissions
* Cloud-ready (Google Cloud SQL compatible)

---

## 🧱 Tech Stack

* **Node.js** (ES Modules)
* **Express.js**
* **PostgreSQL**
* **pg / pg-pool**
* **jsonwebtoken**
* **dotenv**
* **swagger-jsdoc & swagger-ui-express**

---

## 📁 Project Structure

```
smart-life-api/
├── src/
│   ├── routes/
│   │   ├── users.routes.js
│   ├── auth.js
│   ├── dbclient.js
│   ├── swagger.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Installation

```bash
npm install
```

### Required NPM Packages

```bash
npm install express pg dotenv jsonwebtoken swagger-jsdoc swagger-ui-express
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000

DB_HOST=localhost
DB_USER=smart_user
DB_PASSWORD=your_password
DB_NAME=smart_life

JWT_SECRET=your_jwt_secret
```

> ⚠️ Never commit your `.env` file to source control.

---

## 🗄️ Database Setup

### PostgreSQL Tables (Example)

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Grant Permissions

```sql
GRANT ALL PRIVILEGES ON DATABASE smart_life TO smart_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smart_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smart_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO smart_user;
```

---

## 🔑 Authentication

The API uses **JWT Bearer Tokens**.

### Auth Middleware (`auth.js`)

* Validates `Authorization: Bearer <token>` header
* Verifies token using `JWT_SECRET`
* Protects private routes

### When to use `authMiddleware`

Use it on any route that requires authentication:

```js
usersRouter.get('/users', authMiddleware, async (req, res) => {
  // protected logic
});
```

---

## 📡 API Endpoints

### Get All Users (Protected)

```
GET /api/users
```

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
[
  {
    "id": "uuid",
    "email": "user@email.com",
    "full_name": "John Doe",
    "avatar_url": null,
    "created_at": "2024-01-01T10:00:00Z"
  }
]
```

---

## 📘 Swagger Documentation

Swagger is available at:

```
http://localhost:3000/api-docs
```

### Testing with Swagger

1. Open `/api-docs`
2. Click **Authorize**
3. Enter:

   ```
   Bearer <your_jwt_token>
   ```
4. Execute protected endpoints

---

## 🧪 Common Errors & Fixes

### `JsonWebTokenError: jwt malformed`

* Token is not a valid JWT
* Ensure format is `Bearer <token>`
* JWT must contain 3 dot-separated parts

---

### `permission denied for table users`

* Database user lacks permissions
* Fix with GRANT statements (see Database Setup)

---

### `Error: write EPIPE`

* Database connection dropped
* Common causes:

  * Invalid DB credentials
  * SSL mismatch
  * Cloud SQL connection issues

Ensure your `dbclient.js`:

```js
ssl: { rejectUnauthorized: false }
```

---

## ☁️ Google Cloud Notes

* Use **Cloud SQL (PostgreSQL)**
* Store secrets in **Secret Manager** (recommended)
* Set env vars via Cloud Run / App Engine config

---

## ▶️ Running the App
```bash
 npm i
```

```bash
npm start
```

or (with nodemon):

```bash
npm run dev
```

---

## 📌 Roadmap (Optional)

* Role-based access control (RBAC)
* Refresh tokens
* User registration & login endpoints
* Database migrations
* Unit & integration tests

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Commit changes
4. Open a Pull Request

---

## 📄 License

MIT License

---

**Smart Life API** – built for scalability, security, and clarity ✨
