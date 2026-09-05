# Product Requirements Document (PRD)
# Ashtavakra Hostel Gym Management & Slot Booking System

**Version:** 1.0  
**Status:** Draft  
**Date:** 05 September 2026

---

## 1. Product Overview

The Ashtavakra Hostel Gym Management & Slot Booking System is a web-based platform for managing gym memberships, time-slot reservations, attendance, member profiles, and gym usage analytics.

The system will have two primary roles:

- **Member:** Registers with an approved Somaiya organizational email, maintains a profile, views available gym slots, books/cancels slots, and views personal booking and attendance history.
- **Admin:** Has complete visibility and control over members, bookings, slots, attendance, reports, settings, announcements, and analytics.

The goal is to replace manual registers, spreadsheets, or informal booking methods with a centralized and transparent system.

---

## 2. Goals

### Primary Goals

1. Allow eligible hostel residents/members to create and manage gym accounts.
2. Restrict registration to approved Somaiya organizational email domains.
3. Provide a simple slot-booking experience.
4. Prevent overbooking and duplicate/conflicting bookings.
5. Allow the admin to track attendance for every booked slot.
6. Provide useful gym utilization and attendance metrics.
7. Maintain complete member and booking history.
8. Reduce administrative effort.
9. Provide a responsive experience on desktop and mobile.
10. Keep the architecture extensible for future features.

### Success Metrics

- 100% of bookings recorded digitally.
- Zero bookings above configured slot capacity.
- Admin can determine who booked and who attended a slot in under 30 seconds.
- Member can complete a booking in under 1 minute.
- Member registration completion rate above 90%.
- Accurate attendance and booking reports.
- Reduced manual administrative work.

---

## 3. Non-Goals for MVP

The first version will not require:

- Gym equipment IoT integration.
- Workout-plan generation.
- Nutrition/diet tracking.
- Online payments.
- Trainer marketplace.
- Public registration outside approved organization accounts.
- Native Android/iOS applications.

These may be considered in future versions.

---

# 4. User Roles

## 4.1 Member

A member can:

- Register using an approved organizational email.
- Verify email using OTP/link.
- Log in and log out.
- Reset password.
- Complete and edit their profile.
- View available gym slots.
- Book an available slot.
- Cancel an eligible booking.
- View upcoming bookings.
- View booking history.
- View personal attendance.
- View attendance percentage.
- View notifications.
- Read gym rules and announcements.

## 4.2 Admin

An admin can:

- Log in through a protected admin account.
- View all members.
- Search and filter members.
- View complete member profiles.
- Activate/deactivate accounts.
- Block/unblock members.
- Edit member information where permitted.
- View all bookings.
- Filter bookings by date, slot, member, and status.
- Create or cancel bookings manually.
- Manage slots.
- Configure slot capacity.
- Mark attendance.
- Correct attendance records.
- View attendance history.
- View analytics.
- Generate/export reports.
- Manage gym rules.
- Publish announcements.
- Configure booking rules.
- View audit logs.

---

# 5. Authentication & Registration

## 5.1 Registration Fields

The registration form should contain:

- Member ID
- Full Name
- Blood Group
- Phone Number
- Organizational Email
- Room Number (recommended)
- Password
- Confirm Password
- Agreement to gym rules

Optional future fields:

- Course/Department
- Year
- Emergency contact

## 5.2 Organizational Email Restriction

Only approved Somaiya organizational email domains may register.

The allowed domain list should be configurable by the admin/system configuration rather than hard-coded.

Example:

```text
user@approved-somaiya-domain
        |
        v
Domain validation
        |
        v
OTP/email verification
        |
        v
Account activation
```

The system must reject unapproved email domains.

## 5.3 Member ID

Member ID should be unique.

The system should prevent two accounts from using the same Member ID.

## 5.4 Email Verification

A new account must be verified before it can book gym slots.

Verification can use:

- OTP, or
- Verification link.

## 5.5 Password Security

Passwords must never be stored as plain text.

Use a secure password hashing algorithm such as Argon2id or bcrypt.

---

# 6. Gym Slot Management

## 6.1 Default Operating Periods

