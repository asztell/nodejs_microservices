# Project Structure

This project is organized as a **monorepo** containing multiple backend services, shared packages, database migrations, Docker configuration, and development scripts.

```text
project-root/
│
├── apps/                              # Application services
│   │
│   ├── api-gateway/                   # API entry point / request routing
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   │   └── gateway.auth.ts
│   │   │   ├── rbac.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth-service/                  # Authentication & authorization
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── media-service/                 # Media / attachment operations
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   ├── schemas/
│   │   │   ├── middleware/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── task-service/                  # Task management
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   ├── schemas/
│   │   │   ├── kafka.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── workflow-service/              # Workflow management
│       ├── src/
│       │   ├── controllers/
│       │   ├── repositories/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── utils/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                        # Shared libraries used by services
│       ├── src/
│       │   ├── auth/
│       │   │   ├── gateway.auth.ts
│       │   │   ├── jwt.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── db/
│       │   │   └── pool.ts
│       │   │
│       │   ├── errors/
│       │   │   ├── AppError.ts
│       │   │   └── errorHandler.ts
│       │   │
│       │   ├── kafka/
│       │   │   ├── client.ts
│       │   │   ├── consumer.ts
│       │   │   ├── fetchAllActiveTopics.ts
│       │   │   ├── fetchAllMessages.ts
│       │   │   ├── producer.ts
│       │   │   └── topics.ts
│       │   │
│       │   ├── logger/
│       │   │   ├── httpLogger.ts
│       │   │   └── logger.ts
│       │   │
│       │   ├── response/
│       │   │   └── response.ts
│       │   │
│       │   └── validation/
│       │       └── validateBody.ts
│       │
│       ├── package.json
│       └── tsconfig.json
│
├── docker/
│   └── compose.yml                    # Local infrastructure
│
├── scripts/
│   └── db-migrate.ts                  # Database migration runner
│
├── sql/                               # Database migrations
│   ├── 001_users.sql
│   ├── 002_tasks.sql
│   ├── 003_attachments.sql
│   └── 004_workflows.sql
│
├── .env                               # Environment configuration
├── .env.keys                          # Gitignored environment keys
├── .gitignore
├── eslint.config.js
├── load-test.js                       # Load testing
├── package.json
├── package-lock.json
└── tsconfig.base.json                 # Shared TypeScript configuration
```

## Architecture Overview

```text
                              ┌──────────────────────┐
                              │      API Gateway     │
                              │                      │
                              │ Auth Middleware      │
                              │ RBAC                 │
                              │ Request Routing      │
                              └──────────┬───────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
      ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
      │ Auth Service  │          │ Media Service │          │ Task Service  │
      │               │          │               │          │               │
      │ Controllers   │          │ Controllers   │          │ Controllers   │
      │ Services      │          │ Services      │          │ Services      │
      │ Repositories  │          │ Repositories  │          │ Repositories  │
      │ Routes        │          │ Routes        │          │ Routes        │
      └───────┬───────┘          └───────┬───────┘          └───────┬───────┘
              │                          │                          │
              │                          │                          │
              └──────────────────────────┼──────────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │  Workflow Service    │
                              │                      │
                              │ Controllers          │
                              │ Services             │
                              │ Repositories         │
                              │ Routes               │
                              └──────────┬───────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
             ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
             │ PostgreSQL  │      │    Kafka    │      │    Shared   │
             │             │      │             │      │   Package   │
             │ Database    │      │ Messaging   │      │             │
             └─────────────┘      └─────────────┘      └─────────────┘
```

## Shared Package

The `packages/shared` package contains infrastructure and utilities shared across services.

| Module       | Responsibility                                                     |
| ------------ | ------------------------------------------------------------------ |
| `auth`       | JWT authentication, authorization types, gateway authentication    |
| `db`         | Database connection pooling                                        |
| `errors`     | Application errors and centralized error handling                  |
| `kafka`      | Kafka clients, producers, consumers, topics, and message utilities |
| `logger`     | Application and HTTP logging                                       |
| `response`   | Standardized API responses                                         |
| `validation` | Request body validation                                            |

