 # Fixing Component Bugs - Implementation Steps

## Plan Overview
- Fix AttendanceTable prop in FacultyDashboard.jsx (classId → subjectId)
- Add safety check for test.duration in TestModal.jsx
- No changes needed for AdminDashboard.jsx or StudentDashboard.jsx (already correct)
- Verify all dashboards work after changes

## Steps (2/2 completed)

### ✅ 1. Edit FacultyDashboard.jsx & TestModal.jsx
- Fixed AttendanceTable prop: classId → subjectId  
- Added safety check: (test?.duration || 0) * 60
- Run `cd client && npm run dev`
- Check Admin/Student/Faculty dashboards and TestModal

### ☐ 4. Complete Task
- Update TODO.md to ✅
- attempt_completion

