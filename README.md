# CineSeat ticket booking

A role-based movie ticket booking system built with React, Express, MongoDB, email OTP authentication, HTTP-only JWT cookies, and SMTP ticket delivery.

## Run locally

Requirements: Node.js 20+ and MongoDB (a replica set or MongoDB Atlas is required for booking transactions).

1. Copy `backend/.env.example` to `backend/.env` and configure MongoDB, JWT, and SMTP values.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Run `npm install` in both `frontend` and `backend`.
4. Set `ADMIN_EMAIL`, then run `npm --prefix backend run seed:admin` to create the first admin.
5. In separate terminals run `npm run dev:backend` and `npm run dev:frontend`.
6. Open http://localhost:5173.

When SMTP is not configured in development, the OTP is returned by the request endpoint and displayed on the verification screen. Production never exposes the OTP.

## Core behavior

- MongoDB is the source of truth; CSV is generated on demand.
- Seats move through `AVAILABLE → HELD → BOOKED` and expired holds are released every minute.
- Multiple-seat confirmation uses a MongoDB transaction.
- Booking prices and movie/show details are stored as snapshots.
- Movies are deactivated rather than permanently deleted.
- Ticket email failures are recorded without rolling back a valid booking.
"# CineSeat" 
