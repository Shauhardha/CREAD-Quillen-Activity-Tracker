# CREAD & Quillen Activity Tracker
## Project Documentation

**Version:** 1.0
**Last Updated:** May 2026
**Live Application:** [https://creadquillen.click](https://creadquillen.click)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Who Uses This System](#2-who-uses-this-system)
3. [Key Features](#3-key-features)
4. [How the Data is Organized](#4-how-the-data-is-organized)
5. [The Dashboard & Analytics](#5-the-dashboard--analytics)
6. [Security & Access Control](#6-security--access-control)
7. [Technical Architecture](#7-technical-architecture)
8. [System Infrastructure](#8-system-infrastructure)
9. [Developer Guide](#9-developer-guide)
10. [Glossary](#10-glossary)

---

## 1. Project Overview

The **CREAD & Quillen Activity Tracker** is a secure, web-based program management system built for the Center for Rural Education and Diversity (CREAD) at Quillen. It serves as the central hub for tracking all community outreach activities, strategic initiatives, stakeholder relationships, and funding tied to the organization's mission of improving rural health and education outcomes across Tennessee.

### What Problem Does It Solve?

Before this system, tracking activities, outcomes, and stakeholder engagement required managing spreadsheets across multiple staff members, making it difficult to get a unified view of program progress, identify which initiatives were performing well, or produce timely reports for funders and leadership.

This application replaces that process with a single, role-based platform where:

- **Program staff** can log activities, record progress updates, and associate stakeholders and funding in real time
- **Administrators** can manage users, oversee all program data, and configure reference data
- **Read-only users** (such as evaluators or board members) can view dashboards, reports, and activity details without the risk of accidental data modification
- **Leadership** can view interactive dashboards and maps without needing to request reports manually

### Core Mission Alignment

Every activity logged in the system is tied to a **Strategic Goal**, which rolls up to an **Initiative**. This structure ensures that day-to-day work is always connected to the organization's broader strategic framework, making it easy to demonstrate impact and alignment to funders and stakeholders.

---

## 2. Who Uses This System

The system has three user roles, each with a distinct level of access:

### Admin
Administrators have full access to the entire system. They can:
- Create, edit, and delete any activity, initiative, or strategic goal
- Manage user accounts — add new staff, update roles, activate or deactivate accounts
- Configure all reference data (activity types, funding sources, partnership types, education levels, cultural wealth tags, locations)
- View all dashboards and analytics
- Export activity data to Excel

**Typical users:** Program directors, IT administrators

### Staff
Staff members are the primary day-to-day users of the system. They can:
- Create and edit activities, including recording progress updates, milestones, stakeholders, and cultural wealth tags
- Manage stakeholder records
- Add and edit initiatives, strategic goals, and reference data
- View all dashboards and analytics
- Export activity data to Excel

**Typical users:** Program coordinators, outreach staff, data entry personnel

### Read-Only
Read-only users have a view-only experience. They can:
- Browse all activity records and their details
- View all dashboards, charts, and the interactive map
- View the activity calendar
- Export activity data to Excel

They **cannot** create, edit, or delete any data.

**Typical users:** Evaluators, board members, grant monitors, external partners reviewing program outcomes

---

## 3. Key Features

### Activity Management
The core of the system. Each **Activity** represents a program event, workshop, training, outreach effort, or service delivery instance. When logging an activity, staff can record:

- Title, description, and current status (Pending / Active / Completed)
- Start and end dates
- Geographic location (city, county, state)
- Primary audience and education level
- Partnership type and funding source
- Activity type classification
- Deliverables, intended outcomes, evidence of impact, and sustainability plan
- Lead staff members responsible for the activity
- Associated stakeholders
- Cultural Wealth capital tags (see Glossary)

### Progress Updates
At any time, staff can log a **Progress Update** on an activity to record:
- Narrative notes on what occurred
- Milestone reached (if applicable)
- Quantitative outcomes (numbers served, attendance counts, etc.)
- Qualitative outcomes (testimonials, observations, narrative impact)
- Evaluation tool references

This creates a running timeline of activity progress that is visible on the Activity Details page.

### Milestones
Each activity can have discrete **Milestones** — checkpoints that indicate a key deliverable or phase has been completed. Milestones are plotted on the Activity Calendar so leadership and staff can see upcoming and past milestone dates across all programs.

### Initiatives & Strategic Goals
Activities are organized under a two-level strategic framework:

```
Initiative → Strategic Goal → Activity
```

- An **Initiative** is a broad program area (e.g., "Rural Health Workforce Development")
- A **Strategic Goal** is a specific objective under that initiative, classified as either short-term or long-term
- Activities are linked to both an Initiative and optionally to one or more Strategic Goals

This structure makes it easy to generate reports showing how individual activities contribute to each strategic priority.

### Stakeholder Management
The system maintains a directory of **Stakeholders** — organizations, community partners, and individuals engaged through program activities. Each stakeholder record includes:
- Organization name and contact information
- Geographic location (with coordinates for map display)

Stakeholders can be associated with one or more activities, and they appear as pins on the interactive service area map.

### Activity Calendar
A monthly calendar view showing all activities plotted by their start and end dates, color-coded by status:
- Yellow — Pending
- Blue — Active
- Green — Completed

Milestone markers are also shown on the calendar. Staff can filter by initiative, status, or specific activity.

### Interactive Service Area Map
A geographic map of Tennessee showing:
- Activity locations as interactive pins
- Stakeholder locations as interactive pins

Clicking a pin reveals the activity or stakeholder name and location details. The map provides a visual representation of geographic program reach.

### User Management (Admin Only)
Administrators can manage the user roster directly within the application:
- Add new users with a name, email, password, and role assignment
- Edit a user's name or role
- Activate or deactivate a user account (deactivated users cannot log in)
- All user changes are synchronized automatically with the authentication system (AWS Cognito)

### Reference Data Management
Admins and staff can manage the lookup tables that power activity dropdowns:
- **Activity Types** — categories of program activities
- **Partnership Types** — types of organizational partnerships
- **Funding Sources** — named funding sources with type and amount
- **Education Levels** — audience education level classifications
- **Cultural Wealth Tags** — community capital tags based on the Yosso framework
- **Locations** — city/county/state entries with coordinates for map display

### Excel Export
From the Activity List page, any logged-in user can export the current filtered view of activities to a downloadable Excel (.xlsx) file for offline reporting or sharing with funders.

---

## 4. How the Data is Organized

The diagram below shows how the main data entities relate to one another:

```
┌─────────────────────────────────────────────────────────────┐
│                        INITIATIVE                           │
│  (e.g., "Rural Health Workforce Development")               │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼                             ▼
 ┌─────────────────┐          ┌─────────────────────┐
 │ STRATEGIC GOAL  │          │      ACTIVITY        │
 │ (short or long  │◄─────────│  (the core record)   │
 │  term)          │          └──────────┬───────────┘
 └─────────────────┘                     │
                              ┌──────────┼──────────────┐
                              ▼          ▼              ▼
                    ┌──────────────┐ ┌──────────┐ ┌──────────────────┐
                    │  PROGRESS    │ │MILESTONE │ │   STAKEHOLDERS   │
                    │  UPDATES     │ │          │ │   (many-to-many) │
                    └──────────────┘ └──────────┘ └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           ┌──────────────┐   ┌───────────────────┐
           │    LEADS     │   │  CULTURAL WEALTH  │
           │ (staff users)│   │      TAGS         │
           └──────────────┘   └───────────────────┘
```

Each Activity also references several **lookup/reference records**:
- One Location (city, county, state)
- One Activity Type
- One Partnership Type
- One Funding Source
- One Education Level

---

## 5. The Dashboard & Analytics

The application has two analytics views accessible from the sidebar:

### Main Dashboard
Displays a real-time summary of program performance:

| Metric | Description |
|--------|-------------|
| Total Projects | Count of all non-deleted activities |
| Counties Served | Number of distinct Tennessee counties with at least one activity |
| Total Stakeholders | Total number of stakeholder records |
| Planned Projects | Activities with "Pending" status |
| Active Projects | Activities currently "In Progress" |
| Completed Projects | Activities marked as "Completed" |

Below the KPI cards:
- **Activities by Type** — horizontal bar chart showing which activity types are most common
- **Progress by Initiative** — table showing each initiative's planned / active / completed counts
- **Recent Activities** — scrollable table of the latest 5 activities with status and location
- **Service Areas Map** — interactive Leaflet map with toggleable activity / stakeholder pins

### Visualizations Page
A deeper analytics view with additional charts:
- **Status Distribution** — donut chart of the planned / active / completed breakdown
- **Monthly Activity Trend** — area chart of how many activities occurred each month over the last 24 months
- **Funding by Source** — bar chart of activity counts and amounts per funding source
- **Progress by Initiative** — initiative-level activity counts
- **Cultural Wealth Frequency** — how often each cultural capital is tagged across activities
- **Update Frequency** — how consistently staff are logging progress updates, by month
- **Service Area Map** — same interactive map as the main dashboard

---

## 6. Security & Access Control

### Authentication
All users must log in through **AWS Cognito** — Amazon's managed identity service. The application does not store passwords internally. Cognito handles password policies, multi-factor authentication options, and secure token issuance.

When a user logs in, Cognito issues a signed **JWT (JSON Web Token)** that the frontend sends with every API request. The backend verifies this token on every single request — no request can access any data without a valid, unexpired token.

### Role-Based Access Control (RBAC)
User roles (`admin`, `staff`, `read_only`) are stored in both the application database and in Cognito groups. The backend enforces these roles on every API endpoint:

- **Read-only users** receive a `403 Forbidden` error if they attempt any create, update, or delete operation — even if they try to call the API directly outside the application
- **Non-admin users** cannot access user management endpoints

### Additional Security Measures
- **Rate Limiting:** The API is limited to 200 requests per minute per IP address to prevent abuse
- **CORS Policy:** The API only accepts requests from the official application domain (`creadquillen.click`) and the local development server — requests from any other origin are blocked
- **Auto-logout:** Users are automatically logged out after 60 minutes of inactivity
- **API Docs Disabled:** The interactive API documentation (Swagger UI) is disabled in production to prevent unauthorized API exploration
- **SSL/TLS:** All database connections use SSL encryption in transit

---

## 7. Technical Architecture

### Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                            │
│                                                                   │
│    React 19 + Vite + TailwindCSS frontend                         │
│    (served by Nginx from /var/www/cread/)                         │
└───────────────────────────────┬───────────────────────────────────┘
                                │ HTTPS
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                        FastAPI BACKEND                            │
│                    (Python, Uvicorn server)                       │
│                                                                   │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐  │
│  │   API Routers   │    │   Auth Layer     │    │  SlowAPI    │  │
│  │ (14 endpoints   │    │ (JWT validation  │    │ Rate Limit  │  │
│  │  groups)        │    │  via python-jose)│    │ 200 req/min │  │
│  └────────┬────────┘    └──────────────────┘    └─────────────┘  │
│           │                                                       │
│  ┌────────▼────────┐                                              │
│  │   SQLAlchemy    │                                              │
│  │      ORM        │                                              │
│  └────────┬────────┘                                              │
└───────────┼───────────────────────────────────────────────────────┘
            │ SSL
            ▼
┌───────────────────────────────────────────────────────────────────┐
│               AWS RDS (MySQL database)                            │
└───────────────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────┐
│               AWS Cognito (User Authentication)                   │
│        (JWT signing, user pool, group management)                 │
└───────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | React | 19 | User interface |
| Build Tool | Vite | Latest | Fast frontend build and dev server |
| Styling | TailwindCSS | Latest | Utility-first CSS framework |
| Routing | React Router | v7 | Client-side navigation |
| Charts | Recharts | Latest | Dashboard charts and graphs |
| Maps | React-Leaflet / Leaflet | Latest | Interactive service area maps |
| Calendar | FullCalendar | Latest | Activity calendar view |
| Auth (Frontend) | AWS Amplify | Latest | Cognito integration, session management |
| Export | SheetJS (xlsx) | Latest | Excel file generation |
| Backend Framework | FastAPI | 0.125 | REST API |
| Language | Python | 3.x | Backend logic |
| ORM | SQLAlchemy | 2.0 | Database abstraction |
| Database Driver | PyMySQL | Latest | MySQL connector |
| Auth (Backend) | python-jose | Latest | JWT token validation |
| AWS SDK | boto3 | Latest | Cognito user management |
| Rate Limiting | SlowAPI | 0.1.9 | API request throttling |
| Web Server | Uvicorn | Latest | ASGI server for FastAPI |
| Reverse Proxy | Nginx | Latest | Static file serving and proxying |
| Database | MySQL (AWS RDS) | Latest | Relational data storage |
| Auth Service | AWS Cognito | — | User identity and authentication |

---

## 8. System Infrastructure

The application runs on **Amazon Web Services (AWS)**:

| Component | AWS Service |
|-----------|------------|
| Database | Amazon RDS (MySQL) |
| User Authentication | Amazon Cognito |
| Backend Server | EC2 instance (Uvicorn + Nginx) |
| Frontend | Nginx on the same EC2 instance |

### Environment Variables
The backend is configured via a `.env` file (never committed to source control) containing:
- `DATABASE_URL` — MySQL connection string
- `COGNITO_REGION` — AWS region (e.g., `us-east-1`)
- `COGNITO_USER_POOL_ID` — Cognito user pool identifier
- `COGNITO_APP_CLIENT_ID` — Cognito app client identifier

---

## 9. Developer Guide

This section is intended for developers who need to maintain, extend, or deploy the application.

### Repository Structure

```
CREAD_Quillen_Activity-Tracker/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app setup, middleware, CORS, router registration
│   │   ├── auth.py              # JWT verification, get_current_user, require_admin, require_writer
│   │   ├── database.py          # SQLAlchemy engine and session factory
│   │   ├── models/              # SQLAlchemy ORM models (one file per entity)
│   │   │   ├── activity.py
│   │   │   ├── user.py
│   │   │   ├── initiative.py
│   │   │   ├── strategic_goal.py
│   │   │   ├── miscellaneous.py  # All lookup tables
│   │   │   └── ...
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   │   ├── activity.py
│   │   │   ├── user.py
│   │   │   └── ...
│   │   └── routers/             # FastAPI route handlers (one file per feature area)
│   │       ├── activity.py
│   │       ├── dashboard.py
│   │       ├── user.py
│   │       ├── miscellaneous.py
│   │       └── ...
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables (NOT in git)
│
└── frontend/
    ├── src/
    │   ├── App.jsx               # Root component, routing, auth state
    │   ├── layouts/
    │   │   └── AuthenticatedLayout.jsx  # Sidebar, session loading, outlet context
    │   ├── pages/               # One file per page/feature
    │   │   ├── Dashboard.jsx
    │   │   ├── ActivityForm.jsx
    │   │   ├── ActivityList.jsx
    │   │   ├── ActivityDetails.jsx
    │   │   ├── ActivityCalendar.jsx
    │   │   ├── Visualizations.jsx
    │   │   ├── UserManagement.jsx
    │   │   └── ...
    │   ├── components/          # Reusable UI components (Sidebar, UserProfile)
    │   └── config.js            # API_BASE URL configuration
    ├── package.json
    └── index.html
```

### Running the Application Locally

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                    # Runs on http://localhost:5173
```

Ensure the `.env` file exists in `backend/` with valid AWS credentials before starting the backend.

### Authentication Flow

1. User visits the app and is shown the Cognito-hosted login form
2. On successful login, AWS Amplify stores the session (ID token, access token, refresh token) in the browser
3. `AuthenticatedLayout.jsx` calls `fetchAuthSession()` and stores the **ID token** in React state
4. The ID token is passed to all child pages via React Router's `useOutletContext()`
5. Every API call attaches it as `Authorization: Bearer <id_token>`
6. The backend's `auth.py` validates the token signature against Cognito's public JWKS keys, checks the audience (app client ID) and issuer, and extracts the user's groups (`cognito:groups` claim)
7. The `require_admin` or `require_writer` dependency enforces role restrictions per endpoint

> **Important:** The backend uses the **ID token**, not the access token. This is because the ID token carries the `aud` (audience) claim set to the App Client ID, which the backend uses for validation. The access token does not carry this claim in the same way.

### Adding a New Page

1. Create `frontend/src/pages/MyPage.jsx`
2. Use `useOutletContext()` at the top to get the token and user context:
   ```jsx
   import { useOutletContext } from "react-router-dom";
   const { accessToken, isAdmin, isReadOnly } = useOutletContext() ?? {};
   ```
3. Add `if (!accessToken) return` at the start of any `useEffect` that makes API calls
4. Register the route in `App.jsx` inside the `<AuthenticatedLayout>` route block:
   ```jsx
   <Route path="/my-page" element={<MyPage />} />
   ```
5. Add a sidebar link in `frontend/src/components/Sidebar.jsx`

### Adding a New Backend Endpoint

1. Create or open the appropriate router file in `backend/app/routers/`
2. Apply the correct auth dependency:
   - Read endpoint: `user: dict = Depends(get_current_user)`
   - Write endpoint (admin + staff): `user: dict = Depends(require_writer)`
   - Admin-only endpoint: `user: dict = Depends(require_admin)`
3. Register the router in `backend/app/main.py`:
   ```python
   from app.routers import my_router
   app.include_router(my_router.router)
   ```

### Role Enforcement Reference

| Dependency | Who Can Access |
|-----------|----------------|
| `get_current_user` | Any logged-in user (admin, staff, read_only) |
| `require_writer` | Admin and staff only (read_only gets 403) |
| `require_admin` | Admin only (staff and read_only get 403) |

### Database Schema Notes

- All major tables use **soft deletion** via a `deleted_at` timestamp column. Records are never physically deleted — queries filter with `.filter(Model.deleted_at.is_(None))` to exclude deleted rows.
- The `users` table mirrors Cognito users. Each user has a `cognito_sub` field linking them to their Cognito identity.
- Location coordinates (`latitude`, `longitude`) on the `locations` table power the map pins on the dashboard.
- Cultural wealth tags follow **Tara Yosso's Community Cultural Wealth framework** — the six capitals (Aspirational, Linguistic, Familial, Social, Navigational, Resistant) are common values.

### JWKS Key Rotation Handling

Cognito periodically rotates its JWT signing keys. The backend caches the JWKS (public keys) in memory and automatically refreshes the cache if a token's `kid` (key ID) is not found in the cached set. This prevents authentication failures during key rotation without requiring a server restart.

### Common Pitfalls for New Developers

| Pitfall | Correct Approach |
|---------|-----------------|
| Using `Model.field == None` in SQLAlchemy queries | Use `Model.field.is_(None)` |
| Using `str(enum_value)` to get the role string (gives `"UserRole.admin"`) | Use `enum_value.value` (gives `"admin"`) |
| Forgetting `if (!accessToken) return` in frontend `useEffect` | Always guard API calls — the token loads asynchronously after mount |
| Getting token from Amplify using `accessToken` for backend calls | Use `idToken` — the backend validates the `aud` claim which only the ID token carries |
| Two Python functions with the same name in one router file | Python silently overwrites the first; the route becomes unreachable |

---

## 10. Glossary

**Activity** — The core unit of tracking. Represents a single program event, training, service delivery, outreach effort, or intervention logged by staff.

**AWS Cognito** — Amazon's cloud-based user authentication service. Handles login, password management, and issues the tokens that prove a user is authenticated.

**Cultural Wealth Tags** — Labels based on Dr. Tara Yosso's Community Cultural Wealth framework, which identifies six forms of capital present in communities of color: Aspirational, Linguistic, Familial, Social, Navigational, and Resistant. Activities can be tagged with whichever capitals they engage.

**Dashboard** — The landing page of the application after login, showing summary statistics, charts, and the interactive map.

**FastAPI** — The Python web framework used to build the backend API. It receives requests from the frontend, validates permissions, queries the database, and returns data as JSON.

**Initiative** — A high-level program area (e.g., a grant-funded project or a strategic pillar). Activities and Strategic Goals are organized under Initiatives.

**JWT (JSON Web Token)** — A digitally signed token issued by Cognito after login. The frontend attaches this token to every API request so the backend can verify the user's identity and role without a separate database lookup.

**Milestone** — A discrete deliverable checkpoint within an activity. Milestones appear on the Activity Calendar.

**MySQL / RDS** — The relational database storing all application data. Hosted on Amazon RDS (Relational Database Service) for managed backups, scaling, and reliability.

**Nginx** — The web server that delivers the frontend application to users' browsers and can also proxy requests to the backend.

**Progress Update** — A narrative log entry on an activity recording what occurred at a specific point in time, including quantitative and qualitative outcomes.

**RBAC (Role-Based Access Control)** — The security model where a user's permissions are determined by their assigned role (`admin`, `staff`, or `read_only`) rather than individual permission grants.

**React** — The JavaScript library used to build the user interface. The frontend is a single-page application (SPA) — the browser loads once and React handles all navigation.

**Soft Delete** — A deletion strategy where records are not permanently removed from the database. Instead, a `deleted_at` timestamp is set, and queries exclude these records. This preserves historical data and audit trails.

**SQLAlchemy** — The Python library that maps Python objects (models) to database tables and generates SQL queries. It abstracts away raw SQL for most operations.

**Stakeholder** — An organization, community partner, or individual engaged through program activities. Stakeholders have their own records with location data and can be associated with multiple activities.

**Strategic Goal** — A specific, measurable objective under an Initiative, classified as short-term or long-term. Activities are linked to strategic goals to demonstrate alignment.

**TailwindCSS** — The CSS framework used to style the frontend. All visual design is applied via utility class names in the component code.

**Uvicorn** — The ASGI web server that runs the FastAPI backend application.

**Vite** — The build tool used to compile and bundle the React frontend for production deployment.

---

*This document covers the application as of May 2026. For questions about the system, contact the project administrator or refer to the repository's source code.*
