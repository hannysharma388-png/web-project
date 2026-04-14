# JIS University Academic Management Portal

## Professional Features Added
- **Full Admin Dashboard**: Manage users, courses, attendance, notices, reports, timetables.
- **Role-based Auth**: Admin/Faculty/Student with JWT security.
- **Professional UI**: TailwindCSS, responsive, modals, charts.
- **Backend**: MongoDB, Express, validation, helmet security.
- **Admin Login**: admin@jis.edu / admin123 (run seed).

## Setup
1. MongoDB local running (mongodb://localhost:27017/college)
2. Backend:
```
cd server
npm i
node seeds/seed.js
npm start
```
3. Frontend:
```
cd client
npm i
npm run dev
```
4. Open http://localhost:5173

## Test
- Login as admin@jis.edu / admin123
- Add students/faculty/courses, mark attendance, create notices.

