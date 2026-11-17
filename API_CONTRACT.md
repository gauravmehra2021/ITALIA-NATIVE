# Student app API contract

The mobile app runs with bundled sample data while `API_BASE_URL` in `src/config/api.ts` is empty. Set that one value to switch the app to live requests. For local development, use the host address reachable from the device (Android emulator: `http://10.0.2.2:<port>`; physical device: your computer's LAN address). Use HTTPS outside local development.

The client currently expects unwrapped JSON DTOs (no `{ "data": ... }` envelope). Routes are versioned under `/api/v1`; update the single `apiEndpoints` object if the .NET route names differ. Responses are runtime-validated with Zod before reaching screens. Errors should use ASP.NET Core `ProblemDetails` / `ValidationProblemDetails` (`title`, `detail`, optional `code`, and `errors`).

## Authentication

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | `{ "email": string, "password": string }` | `{ "challengeId": string, "expiresAt": ISO-8601 }` |
| `POST` | `/api/v1/auth/otp/verify` | `{ "challengeId": string, "code": string }` | `{ "accessToken": string, "refreshToken": string, "student": Student }` |
| `POST` | `/api/v1/auth/refresh` | `{ "refreshToken": string }` | `{ "accessToken": string, "refreshToken": string }` |
| `POST` | `/api/v1/auth/logout` | Bearer token | `204 No Content` |

Protected calls send `Authorization: Bearer <accessToken>`. Tokens are stored in the iOS Keychain / Android Keystore via `react-native-keychain`; a `401` triggers one refresh attempt, then returns the student to sign-in if the refresh is rejected. Use short-lived access tokens and rotate refresh tokens.

## Student routes

Every route below, except auth, requires the bearer token. Arrays are returned directly.

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/api/v1/students/me` | — | `Student` |
| `GET` | `/api/v1/students/me/dashboard` | — | `DashboardSummary` |
| `GET` | `/api/v1/students/me/courses` | — | `CourseSummary[]` |
| `GET` | `/api/v1/courses` | — | `CourseSummary[]` catalogue |
| `POST` | `/api/v1/students/me/courses/{courseId}/enroll` | `{}` | `204 No Content` |
| `GET` | `/api/v1/students/me/courses/{courseId}/lessons` | — | `Lesson[]` |
| `GET` | `/api/v1/students/me/quizzes` | — | `QuizSummary[]` |
| `POST` | `/api/v1/quizzes/{quizId}/sessions` | `{}` | `QuizSession` |
| `POST` | `/api/v1/quizzes/{quizId}/answers` | `{ "sessionId": string, "questionId": string, "answerId": string }` | `QuizAnswerResult` |
| `POST` | `/api/v1/students/me/ai-tutor/messages` | `{ "message": string }` | `{ "messages": TutorMessage[] }` |
| `GET` | `/api/v1/students/me/progress` | — | `ProgressSummary` |
| `GET` | `/api/v1/students/me/live-classes` | — | `LiveClass[]` |
| `GET` | `/api/v1/students/me/certificates` | — | `Certificate[]` |
| `GET` | `/api/v1/students/me/notifications` | — | `StudentNotification[]` |
| `POST` | `/api/v1/students/me/notifications/{notificationId}/read` | — | `204 No Content` |
| `PUT` | `/api/v1/students/me/preferences/language` | `{ "language": "en" }` | `204 No Content` |

## DTOs

The authoritative field definitions and runtime constraints are in `src/api/types.ts` and `src/api/contracts.ts`. Important UI expectations:

- Percentages are numbers from `0` to `100`; lesson counts and points are non-negative integers.
- `ProgressSummary.weeklyActivityMinutes` contains exactly seven numbers.
- Timestamps are ISO-8601 strings with an explicit UTC marker or offset.
- Content, meeting, certificate, and payment-management links are absolute URLs.
- Quiz sessions contain at least one question; each question has at least two answers.
- Do not return payment-card secrets. Return only a masked payment method and a short-lived provider management URL.

The API server still needs to be implemented and deployed. In particular, payment provider callbacks, push delivery, actual Google Meet links, and AI tutor generation belong to the .NET/backend integrations; the mobile client only displays their returned status/data.
