# BIN381 Data Analysis Dashboard

A comprehensive data analysis and project management platform built with Next.js and Flask.

## Team Members

| Name | Role |
|------|------|
| [Add Name] | [Add Role] |
| [Add Name] | [Add Role] |
| [Add Name] | [Add Role] |
| [Add Name] | [Add Role] |

## Project Structure

```
├── app/                          # Next.js frontend (App Router)
│   ├── layout.tsx               # Root layout with navigation
│   ├── page.tsx                 # Homepage with project navigation
│   ├── task-management/         # Task management pages
│   └── project/                 # Data analysis pages
├── packages/                    # Package management
│   ├── package.json            # Next.js dependencies & scripts
│   ├── requirements-task.txt   # Task management API deps
│   └── requirements-project.txt # Project API deps
├── 01_TaskManagement/
│   └── api/
│       └── app.py              # Flask server (port 5000, MongoDB)
├── 02_Project/
│   └── api/
│       └── app.py              # Flask server (port 5001, PostgreSQL)
└── docker-compose.yml          # PostgreSQL database
```

## Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
cd packages
npm install

# Install Python dependencies for task management
pip install -r requirements-task.txt

# Install Python dependencies for project analysis
pip install -r requirements-project.txt
```

### 2. Start Database Services

```bash
# Start PostgreSQL (for data analysis)
docker-compose up -d
```

### 3. Start All Services

```bash
# From packages/ directory - starts all 3 servers concurrently
cd packages
npm run dev
```

This single command starts:
- **Next.js frontend** (http://localhost:3000)
- **Task Management API** (http://localhost:5000) - MongoDB Atlas
- **Data Analysis API** (http://localhost:5001) - PostgreSQL

## API Endpoints

### Task Management API (Port 5000)
- `GET /api/health` - Health check
- `GET /api/tasks` - Get all tasks
- `GET /api/members` - Get all team members
- `GET /api/assignments` - Get task assignments
- `GET /api/analytics/task-distribution` - Task distribution analytics

### Data Analysis API (Port 5001)
- `GET /api/health` - Health check
- `GET /api/datasets` - List all datasets
- `GET /api/datasets/{name}/data` - Get dataset data
- `GET /api/datasets/{name}/stats` - Get dataset statistics
- `POST /api/datasets/upload` - Upload CSV dataset
- `POST /api/query` - Execute SQL query

## Features

### Task Management System
- Real-time task tracking with MongoDB Atlas
- Team member management
- Progress analytics and reporting
- Milestone tracking

### Data Analysis Project
- CSV dataset upload and management
- Statistical analysis and data exploration
- SQL query execution
- PostgreSQL integration
- Data visualization tools

## What This Project Does

This data analysis dashboard explores health and demographic patterns across South Africa by:

🔍 **Analyzing** 12+ health datasets covering water access, sanitation, child mortality, HIV behavior, immunization rates, and more

📊 **Visualizing** complex health patterns through interactive Power BI dashboards and R-generated plots

🤖 **Mining** data using machine learning techniques (clustering, classification, association rules) to uncover hidden relationships

🗺️ **Mapping** health risk zones and regional disparities across South African provinces

📈 **Predicting** health outcomes based on socioeconomic factors like literacy, water access, and living conditions

## Technology Stack

- **Next.js 15** - Modern React framework with App Router
- **Flask 3.0** - Python web framework for APIs
- **MongoDB Atlas** - Cloud database for task management
- **PostgreSQL** - Relational database for data analysis
- **R** - Statistical analysis and machine learning
- **Power BI** - Interactive dashboards and visualizations  
- **CRISP-DM** - Industry-standard data mining methodology

## Development

### Individual Services

```bash
# Run Next.js only
cd packages && npm run next-dev

# Run Task Management API only
cd packages && npm run flask-task

# Run Data Analysis API only
cd packages && npm run flask-project
```

### Build for Production

```bash
cd packages
npm run build
```

## Database Setup

### MongoDB Atlas (Task Management)
Already configured in `01_TaskManagement/api/app.py`. No additional setup required.

### PostgreSQL (Data Analysis)
Started via Docker Compose:
```bash
docker-compose up -d
```

Database details:
- Host: localhost:5432
- Database: bin_project
- User: postgres
- Password: postgres

## Next Steps

1. ✅ Basic architecture setup complete
2. 🚧 Task management UI conversion in progress
3. 📋 Data analysis frontend components
4. 🎨 Enhanced styling and user experience
5. 📊 Advanced analytics and visualization features

Built with Next.js 15, Flask 3.0, MongoDB Atlas, and PostgreSQL.