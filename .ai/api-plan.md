# REST API Plan

> **Context:** React frontend using Firebase Authentication with email/password and the Firebase Realtime Database (RTDB). All game data lives in a single shared RTDB namespace (no per-user partitioning). The app keeps long-lived realtime subscriptions to reflect database changes instantly.

## 1. Resources

| Resource                | RTDB Path                                                          | Notes                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Match**               | `/{matchId}` (legacy aliases under `/matches/{matchId}` also read) | Core match records. Each entry holds two teams (two players per side), a textual score, and a match date saved as UNIX ms or ISO string. Stored with RTDB push IDs.                                        |
| **MatchActivityLog**    | `/activityLogs/{logId}`                                            | Timeline of match CRUD actions. Entries capture actor info, action type (`create\|update\|delete`), timestamp, and a snapshot of the match state at that moment.                                           |
| **PendingMatchRequest** | `/pendingMatchRequests/{requestId}`                                | Queue of change requests submitted by non-admin users. Each entry stores actor metadata, submission timestamp, and a payload describing the desired `create\|update\|delete` action (with match snapshot). |

**Indexing & query hints**

- `Match` collection: client code orders by the `date` child when computing player statistics, so expose an `.indexOn: ["date"]` rule for any node that stores match lists. 【F:src/common/hooks/usePlayerStats.ts†L1-L220】
- `MatchActivityLog` and `PendingMatchRequest` collections are displayed newest-first; indexing on `timestamp` keeps pagination efficient. 【F:src/common/context/MatchActivityContext.tsx†L1-L144】【F:src/common/context/PendingMatchesContext.tsx†L1-L227】

## 2. Endpoints

All endpoints assume Firebase ID token authentication (`Authorization: Bearer <token>`). Responses wrap payloads in `{ "data": ... }` unless otherwise noted. Server timestamps are in UNIX milliseconds.

### 2.1 Authentication

Firebase Authentication handles login/logout directly from the client via `signInWithEmailAndPassword`, `signOut`, and the auth state listener. Expose matching REST helpers only if needed for non-Firebase clients; otherwise reuse Firebase SDK endpoints. 【F:src/common/services/firebase.ts†L1-L32】【F:src/common/context/AuthContext.tsx†L1-L55】

### 2.2 Matches

These endpoints manage match records and mirror the optimistic update logic already present in the React context.

#### GET `/v1/matches`

- **Query params:**
  - `startDate`, `endDate` (optional; milliseconds or ISO strings) to filter by match date.
  - `orderBy` in `{date}` (default `date`), `direction` in `{asc,desc}` (default `desc`).
  - `limit` (1–500, default 100) and `pageToken` for pagination.
- **Description:** Returns matches stored at both the RTDB root and the legacy `/matches` bucket, de-duplicated and sorted by date descending to match the frontend expectations. 【F:src/common/context/MatchesContext.tsx†L105-L136】
- **Response 200**

```json
{
  "data": [
    {
      "id": "-Nxyz123",
      "player1": "Adam",
      "player2": "Bartek",
      "rival1": "Marek",
      "rival2": "Łukasz",
      "result": "5-3",
      "date": 1733107200000
    }
  ],
  "nextPageToken": "..."
}
```

#### GET `/v1/matches/{id}`

- **Description:** Fetches a single match from either top-level `/{id}` or `/matches/{id}`.
- **Response 200:** `{ "data": { ...Match } }`
- **Errors:** 404 if the match ID is unknown.

#### POST `/v1/matches`

- **Description:** Creates a match. Only the admin user (see §3) may execute immediately; other users receive HTTP 202 with a `pendingRequestId` (see §2.3). Mirrors the client behaviour of queueing non-admin requests. 【F:src/common/context/MatchesContext.tsx†L280-L341】
- **Request**

```json
{
  "player1": "Adam",
  "player2": "Bartek",
  "rival1": "Marek",
  "rival2": "Łukasz",
  "result": "5-3",
  "date": 1733107200000
}
```

- **Response 201 (admin):** `{ "data": { "id": "-Nxyz123", ... } }`
- **Response 202 (non-admin):** `{ "data": { "pendingRequestId": "-Nreq456" } }`
- **Errors:** 400 for validation failures.

#### PATCH `/v1/matches/{id}`

- **Description:** Partial update (same admin vs. non-admin flow as POST). Supports optimistic concurrency via `If-Match: "<timestamp>"` header referencing the `updatedAt` field (if surfaced). 【F:src/common/context/MatchesContext.tsx†L344-L402】
- **Errors:** 400 (validation), 404 (missing match), 409/412 (conflict), 202 for queued updates.

#### DELETE `/v1/matches/{id}`

- **Description:** Removes a match. Non-admins trigger a pending delete request. 【F:src/common/context/MatchesContext.tsx†L404-L449】
- **Response 204** (admin) or **202** with `{ "data": { "pendingRequestId": "..." } }` for non-admins.

#### Realtime subscription `/v1/matches:stream`

- **Description:** Optional server-sent events (SSE) or WebSocket stream mirroring `onValue(ref(rtdb))` so the UI can stay in sync without polling. Emit the same payload as `GET /v1/matches` whenever data changes. 【F:src/common/context/MatchesContext.tsx†L209-L227】

### 2.3 Pending Match Requests

Non-admin interactions are stored as pending requests and require admin approval.

#### GET `/v1/pending-match-requests`

- **Query params:** `direction` (default `desc`), `limit`, `pageToken`.
- **Description:** Lists pending items sorted by `timestamp` descending. 【F:src/common/context/PendingMatchesContext.tsx†L142-L156】
- **Response 200**