### Morning

- Opening: 06:00 AM
- Closing: 09:00 AM

### Evening

- Opening: 04:00 PM
- Closing: 09:00 PM

The exact slot duration and interval should be configurable.

## 6.2 Slot Configuration

The admin should be able to configure:

- Morning opening time
- Morning closing time
- Evening opening time
- Evening closing time
- Slot duration
- Interval between slots
- Maximum members per slot
- Maximum bookings per member per day
- Booking opening period
- Cancellation deadline

The system should generate slots automatically based on these settings.

## 6.3 Example Slot Configuration

If the gym uses 1 hour 45 minute sessions, the system should calculate slots from the configured opening/closing times.

The product must not assume that the last slot can extend beyond the configured closing time. The system should either:

1. Reject an over-running slot, or
2. Allow the admin to explicitly configure it.

---

# 7. Booking System

## 7.1 Member Booking Flow

```text
Login
  |
  v
Select Date
  |
  v
View Available Slots
  |
  v
Select Slot
  |
  v
Check Eligibility
  |
  +---- Already booked/conflicting? ---> Reject
  |
  +---- Slot full? --------------------> Waitlist (if enabled)
  |
  v
Confirm Booking
  |
  v
Booking Created
  |
  v
Confirmation Notification
```

## 7.2 Booking Statuses

Possible booking states:

- `CONFIRMED`
- `CANCELLED`
- `WAITLISTED`
- `COMPLETED`
- `NO_SHOW`
- `PENDING`

## 7.3 Capacity

Each slot must have a configurable capacity.

Example:

```text
Capacity: 20

Current bookings: 18
Available: 2
```

When capacity is reached, the slot must not accept additional confirmed bookings.

## 7.4 Duplicate Booking Prevention

The backend must enforce booking constraints.

Depending on configured policy, a member should not be allowed to:

- Book the same slot twice.
- Book conflicting slots.
- Exceed the configured daily booking limit.

Database-level constraints should be used where possible.

## 7.5 Cancellation

Members should be allowed to cancel before a configurable deadline.

Example:

```text
Slot: 06:00 AM
Cancellation deadline: 30 minutes before start
```

After the deadline, cancellation may require admin approval.

---

# 8. Waitlist

Waitlist should be supported as an optional feature.

When a slot is full:

```text
20 / 20

[ JOIN WAITLIST ]
```

Members receive a position:

```text
Waitlist Position: #3
```

When a confirmed booking is cancelled:

```text
Cancelled booking
       |
       v
First eligible waitlisted member
       |
       v
Booking automatically promoted
       |
       v
Notification sent
```

The admin can enable/disable waitlists.

---

# 9. Attendance Management

## 9.1 Admin Attendance Flow

```text
Admin
  |
  v
Select Date
  |
  v
Select Slot
  |
  v
View Booked Members
  |
  v
Mark:
  - Attended
  - Not Attended
  - Pending
  |
  v
Save
```

## 9.2 Attendance Status

Recommended statuses:

- `PENDING`
- `ATTENDED`
- `NOT_ATTENDED`
- `EXCUSED`

## 9.3 Bulk Attendance

Admin should have:

```text
[ MARK ALL ATTENDED ]
```

and then manually change exceptions.

## 9.4 Attendance History

Every attendance record should contain:

- Member
- Booking
- Slot
- Date
- Attendance status
- Check-in time, if applicable
- Marked by
- Timestamp
- Last updated by

---

# 10. QR Code Check-In

QR check-in is a recommended feature.

## Flow

```text
Member opens active booking
        |
        v
Temporary QR code generated
        |
        v
Admin/staff scans QR
        |
        v
System validates:
- Member
- Booking
- Slot
- Date/time
        |
        v
Attendance = ATTENDED
```

The QR code should be short-lived and tied to the specific booking to prevent sharing or reuse.

---

# 11. Member Dashboard

The member dashboard should show:

### Summary Cards

- Upcoming bookings
- Total bookings
- Total attended sessions
- Total no-shows
- Attendance percentage

### Upcoming Booking

Display:

- Date
- Slot
- Booking status
- Cancellation option
- QR check-in option when active

### Quick Actions

- Book a Slot
- My Bookings
- Attendance
- Profile

---

# 12. Member Profile

Member profile should contain:

```text
Member ID
Full Name
Email
Phone
Blood Group
Room Number
Account Status
Registration Date
```

Members should be able to edit allowed fields.

Sensitive/admin-controlled fields should require admin privileges to modify.

---

# 13. Admin Dashboard

The admin dashboard should provide a high-level view of gym activity.

## KPI Cards

Recommended:

- Total Members
- Active Members
- Today's Bookings
- Today's Attendance
- Attendance Rate
- No-Show Rate
- Today's Utilization
- Upcoming Bookings

## Today's Slot Overview

Example:

```text
Slot              Capacity   Booked   Attended
------------------------------------------------
06:00–07:45          20        18        16
07:45–09:00          20        20        18
04:00–05:45          20        15        13
05:45–07:30          20        20        19
07:30–09:00          20         9         7
```

---

# 14. Analytics & Metrics

The system should calculate:

## Member Metrics

- Total members
- Active members
- Inactive members
- New registrations
- Members with low attendance
- Members with frequent no-shows

## Booking Metrics

- Total bookings
- Confirmed bookings
- Cancelled bookings
- Waitlisted bookings
- Bookings per day
- Bookings per week
- Bookings per month

## Attendance Metrics

- Total attended
- Total absent
- Attendance percentage
- No-show percentage
- Attendance by day
- Attendance by slot
- Attendance by month

## Utilization Metrics

```text
Slot utilization =
Confirmed bookings / Slot capacity × 100
```

The dashboard should identify:

- Most popular slot
- Least popular slot
- Peak gym period
- Average daily usage
- Morning vs evening utilization

## Recommended Charts

- Daily bookings
- Weekly attendance trend
- Slot utilization
- Morning vs evening usage
- No-show trend
- Member registration trend

---

# 15. Member Management

Admin should have a member table:

```text
Member ID | Name | Email | Room | Status | Attendance | Actions
```

Features:

- Search
- Sort
- Filter
- Pagination
- View profile
- Activate/deactivate
- Block/unblock
- Edit
- View booking history
- View attendance history

Filters:

- Account status
- Blood group
- Room
- Attendance range
- Registration date

---

# 16. Booking Management

Admin can:

- View all bookings.
- Search by Member ID/name.
- Filter by date.
- Filter by slot.
- Filter by booking status.
- Manually create booking.
- Cancel booking.
- Change booking.
- View waitlist.
- Override booking rules where authorized.

All admin overrides should be logged.

---

# 17. Notifications

The system should support notifications for:

### Booking

- Booking confirmation
- Booking cancellation
- Waitlist promotion

### Reminders

- Upcoming booking reminder
- Slot starting reminder

### Attendance

- Attendance marked
- No-show recorded

### Administration

- Gym closure
- Schedule changes
- Announcements
- Maintenance

Channels:

- In-app notifications
- Email

SMS/WhatsApp can be considered later.

---

# 18. Announcements

Admin should be able to publish announcements.

Example:

```text
GYM CLOSED

The gym will remain closed on 10 September
from 4:00 PM to 9:00 PM due to maintenance.

[ Acknowledge ]
```

Announcements can have:

- Title
- Description
- Start date
- End date
- Priority
- Active/inactive status

---

# 19. Gym Rules

Admin should be able to maintain gym rules.

Example:

1. Carry hostel/student identification.
2. Book only slots you intend to attend.
3. Cancel bookings you cannot use.
4. Maintain cleanliness.
5. Return equipment after use.
6. Follow gym safety instructions.
7. Do not share booking credentials or QR codes.

Members should accept the rules during registration.

---

# 20. Reports & Export

Admin should be able to export:

### Member Report

```text
Member ID
Name
Email
Phone
Room
Blood Group
Status
```

### Booking Report

```text
Date
Slot
Member ID
Member Name
Booking Status
```

### Attendance Report

```text
Date
Slot
Member ID
Name
Attendance
Check-in Time
Marked By
```

Formats:

