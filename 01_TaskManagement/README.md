# 🎯 HDPSA Task Management System

A dark-themed, GitHub-integrated task management system for the Health and Demographic Patterns in South Africa (HDPSA) project.

## 🚀 Features

- **🌙 Dark Theme**: Professional dark interface optimized for extended use
- **🔐 GitHub OAuth**: Secure authentication with GitHub accounts
- **📋 Kanban Board**: Visual task management with drag-and-drop (Backlog → In Progress → Review → Done)
- **🔄 Live Sync**: Real-time updates via GitHub API integration
- **📊 Progress Tracking**: Time tracking, progress indicators, and completion analytics
- **🎯 Smart Filtering**: Filter by complexity, category, skills, and assignee
- **📱 Responsive**: Works seamlessly on desktop, tablet, and mobile
- **⚡ Auto-Sync**: Weekly automated sync between live data and main branch

## 🏗️ Architecture

```
main branch (clean history)
├── Project source code
├── Website code (GitHub Pages)
└── tasks.json snapshot (weekly updates)

taskAssignment branch (live data)
└── Live task files (real-time updates)
```

## ⚙️ Setup Instructions

### 1. GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Configure:
   - **Application name**: `HDPSA Task Management`
   - **Homepage URL**: `https://YOUR_USERNAME.github.io/data-analysis-dashboard/`
   - **Authorization callback URL**: `https://YOUR_USERNAME.github.io/data-analysis-dashboard/01_TaskManagement/public/`
4. Copy the **Client ID**

### 2. Configuration

Update `01_TaskManagement/static/js/config.js`:

```javascript
const CONFIG = {
    GITHUB_CLIENT_ID: 'YOUR_GITHUB_CLIENT_ID', // Replace with your Client ID
    GITHUB_OWNER: 'YOUR_USERNAME',              // Replace with your GitHub username
    GITHUB_REPO: 'data-analysis-dashboard',      // Your repo name
    // ... rest of config
};
```

### 3. GitHub Pages Setup

1. Go to your repository **Settings** → **Pages**
2. Set **Source** to "Deploy from a branch"
3. Select **Branch**: `main`
4. Set **Folder**: `/01_TaskManagement/public/`
5. Save and wait for deployment

### 4. Build CSS (Optional)

If you modify styles:

```bash
cd 01_TaskManagement
npm install
npm run build  # Build production CSS
npm run watch  # Watch for changes (development)
```

## 🎮 Usage

### For Team Members

1. **Login**: Click "Login with GitHub" 
2. **Browse Tasks**: View available tasks in the Backlog column
3. **Self-Assign**: Click "Assign to Me" on available tasks
4. **Work on Tasks**: Update progress, add notes, track time
5. **Request Review**: Mark tasks complete when done

### For Project Managers

1. **Add Tasks**: Click "Add Task" to create new tasks
2. **Monitor Progress**: Use filters and analytics to track team progress
3. **Reassign Tasks**: Move tasks between team members if needed
4. **Review Completed Work**: Check tasks in the Review column

## 📋 Task Structure

Each task includes:

- **Basic Info**: Title, description, category, complexity
- **Planning**: Estimated hours, prerequisites, deliverables
- **Skills**: Required technical skills
- **Tracking**: Creation date, due date, current status
- **Assignment**: Assignee, progress, time spent, notes

## 🔄 Data Flow

1. **Real-time Updates**: All changes go to `taskAssignment` branch
2. **Weekly Sync**: GitHub Action syncs to `main` branch every Sunday
3. **Clean History**: Main branch stays clean for development work
4. **Backup**: Task data preserved in both branches

## 🛠️ Development

### File Structure

```
01_TaskManagement/
├── public/
│   └── index.html          # Main application
├── static/
│   ├── css/
│   │   ├── input.css       # Tailwind source + custom styles
│   │   └── output.css      # Built CSS (generated)
│   └── js/
│       ├── config.js       # Configuration
│       ├── auth.js         # GitHub authentication
│       ├── api.js          # GitHub API integration
│       └── main.js         # Main application logic
├── data/
│   ├── tasks.json          # Task definitions
│   └── task_assignments.json # Assignment tracking
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

### Key Components

- **TaskManager**: Main application class handling UI and data
- **GitHubAuth**: OAuth authentication and user management
- **GitHubAPI**: Repository integration and file operations
- **CONFIG**: Centralized configuration management

## 🎨 Customization

### Adding New Task Categories

Update `config.js`:

```javascript
CATEGORIES: [
    'Data Preparation',
    'Analysis', 
    'Modeling',
    'Visualization',
    'Your Custom Category'  // Add here
]
```

### Adding New Skills

Update `config.js`:

```javascript
SKILLS: [
    'R', 'Python', 'Power BI',
    'Your Custom Skill'  // Add here
]
```

### Modifying Colors/Theme

Edit `static/css/input.css` and rebuild:

```css
:root {
  --bg-primary: #1a1a1a;      /* Main background */
  --bg-secondary: #2d2d2d;    /* Card backgrounds */
  --accent-blue: #3b82f6;     /* Primary accent */
  /* Modify as needed */
}
```

## 🔧 Troubleshooting

### Authentication Issues
- Verify GitHub OAuth app callback URL matches your GitHub Pages URL
- Check that `config.js` has correct Client ID and repository details
- Ensure repository is public or OAuth app has appropriate permissions

### Data Not Loading
- Check browser developer tools for API errors
- Verify GitHub token has repository access
- Ensure `taskAssignment` branch exists and has JSON files

### Build Issues
- Run `npm install` to install Tailwind dependencies
- Use `npm run build` to regenerate CSS after style changes
- Check that Tailwind CLI is properly installed

## 📈 Analytics

The system automatically tracks:
- Task completion rates by team member
- Time estimation accuracy
- Bottlenecks and blocked tasks
- Category and complexity distribution
- Weekly progress reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the HDPSA academic project and follows university guidelines.

---

**Built with ❤️ for the HDPSA Team**  
*Powered by GitHub Pages, Tailwind CSS, and GitHub API*