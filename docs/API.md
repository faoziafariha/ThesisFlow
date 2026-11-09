# REST API

All paths start with `/api`. JSON errors use `{ "error": "message" }`. Authentication uses an HttpOnly cookie; there are no browser-stored access tokens. Mutation requests require the same browser origin. Most errors return 400 (validation), 401 (sign-in), 403 (role/origin), 404 (missing or inaccessible record), or 409 (workflow conflict).

| Method | Path | Access | Request / result |
| --- | --- | --- | --- |
| GET | `/health` | Public | Database readiness, service name |
| GET | `/config` | Public | Whether demo login is enabled |
| POST | `/auth/demo` | Public, demo enabled | `{role: "student" / "supervisor" / "admin"}`; starts shared demo session |
| POST | `/auth/login` | Public | `{email,password}`; approved seeded users only |
| GET | `/auth/me` | Authenticated | Safe user profile |
| POST | `/auth/logout` | Authenticated | Revokes session and clears cookie |
| GET | `/workspace` | Authenticated | Role-scoped projects, reviews, document metadata, directory, deadlines and notifications; admin also gets users/audit |
| POST | `/projects` | Student | `{title,abstract,area,supervisor_id}` → `{id}` |
| PATCH | `/projects/:id/progress` | Owning student | `{progress: integer 0..100}`; approved/in-progress projects |
| POST | `/projects/:id/reviews` | Assigned supervisor | `{comment,decision}`; decision is Approved, Changes requested, In progress or Completed |
| POST | `/projects/:id/submissions` | Owning student | `{title,filename,content}`; content is base64 PDF, maximum 2 MB decoded |
| GET | `/submissions/:id/download` | Project readers | PDF attachment |
| POST | `/deadlines` | Admin | `{title,due_date: "YYYY-MM-DD",description}` |
| PATCH | `/users/:id/approve` | Admin | Approves existing account |

Title/abstract/area limits: proposal title 8–160 characters, abstract 30–5000, area 2–80. Review comment 5–3000. Submission title 3–120, filename ≤160. Deadline title 3–120, description 3–1000. Dates must be real calendar dates. Invalid fields are rejected before SQL writes.

Example using a local running server:

```sh
curl -c cookies.txt -H 'Content-Type: application/json' -d '{"role":"student"}' http://localhost:3000/api/auth/demo
curl -b cookies.txt http://localhost:3000/api/workspace
```

The directory exposes approved supervisors only. A role's absence from a visible button is not the authorization mechanism: the backend independently checks roles and ownership on every project operation.
