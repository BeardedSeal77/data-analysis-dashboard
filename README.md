# BIN381 Data Analysis Dashboard (HDPSA)

Comprehensive project workspace for the Health and Demographic Profile of South Africa (HDPSA): a Next.js dashboard, two Flask APIs (ML + Task Management), R/Power BI deliverables, and a CRISP-DM milestone track.

## Quick Navigation

-**Project Milestones Index:**  
  [`02_Project/README.md`](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project)

- **Milestone READMEs:**
  - [Milestone 1 – Business & Data Understanding](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Milestone_1)
  - [Milestone 2 – Data Preparation](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Milestone_2)
  - [Milestone 3 – Modeling](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Milestone_3)
  - [Milestone 4 – Evaluation](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Milestone_4)
  - [Milestone 5 – Deployment Planning](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Milestone_5)
  - [Milestone 6 – Final Report](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Milestone_6)

- **Applications:**
  - Next.js UI: `app/`
  - ML API (Flask): `02_Project/api/` (docs: `02_Project/api/API_Documentation.md`)
  - Task Management API (Flask): `01_TaskManagement/api/`

- **Data Lake (CSV):**
  - [Raw](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/01_Raw)
  - [Cleaned](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/02_Cleaned)
  - [Scaled/Features](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/03_Scaled)
  - [Train/Val/Test](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/04_Split)
  - [Flat Data](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/Flat%20Data)

## Architecture Overview 

- Next.js 15 App Router UI (`app/`) with Tailwind CSS.
- Flask ML API (`02_Project/api/`) serving health-survey modeling endpoints; persists model artifacts to `02_Project/api/ml/outputs` and consumes CSV data under `02_Project/Data`.
- Flask Task Management API (`01_TaskManagement/api/`) backed by MongoDB; powers the dashboard at `app/task-management`.
- R Markdown analyses across milestones and Power BI reports embedded in the Reporting UI.

## Getting Started

Prerequisites: Node.js 18+, Python 3.10+, R 4.x. Optional: MongoDB URI for task API. 

1) Install Node dependencies (root):
```bash
npm install
```

2) Create Python virtual envs and install requirements:
- Task Management API
  - Windows: `python -m venv 01_TaskManagement/api/venv && 01_TaskManagement\api\venv\Scripts\pip install -r 01_TaskManagement\api\requirements.txt`
  - macOS/Linux: `python -m venv 01_TaskManagement/api/venv && source 01_TaskManagement/api/venv/bin/activate && pip install -r 01_TaskManagement/api/requirements.txt`
- ML API
  - Windows: `python -m venv 02_Project/api/venv && 02_Project\api\venv\Scripts\pip install -r 02_Project\api\requirements.txt`
  - macOS/Linux: `python -m venv 02_Project/api/venv && source 02_Project/api/venv/bin/activate && pip install -r 02_Project/api/requirements.txt`

3) (Optional) Install R packages used by Rmd notebooks:
```bash
Rscript install_packages.R
```

4) Development run (Next.js + both APIs):
```bash
npm run dev
```
Notes:
- The `dev` script expects Windows-style venv paths. On macOS/Linux, run each service individually (below) or adjust the script.

### Run services individually

- Next.js UI: `npm run next-dev` (serves `http://localhost:3000`)
- Task Management API: `cd 01_TaskManagement/api && venv/Scripts/python.exe app.py` (Windows) or `source venv/bin/activate && python app.py` (macOS/Linux)
- ML API: `cd 02_Project/api && venv/Scripts/python.exe app.py` (Windows) or `source venv/bin/activate && python app.py` (macOS/Linux)

## UI Routes

- Task Management: `http://localhost:3000/task-management`
- Project Reporting: `http://localhost:3000/project/reporting` (Power BI embed)
- Project Predict: `http://localhost:3000/project/predict`

## APIs Summary

- Task Management API (default `http://localhost:5000`) — configure via `secrets.txt`
  - Health: `GET /api/health`
  - Tasks: `GET /api/tasks`, `GET /api/tasks/milestone/{id}`, `POST /api/tasks`, `PUT /api/tasks/{id}`
  - Assignment: `POST /api/tasks/{id}/assign`, `POST /api/tasks/assignments/{assignmentId}/complete`
  - Members: `GET /api/members`, `GET /api/members/{id}`
  - Milestones: `GET /api/milestones`, `GET /api/milestones/{id}/progress`

- ML API (default `http://localhost:5001`) — docs in `02_Project/api/API_Documentation.md`
  - Health: `GET /api/health`
  - Model: `GET /api/ml/model-info`, `GET /api/ml/feature-importance`, `POST /api/ml/reload`
  - Train: `POST /api/ml/train`
  - Evaluate: `POST /api/ml/evaluate`
  - Predict: `POST /api/ml/predict-csv`

## Task Management

- Backend: `01_TaskManagement/api` (Flask). Configure `secrets.txt` at repo root with at least:
  - `MONGODB_URI=mongodb+srv://...`
  - `TASK_MANAGEMENT_PORT=5000`
- Data seeds and JSON snapshots: `01_TaskManagement/data/`
- Frontend integration: `app/task-management` uses the API at `http://localhost:5000/api`.
- Concept and GitHub Pages approach: `01_TaskManagement/public/setup.md`.

## Project Milestones (CRISP-DM)

All milestone overviews, tasks, and deliverables are cataloged in `02_Project/README.md` with links to each milestone’s README and artifacts.

## Final Reports

- [Milestone 1 Report (PDF)](https://github.com/BeardedSeal77/data-analysis-dashboard/blob/main/02_Project/Milestone_1/Report/BIN381_Milestone_1_Group_A.pdf)
- [Milestone 2 Report (PDF)](https://github.com/BeardedSeal77/data-analysis-dashboard/blob/main/02_Project/Milestone_2/BIN381_Group_A_Milestone_2.pdf)
- [Milestone 3 Report (PDF)](https://github.com/BeardedSeal77/data-analysis-dashboard/blob/main/02_Project/Milestone_3/BIN381_Group_A_Milestone_3.pdf)
- [Milestone 4 Report (PDF)](https://github.com/BeardedSeal77/data-analysis-dashboard/blob/main/02_Project/Milestone_4/GroupA_Milestone_04.pdf)
- [Milestone 5 Report (PDF)](https://github.com/BeardedSeal77/data-analysis-dashboard/blob/main/02_Project/Milestone_5/Milestone_5_Report.pdf)
- [Milestone 6 Report (PDF)](https://github.com/BeardedSeal77/data-analysis-dashboard/blob/main/02_Project/Milestone_6/BIN381%20Group%20A%20Milestone%206.pdf)

## Power BI Dashboard

- [Power BI Report File (.pbix)](https://github.com/BeardedSeal77/data-analysis-dashboard/blob/main/02_Project/Milestone_6/Bin381%20Project.pbix)
- [Published Power BI Dashboard](https://app.powerbi.com/view?r=eyJrIjoiMWMxNDk0YjAtYjUwNy00OTk4LWJmM2ItOTY1YzM4MmMxYmQ2IiwidCI6ImVhMWE5MDliLTY2MDAtNGEyNS04MmE1LTBjNmVkN2QwNTEzYiIsImMiOjl9)

## License and Acknowledgements

- License: `LICENSE`
- Project Outline: `public/Project_Outline.md`
- [Complete Project Repository](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project)

