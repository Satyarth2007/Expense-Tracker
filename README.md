# 📘 Ledger — Enterprise-Grade Expense Tracking System (Server)

- Ledger is a full-stack, enterprise-grade expense tracking and financial ledger application. 
- It is engineered on the PERN stack (PostgreSQL, Express.js, React, Node.js) following formal IEEE 830 SRS standards.
- It provides multi-tenant data isolation via PostgreSQL Row-Level Security (RLS).
- Designed for multiple user personas, the platform securely segregates personal budgets from professional cash flows.

---

## Tech Stack
```text
Frontend — React, Vite, Axios, Zod, CSS

Backend — Node.js, Express.js, JWT, bcrypt, Zod

Database — PostgreSQL, Row-Level Security

Security — bcrypt, JWT, Rate Limiting, OAuth

Testing — Jest, Supertest (planned)
```

## 📂 Project Folder Structure

```text
Expense-Tracker/
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       │   ├── fonts/
│       │   ├── icons/
│       │   └── images/
│       ├── components/
│       │   ├── common/
│       │   ├── layout/
│       │   ├── ui/
│       │   └── widgets/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       │   ├── analytics/
│       │   ├── auth/
│       │   ├── budgets/
│       │   ├── dashboard/
│       │   ├── imports/
│       │   ├── settings/
│       │   └── transactions/
│       ├── routes/
│       ├── services/
│       ├── styles/
│       ├── utils/
│       └── validators/
│
└── server/
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── db/
    │   │   ├── migrations/
    │   │   └── seeds/
    │   ├── middlewares/
    │   ├── models/
    │   ├── schemas/
    │   ├── services/
    │   └── workers/
    └── tests/
        ├── e2e/
        ├── integration/
        └── unit/
```