```json
{
  "data": [
    {
      "id": "-Nreq456",
      "actor": { "id": "uid123", "displayName": "Adam" },
      "timestamp": 1733110000000,
      "payload": {
        "type": "update",
        "matchId": "-Nxyz123",
        "match": {
          "player1": "Adam",
          "player2": "Bartek",
          "rival1": "Marek",
          "rival2": "Łukasz",
          "result": "4-4",
          "date": 1733193600000
        },
        "previousMatch": {
          "player1": "Adam",
          "player2": "Bartek",
          "rival1": "Marek",
          "rival2": "Łukasz",
          "result": "5-3",
          "date": 1733107200000
        }
      }
    }
  ]
}
```

#### POST `/v1/pending-match-requests`

- **Description:** Queues a non-admin request. Server derives `actor` from the authenticated user and stamps `timestamp`. Payload must match the shapes used in the frontend. 【F:src/common/context/MatchesContext.tsx†L260-L311】
- **Request** (example for create)

```json
{
  "type": "create",
  "match": {
    "player1": "Adam",
    "player2": "Bartek",
    "rival1": "Marek",
    "rival2": "Łukasz",
    "result": "5-3",
    "date": 1733107200000
  }
}
```

- **Response 201:** `{ "data": { "id": "-Nreq456" } }`
- **Errors:** 400 for malformed payloads.

#### POST `/v1/pending-match-requests/{id}:approve`

- **Description:** Admin-only. Executes the stored action by delegating to the match endpoints with the original actor recorded for auditing. Removes the pending item on success. 【F:src/common/context/PendingMatchesContext.tsx†L166-L205】
- **Response 200:** `{ "data": { "status": "completed" } }`
- **Errors:** 403 (non-admin), 409 (underlying match conflict).

#### POST `/v1/pending-match-requests/{id}:reject`

- **Description:** Admin-only; deletes the pending item. 【F:src/common/context/PendingMatchesContext.tsx†L206-L215】
- **Response 200:** `{ "data": { "status": "rejected" } }`

#### Realtime subscription `/v1/pending-match-requests:stream`

- **Description:** Streams queue changes for the admin dashboard, mirroring the existing `onValue(ref(rtdb, "/pendingMatchRequests"))`. 【F:src/common/context/PendingMatchesContext.tsx†L142-L164】

### 2.4 Match Activity Logs

Logs are read-only for clients; the backend should emit them automatically whenever a match mutation succeeds.

#### GET `/v1/match-activity`

- **Query params:** `limit`, `pageToken`, `direction` (default `desc`), optional `matchId` filter.
- **Description:** Returns activity entries sorted by timestamp descending. Each entry includes the actor metadata and the match snapshot captured when the action ran. 【F:src/common/context/MatchActivityContext.tsx†L107-L144】
- **Response 200**

```json
{
  "data": [
    {
      "id": "-Nlog789",
      "matchId": "-Nxyz123",
      "type": "update",
      "timestamp": 1733110050000,
      "actor": { "id": "uid123", "displayName": "Adam" },
      "matchSnapshot": {
        "id": "-Nxyz123",
        "player1": "Adam",
        "player2": "Bartek",
        "rival1": "Marek",
        "rival2": "Łukasz",
        "result": "4-4",
        "date": 1733193600000
      }
    }
  ]
}
```

#### Realtime subscription `/v1/match-activity:stream`

- **Description:** Optional SSE/WebSocket feed broadcasting activity log changes in near real time. 【F:src/common/context/MatchActivityContext.tsx†L107-L138】

## 3. Authentication & Authorization

- **Mechanism:** Firebase Authentication; clients authenticate with email/password, obtain an ID token, and reuse it for REST calls. 【F:src/common/services/firebase.ts†L1-L32】
- **Admin privilege:** Only the user whose normalized display name matches `Bartek` may apply match changes immediately. All other users must submit pending requests. 【F:src/common/context/MatchesContext.tsx†L201-L313】【F:src/common/context/PendingMatchesContext.tsx†L135-L205】
- **Audit trail:** Successful match mutations write a log entry capturing the actor, action type, and full match snapshot. 【F:src/common/context/MatchesContext.tsx†L229-L340】

## 4. Validation & Business Rules

- **Match payloads** must include `player1`, `player2`, `rival1`, `rival2`, `result`, and `date`. `date` accepts either a millisecond timestamp or ISO string; the backend should normalize to a millisecond number for storage. The frontend rejects invalid dates. 【F:src/common/context/MatchesContext.tsx†L280-L338】
- **Pending requests** preserve the original actor and desired change. Approvals execute the stored payload exactly; failures should leave the request untouched so the admin can retry. 【F:src/common/context/PendingMatchesContext.tsx†L176-L205】
- **Activity logs** are append-only and should be generated server-side to prevent tampering. Log entries mirror the structure currently written by the client. 【F:src/common/context/MatchesContext.tsx†L229-L339】【F:src/common/context/MatchActivityContext.tsx†L47-L127】
- **Realtime expectations:** The UI relies on live RTDB subscriptions for matches, pending requests, and activity logs. Any REST replacement must expose equivalent streaming or polling-friendly endpoints to avoid regressing UX. 【F:src/common/context/MatchesContext.tsx†L209-L227】【F:src/common/context/PendingMatchesContext.tsx†L142-L164】【F:src/common/context/MatchActivityContext.tsx†L107-L138】
- **Stats features** (player stats, rankings, etc.) depend on consistent `date` ordering. Ensure match listings can be filtered or sorted by `date` and that RTDB indexes support `orderByChild("date")`. 【F:src/common/hooks/usePlayerStats.ts†L1-L220】

---

This plan mirrors the current Firebase interactions so a Cloud Functions or HTTPS service can replace the direct RTDB access without changing frontend behaviour.
