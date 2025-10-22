# Milestone 5 — Deployment Planning

[GitHub Repository](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Milestone_5)

Scope: Plan model deployment, monitoring, and maintenance per CRISP-DM Phase 6 (planning aspects) and provide a minimal user-facing demo.

## Tasks & Artifacts

- Milestone brief: `02_Project/Milestone_5/Milestone_5.md`
- Reports:
  - Deployment Strategy: `02_Project/Milestone_5/Task_1_Deployment_Strategy.md`
  - Maintenance Plan: `02_Project/Milestone_5/Task_3_Maintenance_Plan.md`
  - Monitoring Plan: `02_Project/Milestone_5/Task_4_Monitoring_Plan.md`
  - Milestone Report (Rmd/PDF/DOCX): `02_Project/Milestone_5/Milestone_5_Report.Rmd`, `.pdf`, `.docx`
- References: `02_Project/Milestone_5/Milestone_5_Task_Guide.md`, `02_Project/Milestone_5/reference_template.docx`
- Visuals: `02_Project/Milestone_5/n8n.png`, `02_Project/Milestone_5/screenshots/`

## Final Report

[**Milestone 5 Report (PDF)**](https://github.com/BeardedSeal77/data-analysis-dashboard/blob/main/02_Project/Milestone_5/Milestone_5_Report.pdf)

## Minimal Demo

- Reporting UI: `app/project/reporting/page.tsx` (embeds Power BI and explains data sources)
- Prediction UI: `app/project/predict/page.tsx`
- ML API: `02_Project/api/` for training/evaluation/prediction endpoints (see `02_Project/api/API_Documentation.md`)

Run locally:
1) Ensure both Flask APIs are running (see root `README.md` Getting Started)
2) Start Next.js with `npm run next-dev`
3) Visit `http://localhost:3000/project/reporting` and `http://localhost:3000/project/predict`

## Upstream Dependencies

- Evaluation outcomes: `02_Project/Milestone_4/Task_1.md`, `Task_2.md`, `Task_3.md`
- Model artifacts: `02_Project/Milestone_3/Task_03/outputs/`
