# NORSU Tabulator System

A web system for managing school events (such as pageants and Hugyawan), registering participants, assigning judges, and tabulating results. It is a DBMS project built with Node.js, Express and MySQL. The frontend is plain HTML, CSS and JavaScript that calls a JSON API.

## Team

| Member | GitHub username | Module |
|---|---|---|
| Carl Agustine Noblesala | `@agguussttiinnee` | Transactions |
| Bernadette Callenero | `@na-dette` | Master data |
| Gretchen Hope Cabudbud | `@gretchenhope-arch` | Reports |
| Montessa Busmeon | `@mntxsa` | Core: login, users, judge assignment |
| Izy Mae Adrivan | `@izymaeadrivan16` | Rules |
| Resty Catipay | `@catipayresty` | Workflow and audit |

## Ownership matrix

| | Carl | Bernadette | Gretchen | Montessa | Izy | Resty |
|---|---|---|---|---|---|---|
| **Tables** | `events`, `participants`, `event_participants` | `colleges`, `event_types`, `venues` | `award_categories`, `awards` | `roles`, `users`, `event_judges` | `criteria`, `scores` | `score_submissions`, `score_revisions`, `audit_logs` |
| **Endpoints** | `/api/events`, `/api/events/:id/participants` | `/api/colleges`, `/api/event-types`, `/api/venues` | `/api/awards` | `/api/auth`, `/api/users`, `/api/event-judges` | `/api/criteria`, `/api/scores` | `/api/score-submissions`, `/api/score-revisions`, `/api/audit-logs` |
| **Screens** | `events.html`, `participant-registration.html` | `colleges.html` | `awards.html` | `login.html`, `judge-home.html`, `users.html`, `judge-assignment.html` | `criteria-setup.html`, `judge-scoring.html` | `revision-requests.html`, `score-revisions.html`, `audit-logs.html` |
| **Shared files** | `public/js/transaction-auth.js` | | | `public/js/layout.js`, `public/css/app.css` | | |
| **Join report** | `GET /api/events/:id/participants` (INNER JOIN of `event_participants`, `events`, `participants` and `colleges`) | `GET /api/colleges/report/no-participants` (LEFT JOIN) | `GET /api/awards/leaderboard` (INNER JOIN) | `GET /api/event-judges/report` (INNER JOIN) | `GET /api/scores/missing/:eventId` (LEFT JOIN) | `GET /api/score-submissions/report` (FULL OUTER JOIN using UNION) |
| **Progress** | | | | | | |

## Endpoints

### Authentication and users

| Method and path | Who | What it does |
|---|---|---|
| `POST /api/auth/login` | everyone | Checks the email and password and returns a token and the user |
| `GET /api/auth/me` | logged in | Returns the logged-in user |
| `GET /api/users/roles` | admin | Lists the roles for the dropdown |
| `GET /api/users` | admin | Lists active users with their role |
| `GET /api/users/:id` | admin | Returns one user |
| `POST /api/users` | admin | Creates a user (password of at least 8 characters) |
| `PUT` or `PATCH /api/users/:id` | admin | Updates a user; every field is optional |
| `DELETE /api/users/:id` | admin | Soft-deletes a user (not your own account) |

### Judge assignments

| Method and path | Who | What it does |
|---|---|---|
| `GET /api/event-judges` | admin | Lists assignments |
| `POST /api/event-judges` | admin | Assigns a judge to an event |
| `DELETE /api/event-judges/:id` | admin | Removes an assignment |
| `GET /api/event-judges/report` | admin | Judges per event (INNER JOIN of `event_judges`, `events`, `users` and `roles`) |

### Awards and reports