- CSV
- XLSX
- PDF (optional)

Reports should support date-range filters.

---

# 21. Audit Logging

Administrative actions must be recorded.

Example:

```text
Timestamp
Admin
Action
Target
Previous Value
New Value
IP/device metadata where appropriate
```

Examples:

- Attendance changed
- Member blocked
- Booking cancelled by admin
- Slot capacity changed
- Gym settings changed

Audit logs should be viewable only by authorized administrators.

---

# 22. Data Model

Recommended core entities:

## User

```text
id
member_id
name
email
phone
blood_group
room_number
password_hash
role
status
email_verified
created_at
updated_at
```

## Slot

```text
id
date
start_time
end_time
capacity
status
created_at
```

## Booking

```text
id
user_id
slot_id
status
booked_at
cancelled_at
cancellation_reason
```

## Attendance

```text
id
booking_id
status
check_in_time
marked_by
marked_at
updated_at
```

## Waitlist

```text
id
user_id
slot_id
position
status
created_at
```

## Notification

```text
id
user_id
type
title
message
is_read
created_at
```

## Announcement

```text
id
title
content
priority
start_date
end_date
status
created_by
created_at
```

## Gym Settings

```text
id
morning_start
morning_end
evening_start
evening_end
slot_duration
slot_interval
default_capacity
max_bookings_per_day
cancellation_deadline
waitlist_enabled
```

## Audit Log

```text
id
admin_id
action
entity_type
entity_id
old_value
new_value
created_at
```

---

# 23. Recommended Database Constraints

The database should enforce:

1. Unique Member ID.
2. Unique verified organizational email.
3. Valid user role.
4. Valid booking status.
5. Valid attendance status.
6. Booking must reference an existing member and slot.
7. Attendance must reference an existing booking.
8. Booking capacity must be enforced transactionally.
9. Duplicate booking prevention.
10. Appropriate indexes for date, slot, member, and booking status.

---

# 24. Security Requirements

The system must implement:

- HTTPS.
- Secure password hashing.
- Role-based access control.
- Protected admin routes.
- Input validation.
- Server-side authorization.
- CSRF protection where applicable.
- Rate limiting.
- Secure session/token handling.
- Email verification.
- Database backups.
- Audit logging.
- Protection against SQL injection.
- Protection against XSS.
- Secure file/report generation.

The frontend must never be trusted to enforce permissions.

Example:

```text
Member tries to call admin API
        |
        v
Backend checks role
        |
        v
Role != ADMIN
        |
        v
403 Forbidden
```

---

# 25. Privacy Requirements

Member information should only be visible to authorized users.

Recommended visibility:

### Member

Can see:

- Own profile
- Own bookings
- Own attendance

### Admin

Can see:

- All member profiles
- All bookings
- All attendance
- Reports and analytics

Blood group and phone number should not be publicly visible to other members.

---

# 26. UI/UX Requirements

The UI should be:

- Mobile responsive.
- Simple.
- Fast.
- Accessible.
- Consistent.
- Easy for first-time users.

### Primary Navigation

#### Member

```text
Dashboard
Book Slot
My Bookings
Attendance
Profile
Notifications
Gym Rules
Logout
```

#### Admin

```text
Dashboard
Members
Bookings
Attendance
Slots
Waitlist
Analytics
Reports
Announcements
Settings
Audit Logs
Logout
```

---

# 27. Recommended Pages

## Public

- Login
- Registration
- Email Verification
- Forgot Password
- Reset Password
- Gym Rules

## Member

- Dashboard
- Slot Booking
- Booking Confirmation
- My Bookings
- Booking Details
- Attendance
- Profile
- Notifications

## Admin

- Dashboard
- Members
- Member Details
- Bookings
- Booking Details
- Attendance
- Slot Management
- Waitlist
- Analytics
- Reports
- Announcements
- Settings
- Audit Logs

---

# 28. Booking Rules

The following should be configurable rather than permanently hard-coded:

- Maximum bookings per day.
- Maximum future bookings.
- Cancellation deadline.
- Slot capacity.
- Waitlist availability.
- Booking opening time.
- Booking closing time.
- Whether past bookings can be modified.
- No-show restrictions.

