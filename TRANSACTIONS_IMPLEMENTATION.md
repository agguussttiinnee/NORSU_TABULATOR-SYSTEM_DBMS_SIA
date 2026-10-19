# Carl's Transactions Module Updates

This update addresses the four Transactions feedback items while preserving the existing Express/MySQL structure.

## 1. Shared authentication

- The manual token-pasting fields have been removed from both Transactions pages.
- `public/js/transaction-auth.js` reads the existing `localStorage` key `norsuToken`, validates it through `GET /api/auth/me`, and adds the Bearer token automatically to API requests.
- Missing or expired sessions are redirected to `/login.html?returnUrl=...`.
- The login page supplied by the Core module must save the JWT using `localStorage.setItem('norsuToken', data.token)` and should honor the optional `returnUrl` query parameter after successful login.
- The supplied project ZIP did not include Montessa's login page or its stylesheet. Therefore, the Transactions pages are prepared to integrate with it, but the exact shared login page and CSS still need to be merged/copied into `public/` from her Core module. If her login route is not `/login.html`, change `data-login-path` on the `<html>` element in both Transactions pages.

## 2. Master-data dropdowns

The Events page loads event types and venues through `GET /api/events/lookups`. The Participant Registration page loads active colleges from the same endpoint. No IDs need to be typed manually.

Authenticated endpoint response shape:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "eventTypes": [{ "id": 1, "name": "Cultural Event" }],
    "venues": [{ "id": 1, "name": "NORSU Main Campus Open Court", "location": "Dumaguete City" }],
    "colleges": [{ "id": 1, "name": "College of Arts and Sciences", "code": "CAS" }]
  }
}
```

## 3. Participant reuse

- `GET /api/events/participants?college_id=1&participant_type=candidate` lists active participants for the selection controls.
- The registration form can select an existing participant by ID.
- When a new name is entered, the backend searches for an active participant with the same case-insensitive name, participant type, and college. It reuses that participant instead of inserting another copy.
- The registration response includes `participant_reused` so the UI can explain whether an existing record was reused.
- The participant and event-registration write remains inside one database transaction.

## 4. Common demo events

Run `npm run seed:demo-events` after the Master Data rows and database schema exist. It adds these shared examples once:

- NORSU College Pageant 2026
- NORSU Hugyawan 2026

The script expects the event type `Cultural Event` and venue `NORSU Main Campus Open Court` to exist. Its default dates (`2026-12-01 08:00:00` and `2026-12-02 08:00:00`) are classroom demo placeholders, not confirmed official schedules. They can be overridden with `DEMO_PAGEANT_DATE` and `DEMO_HUGYAWAN_DATE` environment variables before running the script.

## API routes used

All `/api/events` routes require an authenticated admin token.

- `GET /api/events/lookups` - event types, venues, and active colleges
- `GET /api/events` - active events
- `GET /api/events/participants` - active participants, optionally filtered by college and participant type
- `GET /api/events/:id/participants` - event roster
- `POST /api/events/:id/participants` - register a new or existing participant

## Local run

1. Make sure the `.env` file is configured locally and remains untracked.
2. Run `npm install` if dependencies are not installed.
3. Run `npm run dev`.
4. Sign in through the shared Core login page. It must store its JWT in `localStorage.norsuToken`.
5. Open `/events.html` or `/participant-registration.html`.
6. To add the shared examples, run `npm run seed:demo-events` in a separate terminal.