## Service Architecture

Each service follows a similar layered structure:

```text
                    HTTP Request
                         │
                         ▼
                    ┌─────────┐
                    │ Routes  │
                    └────┬────┘
                         │
                         ▼
                 ┌──────────────┐
                 │ Controllers  │
                 └──────┬───────┘
                        │
                        ▼
                  ┌───────────┐
                  │ Services  │
                  └─────┬─────┘
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
      ┌──────────────┐      ┌──────────────┐
      │ Repositories │      │ Shared Utils │
      └──────┬───────┘      └──────────────┘
             │
             ▼
       ┌────────────┐
       │ PostgreSQL │
       └────────────┘
```

### Typical Request Flow

```text
Client
  │
  │ HTTP Request
  ▼
API Gateway
  │
  ├── Authentication
  ├── Authorization / RBAC
  └── Route Resolution
          │
          ▼
     Service API
          │
          ▼
     Controller
          │
          ▼
      Service
          │
      ┌───┴────┐
      ▼        ▼
Repository   Kafka
      │        │
      ▼        ▼
 PostgreSQL  Events
```


## Authentication & Authorization Flow

```mermaid
flowchart TD

    CLIENT["<b>1. CLIENT</b><br/>HTTP Request"]
    GATEWAY["<b>2. API GATEWAY</b><br/>Security Boundary"]
    STRIP["<b>3. STRIP IDENTITY HEADERS</b><br/>Remove spoofed headers"]
    SECRET["<b>4. ATTACH GATEWAY SECRET</b><br/>x-gateway-secret"]
    PUBLIC["<b>5. ROUTE</b><br/>Public / Protected"]

    TOKEN{"<b>6. BEARER TOKEN?</b>"}
    UNAUTHORIZED["<b>401</b><br/>Unauthorized"]

    JWT["<b>7. VERIFY JWT</b><br/>Validate token"]

    RBAC{"<b>8. RBAC</b><br/>Method + Path"}

    NOT_FOUND["<b>404</b><br/>Route Not Found"]
    FORBIDDEN["<b>403</b><br/>Forbidden"]

    USER_HEADERS["<b>9. ATTACH IDENTITY</b><br/>x-user-id / x-user-role"]
    AUTH["<b>10. PROXY</b><br/>Auth Service"]
    VERIFY_SECRET["<b>11. VERIFY SECRET</b><br/>Trusted Gateway"]
    GET_ME["<b>12. GET /auth/me</b>"]
    USERS[("<b>13. NEON USERS</b>")]
    RETURN_USER["<b>14. RETURN USER</b>"]

    CLIENT --> GATEWAY
    GATEWAY --> STRIP
    STRIP --> SECRET
    SECRET --> PUBLIC
    PUBLIC --> TOKEN

    TOKEN -- "NO" --> UNAUTHORIZED
    TOKEN -- "YES" --> JWT

    JWT --> RBAC

    RBAC -- "NO RULE" --> NOT_FOUND
    RBAC -- "ROLE NOT ALLOWED" --> FORBIDDEN
    RBAC -- "ALLOWED" --> USER_HEADERS

    USER_HEADERS --> AUTH
    AUTH --> VERIFY_SECRET
    VERIFY_SECRET --> GET_ME

    GET_ME <--> USERS
    GET_ME --> RETURN_USER

    classDef process fill:#111111,stroke:#eeeeee,color:#ffffff,stroke-width:2px;
    classDef decision fill:#111111,stroke:#eeeeee,color:#ffffff,stroke-width:2px;
    classDef error fill:#111111,stroke:#eeeeee,color:#ffffff,stroke-width:2px;
    classDef database fill:#111111,stroke:#eeeeee,color:#ffffff,stroke-width:2px;

    class CLIENT,GATEWAY,STRIP,SECRET,PUBLIC,JWT,USER_HEADERS,AUTH,VERIFY_SECRET,GET_ME,RETURN_USER process;
    class TOKEN,RBAC decision;
    class UNAUTHORIZED,NOT_FOUND,FORBIDDEN error;
    class USERS database;
```