Recommended initial policy:

```text
Maximum bookings/day: 1
Maximum future bookings: 1
Cancellation allowed until: 30 minutes before slot
Waitlist: Enabled
```

These are product defaults and should be confirmed by hostel administration.

---

# 29. No-Show Policy

The system should track no-shows.

Example:

```text
Bookings: 20
Attended: 15
No-show: 5
No-show rate: 25%
```

An optional configurable rule can be introduced:

```text
No-shows >= 3
        |
        v
Temporary booking restriction
        |
        v
Admin review
```

The exact penalty must be decided by hostel administration.

---

# 30. Edge Cases

The system must handle:

### Full Slot

Show:

```text
Slot Full
[Join Waitlist]
```

### Duplicate Booking

Show:

```text
You already have a booking for this period.
```

### Gym Closed

Show:

```text
Gym is closed on this date.
```

### Cancellation Deadline Passed

Show:

```text
Cancellation is no longer available.
Contact the administrator.
```

### Unverified Email

Prevent booking.

### Deactivated Account

Prevent login/booking according to account policy.

### Slot Deleted After Booking

Existing bookings should be handled safely and affected members should be notified.

### Admin Changes Capacity

Do not automatically cancel valid existing bookings unless explicitly required.

### Concurrent Bookings

Two members attempting to take the last slot simultaneously must not result in overbooking. Use transactional/database-level protection.

---

# 31. Performance Requirements

Target:

- Normal page load under 2 seconds on a good connection.
- Booking confirmation under 2 seconds under normal load.
- Dashboard queries should be optimized.
- Pagination for large member/booking lists.
- Database indexes on frequent query fields.

Expected initial scale:

- 100–1,000 members.
- 5–10 slots/day.
- Thousands of historical bookings.

The architecture should be able to scale beyond this.

---

# 32. Availability & Reliability

The system should:

- Prevent duplicate booking transactions.
- Handle temporary network errors gracefully.
- Avoid losing attendance updates.
- Maintain regular database backups.
- Provide meaningful error messages.
- Log server-side failures.

---

# 33. Technology Recommendation

## Frontend

Recommended:

- Next.js
- React
- TypeScript
- Tailwind CSS

## Backend

Recommended:

- Next.js API routes/server actions, or
- Node.js + Express/NestJS, or
- FastAPI

For a single full-stack project, Next.js + TypeScript can simplify deployment.

## Database

- PostgreSQL

## Authentication

- Secure email/password authentication
- Organizational email verification
- Optional future Google/Microsoft SSO

## Deployment

Possible setup:

```text
Frontend/Backend
      |
      v
Cloud hosting

      |
      v

PostgreSQL
```

Potential hosting choices include Vercel, Render, Railway, AWS, or a hostel/institution-managed server.

---

# 34. Suggested Project Architecture

```text
gym-management-system/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── hooks/
│   └── services/
│
├── backend/
│   ├── auth/
│   ├── users/
│   ├── bookings/
│   ├── slots/
│   ├── attendance/
│   ├── notifications/
│   ├── analytics/
│   └── reports/
│
├── database/
│   ├── migrations/
│   └── seed/
│
├── tests/
│
├── docs/
│
└── README.md
```

For a Next.js full-stack implementation, these modules can instead live within a single application.

---

# 35. API Requirements

Representative API endpoints:

## Authentication

