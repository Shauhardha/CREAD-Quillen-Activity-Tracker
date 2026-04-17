CREAD–Quillen Activity Tracker

A full-stack web app for tracking and visualizing community engagement activities for the Center for Rural Education and Development and the Quillen Chair of Excellence in Teaching and Learning at ETSU.

Overview

This platform helps teams manage activities, track progress, and understand impact across initiatives through dashboards, maps, and reports.

Key Features
Dashboard
High-level metrics for activities, stakeholders, and counties served
Interactive map of activity and stakeholder locations
Quick access to recent activity details
Activity Management
Create and manage activities with detailed metadata
Track milestones and progress updates
Export activity data to Excel
Print-friendly reports
Visualizations
Charts for activity status, trends, funding, and initiative progress
Geographic and data-driven insights
Calendar
Month and list views of activities
Milestones and filters by status or initiative
Alerts for overdue or inactive work
Associations
Link activities to stakeholders, goals, and tags
Assign roles such as lead or partner
Admin & Security
Role-based access: Admin, Staff, Read Only
AWS Cognito authentication
Auto logout after inactivity
Mobile responsive UI
Tech Stack

Frontend

React, Vite, Tailwind
Recharts, FullCalendar, Leaflet

Backend

FastAPI, SQLAlchemy
MySQL

Infrastructure

AWS EC2
Nginx reverse proxy
GitHub Actions for deployment
Project Structure
frontend/
  src/
    components/
    layouts/
    pages/
backend/
  app/
    models/
    routers/
    schemas/
.github/workflows/
Local Development
Prerequisites
Node.js 20+
Python 3.11+
MySQL
Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev

Create .env:

VITE_API_BASE=http://localhost:8001/api
Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

Create .env:

DATABASE_URL=your_database_url
COGNITO_REGION=your_region
COGNITO_USER_POOL_ID=your_pool_id
COGNITO_APP_CLIENT_ID=your_client_id
Deployment

Deployment is handled through GitHub Actions.

What happens
Frontend builds on GitHub
Built files are sent to EC2
Backend is updated and restarted on the server
Required secrets
EC2 host, user, and SSH key
API base URL
Cognito config
Server setup
Nginx serves frontend and proxies API
FastAPI runs on port 8001
User Roles
Role	Access
Admin	Full control and settings
Staff	Manage activities
Read Only	View data only
Notes
Environment files are not committed
Cognito configuration should be provided locally or via secrets
Designed for internal use at ETSU
License

Developed for East Tennessee State University. All rights reserved.
