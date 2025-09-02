📑 Task Management Architecture (Intention & Guide)
🎯 Intention

We want our GitHub repository to manage its own task assignments via a web interface hosted on GitHub Pages.

The main branch remains clean: all project code, the website code, and a tasks.json snapshot for persistence.

A dedicated taskAssignment branch acts as a “live cache” of task assignments.

The GitHub Pages website will always read and write to the taskAssignment branch’s tasks.json.

Once a week, we will sync the taskAssignment branch back into main to update the persistent tasks.json without cluttering the commit history.

This keeps development history clean while allowing interactive task tracking inside the repo itself.

🏗️ Structure

main branch

Project source code

Website code (served via GitHub Pages)

Snapshot of tasks.json (updated weekly)

taskAssignment branch

Only difference: tasks.json is the live, always-current version

Website reads/writes directly to this branch

🌐 Website (GitHub Pages)

Hosted from main branch (e.g., /docs folder or /gh-pages setting).

Provides an interactive task board UI.

Reads tasks.json from the taskAssignment branch (via GitHub API).

Writes updates to taskAssignment branch’s tasks.json when users claim or complete tasks.

🔄 Sync Strategy

Website updates: go only to taskAssignment branch.

Weekly persistence:

Manual or automated sync (via GitHub Action or script).

Merge/copy latest tasks.json from taskAssignment → main.

Commit message convention:
```
chore(tasks): weekly sync from taskAssignment
```

## 📋 Enhanced Data Structure

### tasks.json - Master Task Registry
```json
[
  {
    "id": 1,
    "title": "Clean water access dataset",
    "description": "Remove duplicates, handle missing values, and standardize province names in the water access dataset",
    "category": "Data Preparation",
    "complexity": "medium",
    "estimatedHours": 4,
    "prerequisites": [],
    "deliverables": ["cleaned_water.csv", "cleaning_report.md"],
    "skills": ["R", "Data Cleaning"],
    "createdDate": "2025-01-15T10:00:00Z",
    "dueDate": "2025-01-22T17:00:00Z",
    "status": "available"
  },
  {
    "id": 2,
    "title": "Build mortality prediction model",
    "description": "Develop machine learning models to predict child mortality using socioeconomic factors",
    "category": "Modeling",
    "complexity": "high",
    "estimatedHours": 12,
    "prerequisites": [1, 3],
    "deliverables": ["model.R", "performance_report.md", "predictions.csv"],
    "skills": ["R", "Machine Learning", "Statistics"],
    "createdDate": "2025-01-15T10:00:00Z",
    "dueDate": "2025-02-05T17:00:00Z",
    "status": "blocked"
  },
  {
    "id": 3,
    "title": "Create EDA visualizations",
    "description": "Generate exploratory data analysis plots for all 12 health datasets",
    "category": "Analysis",
    "complexity": "low",
    "estimatedHours": 6,
    "prerequisites": [],
    "deliverables": ["eda_plots/", "eda_summary.html"],
    "skills": ["R", "ggplot2", "Data Visualization"],
    "createdDate": "2025-01-15T10:00:00Z",
    "dueDate": "2025-01-25T17:00:00Z",
    "status": "available"
  }
]
```

### task_assignments.json - Transaction Log
```json
[
  {
    "assignmentId": "a001",
    "taskId": 1,
    "assigneeUsername": "alice_dev",
    "assigneeDisplayName": "Alice Johnson",
    "assignedDate": "2025-01-16T09:30:00Z",
    "startedDate": "2025-01-16T14:20:00Z",
    "completedDate": null,
    "status": "in-progress",
    "progress": 60,
    "timeSpent": 2.5,
    "notes": "Working on province name standardization",
    "blockers": [],
    "reviewRequested": false,
    "reviewerUsername": null,
    "reassignmentHistory": []
  },
  {
    "assignmentId": "a002",
    "taskId": 3,
    "assigneeUsername": "bob_analyst",
    "assigneeDisplayName": "Bob Smith",
    "assignedDate": "2025-01-15T11:00:00Z",
    "startedDate": "2025-01-15T11:00:00Z",
    "completedDate": "2025-01-17T16:45:00Z",
    "status": "completed",
    "progress": 100,
    "timeSpent": 5.75,
    "notes": "All EDA plots generated successfully",
    "blockers": [],
    "reviewRequested": true,
    "reviewerUsername": "carol_lead",
    "reassignmentHistory": []
  },
  {
    "assignmentId": "a003",
    "taskId": 2,
    "assigneeUsername": "charlie_ml",
    "assigneeDisplayName": "Charlie Brown",
    "assignedDate": "2025-01-14T08:00:00Z",
    "startedDate": null,
    "completedDate": null,
    "status": "reassigned",
    "progress": 0,
    "timeSpent": 0,
    "notes": "Reassigned due to workload",
    "blockers": ["waiting for prerequisite tasks"],
    "reviewRequested": false,
    "reviewerUsername": null,
    "reassignmentHistory": [
      {
        "fromUser": "charlie_ml",
        "toUser": "diana_expert",
        "reassignedDate": "2025-01-18T10:30:00Z",
        "reason": "Workload balancing"
      }
    ]
  }
]
```

## 🎨 Web Interface Features

### Kanban Board Columns
- **Backlog**: Available tasks
- **In Progress**: Assigned and active tasks  
- **Review**: Completed tasks awaiting review
- **Done**: Fully completed tasks

### User Dashboard Features
- **Task Filtering**: By complexity, category, skills, assignee
- **Progress Tracking**: Visual progress bars, time tracking
- **Skill Matching**: Suggest tasks based on user's skills
- **Workload Balancing**: Prevent overallocation
- **Team Analytics**: Completion rates, time estimates accuracy

### GitHub OAuth Integration
- **Authentication**: Login with GitHub account
- **Permission Checking**: Verify repository access
- **User Profile**: Sync GitHub username and display name
- **Branch Access**: Automatic permission management