```text
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

## Member

```text
GET  /api/me
PATCH /api/me
GET  /api/me/bookings
GET  /api/me/attendance
```

## Slots

```text
GET  /api/slots
GET  /api/slots/:id
POST /api/admin/slots
PATCH /api/admin/slots/:id
DELETE /api/admin/slots/:id
```

## Bookings

```text
POST /api/bookings
GET  /api/bookings
GET  /api/bookings/:id
POST /api/bookings/:id/cancel
```

## Attendance

```text
GET   /api/admin/attendance
PATCH /api/admin/attendance/:id
POST  /api/admin/attendance/bulk
POST  /api/check-in
```

## Admin

```text
GET /api/admin/dashboard
GET /api/admin/members
GET /api/admin/bookings
GET /api/admin/analytics
GET /api/admin/reports
```

---

# 36. MVP Scope

The first release should contain:

### Authentication

- Registration
- Organizational email validation
- Email verification
- Login/logout
- Password reset

### Member

- Profile
- Slot availability
- Slot booking
- Cancellation
- Booking history
- Attendance history

### Admin

- Dashboard
- Member management
- Booking management
- Attendance management
- Slot configuration
- Basic analytics

### Database

- Users
- Slots
- Bookings
- Attendance
- Settings

---

# 37. Version 2 Features

After MVP:

- QR check-in
- Waitlist
- Email reminders
- Announcements
- Advanced analytics
- CSV/XLSX export
- PDF reports
- Audit logs
- No-show restrictions
- Advanced admin permissions

---

# 38. Future Features

Potential future enhancements:

- Mobile PWA.
- Native mobile application.
- Gym equipment availability.
- Equipment maintenance tracking.
- Workout tracking.
- Trainer management.
- Fitness challenges.
- Leaderboards.
- AI-based gym utilization prediction.
- Predictive peak-hour analysis.
- Automated capacity recommendations.
- Integration with hostel/student management systems.
- SSO with institutional identity provider.

---

# 39. Acceptance Criteria

## Registration

- [ ] User cannot register with an unapproved email domain.
- [ ] Member ID must be unique.
- [ ] Email verification is required.
- [ ] Password is securely hashed.
- [ ] User cannot book before verification.

## Booking

- [ ] User can see available slots.
- [ ] User can book an available slot.
- [ ] Full slots cannot be overbooked.
- [ ] Duplicate/conflicting bookings are prevented.
- [ ] Successful booking generates a confirmation.
- [ ] Cancellation follows configured rules.

## Attendance

- [ ] Admin can select date and slot.
- [ ] Admin can see all booked members.
- [ ] Admin can mark attendance.
- [ ] Attendance changes are persisted.
- [ ] Member can see their attendance history.

## Admin

- [ ] Admin can see all members.
- [ ] Admin can see all bookings.
- [ ] Admin can manage slots.
- [ ] Admin can view analytics.
- [ ] Admin can export reports.
- [ ] Admin-only functions cannot be accessed by members.

## Security

- [ ] Passwords are never stored in plaintext.
- [ ] Admin APIs enforce authorization server-side.
- [ ] Input validation is implemented.
- [ ] Booking transactions prevent race-condition overbooking.
- [ ] Sensitive member data is protected.

---

# 40. Recommended MVP User Journey

## Member

```text
Register
   ↓
Verify Somaiya Email
   ↓
Login
   ↓
Complete Profile
   ↓
Dashboard
   ↓
Book Slot
   ↓
Receive Confirmation
   ↓
Attend Gym
   ↓
Admin Marks Attendance
   ↓
Member Views Attendance
```

## Admin

```text
Admin Login
   ↓
Dashboard
   ↓
View Today's Slots
   ↓
Select Slot
   ↓
View Booked Members
   ↓
Mark Attendance
   ↓
View Analytics
   ↓
Generate Report
```

---

# 41. Product Principles

1. **Simple for members.**
2. **Powerful for administrators.**
3. **No overbooking.**
4. **Accurate attendance records.**
5. **Privacy by default.**
6. **Configurable rules instead of hard-coded assumptions.**
7. **Mobile-first responsive design.**
8. **Every important admin action should be traceable.**
9. **The system should reduce manual work rather than reproduce spreadsheets online.**
10. **Architecture should support future hostel-wide expansion.**

---

# 42. Final Product Definition

The Ashtavakra Hostel Gym Management System will serve as the central platform for:

**Member Registration → Authentication → Slot Booking → Attendance → Analytics → Administration → Reporting**

The MVP should focus on making three workflows exceptionally reliable:

1. **Member books a slot.**
2. **Admin records attendance.**
3. **Admin understands gym utilization through metrics.**

Once these workflows are stable, QR check-in, waitlists, notifications, reports, and advanced analytics can be added without changing the core product architecture.
