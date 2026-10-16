# GAI LEE MARTIAL ARTS — Attendance & Monthly Fee Portal

## Features
- Grand dark, red and gold martial-arts themed responsive website using the five logos supplied.
- Five academy/class sections, each with its own student list.
- Admin can add students to a selected academy and delete students.
- Daily present/absent marking by date.
- Monthly attendance reports with present/absent counts and percentage.
- **Monthly fee tracker:** Admin → Monthly fees → choose month → mark each student **PAID** or **UNPAID**. Each month's fee status is saved independently for each student and shown in monthly reports and the class roll.
- Export monthly attendance and fee status to CSV.
- About section with the requested leadership details and motivational quote.

## Open in VS Code
1. Extract `gai_lee_attendance.zip`.
2. Open the extracted folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server** (install the Live Server extension if needed).
4. Click Admin. Default PIN is `1234`.
5. Add students, then use the **Monthly fees** tab to set the selected month's fee status. Fees default to **UNPAID** until marked paid.
6. Change the admin PIN under Settings.

## Important data note
This starter project stores student, attendance, fee and PIN data in browser `localStorage` on this device only. It does not sync between devices and the PIN is a simple front-end lock, not secure server authentication. Export CSV backups regularly. For a shared multi-device system, connect a backend/database and secure login before using real records.