| Method and path | Who | What it does |
|---|---|---|
| `GET /api/awards/leaderboard` | admin, judge | Leaderboard rows with participant, college and event (INNER JOIN of `awards`, `award_categories`, `events`, `participants` and `colleges`) |
| `GET /api/awards/categories` | admin, judge | Lists award categories |
| `POST /api/awards/categories` | admin | Adds an award category |
| `GET /api/awards` | admin, judge | Lists awards (optional `event_id`) |
| `GET /api/awards/:id` | admin, judge | Returns one award |
| `POST /api/awards` | admin | Creates an award (the rank must be free for that event and category) |
| `PUT` or `PATCH /api/awards/:id` | admin | Updates an award; every field is optional |
| `DELETE /api/awards/:id` | admin | Soft-deletes an award; its rank can be used again |

### Events and participants

| Method and path | Who | What it does |
|---|---|---|
| `GET /api/events/lookups` | admin | Lists event types, venues and colleges for the dropdowns |
| `GET /api/events/participants` | admin | Lists existing participants so one can be reused |
| `GET /api/events` | admin | Lists active events |
| `GET /api/events/:id` | admin | Returns one event |
| `POST /api/events` | admin | Creates an event |
| `PUT` or `PATCH /api/events/:id` | admin | Updates an event; every field is optional |
| `DELETE /api/events/:id` | admin | Soft-deletes an event |
| `GET /api/events/:id/participants` | admin, judge | Roster for an event (INNER JOIN of `event_participants`, `events`, `participants` and `colleges`); a judge must be assigned to that event |
| `POST /api/events/:id/participants` | admin | Registers a participant in one transaction; returns 409 if the entry number or participant is already in the event |
| `DELETE /api/events/:id/participants/:registrationId` | admin | Removes a registration |

### Criteria and scoring — Izy Mae Adrivan

| Method and path | Who | What it does |
|---|---|---|
| `GET /api/criteria/event/:eventId` | admin, judge | Lists criteria for an event |
| `GET /api/criteria/event/:eventId/total-weight` | admin | Gets the total weight of an event's criteria |
| `GET /api/criteria/:id` | admin | Gets one criterion |
| `POST /api/criteria` | admin | Creates a criterion |
| `PUT` or `PATCH /api/criteria/:id` | admin | Updates a criterion |
| `DELETE /api/criteria/:id` | admin | Deletes a criterion if it has no associated scores |
| `GET /api/scores/criterion/:criterionId` | judge | Lists the logged-in judge's scores for a criterion |
| `GET /api/scores/:id` | judge | Gets one score |
| `POST /api/scores` | judge | Creates a score |
| `PUT /api/scores/:id` | judge | Updates a score before submission is locked |
| `DELETE /api/scores/:id` | judge | Deletes a score before submission is locked |
| `GET /api/scores/rankings/:eventId` | admin | Gets event rankings using weighted scores and tie-breaking rules |
| `GET /api/scores/missing/:eventId` | admin | Lists participants with missing scores using a LEFT JOIN |

### Score submission, revision, and audit

| Method and path | Who | What it does |
|---|---|---|
| `GET /api/score-submissions` | admin, judge | Lists submissions; judges see only their own |
| `GET /api/score-submissions/:id` | admin, owner judge | Gets one submission |
| `POST /api/score-submissions` | judge | Creates a draft submission for an assigned event |
| `PATCH /api/score-submissions/:id/submit` | judge | Submits and locks the judge's scores |
| `GET /api/score-submissions/report` | admin | Shows assigned judges and their submissions using a FULL OUTER JOIN implemented with UNION |
| `POST /api/score-revisions` | judge | Requests a revision with a reason |
| `GET /api/score-revisions` | admin, judge | Lists revision requests according to the user's role |
| `GET /api/audit-logs` | admin | Views recorded system activities |

Status codes used include `400` for bad input, `401` for missing or expired tokens, `403` for forbidden actions, `404` for missing records, `409` for conflicts or duplicates, and `201` for successful creation.

## Scoring Rules and Computation

### Criteria setup

- Each event has its own scoring criteria.
- Each criterion has a name, weight, and maximum score.
- The total weight of all criteria for an event must equal exactly 100%.
- Criteria weights must be positive.
- A criterion cannot be deleted if scores are already associated with it.

### Score validation

