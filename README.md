# NORSU Tabulator System

A web system for managing school events (such as pageants and Hugyawan), registering participants, assigning judges, and tabulating results. It is a DBMS project built with Node.js, Express and MySQL. The frontend is plain HTML, CSS and JavaScript that calls a JSON API.

## Team

| Member | GitHub username | Module |
|---|---|---|
| Carl Agustine Noblesala | `@agguussttiinnee` | Transactions |
| Bernadette Callenero | `@na-dette` | Master data |
| Gretchen Hope Cabudbud | `@gretchenhope-arch` | Reports  |
| Montessa Busmeon | `@mntxsa` | Core: login, users, judge assignment |
| Izy Mae Adrivan | `@izymaeadrivan16` | Rules |
| Resty Catipay | `@catipayresty` | Workflow and audit |

## Ownership matrix

Cells stay blank until the member finishes that piece. The progress row stays blank until the group confirms the roles.

| | Carl | Bernadette | Gretchen | Montessa | Izy | Resty |
|---|---|---|---|---|---|---|
| *Tables* | | colleges, event_types, venues | award_categories, awards | roles, users, event_judges | | score_submissions, score_revisions, audit_logs |
| *Endpoints* | | /api/colleges, /api/event-types, /api/venues | /api/awards | /api/auth, /api/users, /api/event-judges | | /api/score-submissions, /api/score-revisions, /api/audit-logs |
| *Screens* | | colleges.html | awards.html | login.html, judge-home.html, users.html, judge-assignment.html | | judge-scoring.html, audit-logs.html |
| *Shared files* | | | | public/js/layout.js, public/css/app.css | | utils/audit.js |
| *Join report* | | GET /api/colleges/report/no-participants (LEFT JOIN) | GET /api/awards/leaderboard (INNER join) | GET /api/event-judges/report (INNER join) | | GET /api/score-submissions/report/judges-vs-submissions (FULL OUTER JOIN) |
| **Progress** | | | | | | |


### Endpoints

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
| `GET /api/event-judges` | admin | Lists assignments |
| `POST /api/event-judges` | admin | Assigns a judge to an event |
| `DELETE /api/event-judges/:id` | admin | Removes an assignment |
| `GET /api/event-judges/report` | admin | Judges per event (INNER join of `event_judges`, `events`, `users` and `roles`) |
| `GET /api/awards/leaderboard` | admin, judge | Leaderboard rows with participant, college and event (INNER join of `awards`, `award_categories`, `events`, `participants` and `colleges`) |
| `GET /api/awards/categories` | admin, judge | Lists award categories |
| `POST /api/awards/categories` | admin | Adds an award category |
| `GET /api/awards` | admin, judge | Lists awards (optional `event_id`) |
| `GET /api/awards/:id` | admin, judge | Returns one award |
| `POST /api/awards` | admin | Creates an award (the rank must be free for that event and category) |
| `PUT` or `PATCH /api/awards/:id` | admin | Updates an award; every field is optional |
| `DELETE /api/awards/:id` | admin | Soft-deletes an award; its rank can be used again |

Status codes used: `400` bad input, `401` missing or expired token, `403` not an admin, `404` not found, `409` duplicate (email already used, or judge already assigned), `201` created.

### Screens

| Page | Who | What it does |
|---|---|---|
| `/login.html` | everyone | Logs in, saves the token as `norsuToken`, and redirects by role |
| `/judge-home.html` | judge | Judge landing page |
| `/users.html` | admin | List, add, edit and delete users |
| `/judge-assignment.html` | admin | Assign and remove judges, and shows the judges-per-event report |
| `/awards.html` | admin | Shows the leaderboard and lets you add, edit and delete awards |

### Shared layout

Any page can use the shared header, menu and login guard with three lines:

```html
<link rel="stylesheet" href="/css/app.css">
<div id="app-header" data-title="Page title" data-subtitle="Short subtitle" data-role="admin"></div>
<script src="/js/layout.js"></script>
```

`data-role` is optional. When set, only that role can open the page. The menu links are listed at the top of `public/js/layout.js`.

## How to run

1. **Install Node.js and MySQL 8**, then clone the repository and open its folder.
2. **Install the dependencies:**
   ```
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
   ```
   npm run seed:admin
   ```
6. **Start the server:**
   ```
   npm run dev
   ```
   You should see `MySQL connected` and `Server running on http://localhost:3000`.
7. **Open** `http://localhost:3000/login.html` and log in with the admin email and password from your `.env`.

## Git workflow

- Work on your own branch, for example `feature/montessa-screens`. Never push to `main`.
- Make small commits with clear messages (`feat:`, `fix:`, `docs:`).
- Open a pull request for each finished piece, ask someone else to review it, and merge it with **Create a merge commit**.
