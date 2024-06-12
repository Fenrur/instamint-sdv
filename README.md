# Instamint

## 📘 About

Instamint is a basic web application built with Next.js, featuring user authentication and profile management.

## 🛠 Technologies

- **Next.js** - Full-stack React framework
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework
- **PostgreSQL** - Relational database
- **DrizzleORM** - TypeScript ORM
- **Auth.js** - Authentication library

## 🚀 Getting Started

### Prerequisites

- Node.js v20.12+
- Docker

### Environment Variables

Create a `.env` file:

```dotenv
DATABASE_URL="postgresql://instamint:instamint@localhost:5432/instamint"
PEPPER_PASSWORD_SECRET="your_pepper_secret"
NEXT_AUTH_SECRET="your_auth_secret"
TOTP_ENCRYPTION_KEY="your_totp_key"
BASE_URL="http://localhost:3000"
SECURE_AUTH_COOKIES="false"
CONTACT_EMAIL="contact@instamint.com"
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install --legacy-peer-deps`
3. Start database: `docker-compose up -d`
4. Run migrations: `npm run migrate`
5. Start development server: `npm run dev`

## 🔑 Features

- User authentication (login/signup)
- User profiles
- Basic admin panel
- Two-factor authentication (TOTP)