- Judges can only score events assigned to them.
- Scores must be zero or greater.
- Scores cannot exceed the criterion's maximum score.
- Judges must provide scores for every registered participant under every criterion before submitting.

### Weighted ranking formula

For each criterion:

`Weighted Score = (Average Judge Score / Maximum Score) × Criterion Weight`

The final score is the sum of all weighted criterion scores.

Participants are ranked from highest to lowest final score.

### Tie-breaking rules

1. Compare participants' final weighted scores.
2. If their final scores are equal, compare their scores in the highest-weighted criterion first.
3. If they remain tied, compare the next highest-weighted criterion.
4. If they are still tied after all criteria are compared, the result is marked **Tie - Admin Decides**.

## Score Submission and Locking

- Judges save their scores before submission.
- The backend checks that the event has criteria and participants.
- The backend checks that criterion weights total 100%.
- The backend checks that every participant has a score under every criterion from the judge.
- Once submitted, only that judge's scores for that event are locked.
- Editing or deleting locked scores is rejected with HTTP `403`.
- A locked submission cannot be submitted again.
- Judges can request a revision by providing a reason.
- Administrators can review revision requests and approve or reject them.
- Approved revisions follow the system's revision workflow and are recorded in the audit log.

## Screens

| Page | Who | What it does |
|---|---|---|
| `/login.html` | everyone | Logs in, saves the token as `norsuToken`, and redirects by role |
| `/judge-home.html` | judge | Judge landing page |
| `/users.html` | admin | Lists, adds, edits and deletes users |
| `/judge-assignment.html` | admin | Assigns and removes judges and shows the judges-per-event report |
| `/awards.html` | admin | Shows the leaderboard and lets admins add, edit and delete awards |
| `/events.html` | admin | Lists, adds, edits and deletes events |
| `/participant-registration.html` | admin | Registers a participant for an event and shows the event roster |
| `/criteria-setup.html` | admin | Creates, edits and deletes event criteria and displays total criterion weights |
| `/judge-scoring.html` | judge | Displays assigned events, participants, criteria, score inputs, submission status and revision requests |
| `/revision-requests.html` | admin | Reviews judges' score revision requests |
| `/score-revisions.html` | admin | Displays and manages score revision records |
| `/audit-logs.html` | admin | Displays recorded system activities |

## Shared Layout

Any page can use the shared header, menu and login guard with three lines:

```html
<link rel="stylesheet" href="/css/app.css">
<div id="app-header" data-title="Page title" data-subtitle="Short subtitle" data-role="admin"></div>
<script src="/js/layout.js"></script>
```

`data-role` is optional. When set, only that role can open the page. The menu links are listed at the top of `public/js/layout.js`.

## How to Run

1. **Install Node.js and MySQL 8**, then clone the repository and open its folder.
2. **Install the dependencies:**

   ```bash
   npm install
   ```

3. **Create your `.env` file.** Copy `.env.example` to `.env` and fill in your own MySQL user and password, `DB_NAME=norsu_tabulator`, a `JWT_SECRET`, and the admin account details (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). Never commit `.env`.
4. **Create the database.** In MySQL Workbench, open and run these files from the `database/` folder in this order (the foreign keys file must run last):

   1. `00_init.sql`
   2. `01_montessa_core.sql`
   3. `02_bernadette_master.sql`
   4. `02_carl_transactions.sql`
   5. `06_gretchen_reports.sql`
   6. `database/98_seed_master_data.sql`
   7. `99_foreign_keys.sql`

5. **Create the admin account:**

   ```bash
   npm run seed:admin
   ```

6. **Start the server:**

   ```bash
   npm run dev
   ```

   You should see `MySQL connected` and `Server running on http://localhost:3000`.

7. **Open** `http://localhost:3000/login.html` and log in with the admin email and password from your `.env`.

## Git Workflow

- Work on your own branch, for example `feature/montessa-screens`. Never push directly to `main`.
- Make small commits with clear messages such as `feat:`, `fix:`, and `docs:`.
- Open a pull request for each finished piece, ask someone else to review it, and merge it with **Create a merge commit**.