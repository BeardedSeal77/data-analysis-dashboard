# How to Run the Task Management System

## ⚠️ Important: Don't Open Files Directly!

**DON'T:** Double-click `index.html` or open files directly in browser
**DO:** Run a local web server

## 🚀 Quick Start

### Option 1: Python (Recommended)
```bash
# Navigate to the project folder
cd 01_TaskManagement

# Start server
python -m http.server 8000

# Open in browser
# Go to: http://localhost:8000
```

### Option 2: Node.js
```bash
# Navigate to the project folder  
cd 01_TaskManagement

# Install http-server globally
npm install -g http-server

# Start server
http-server -p 8000

# Open in browser
# Go to: http://localhost:8000
```

### Option 3: Live Server (VS Code Extension)
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

## 🎯 Why Local Server?

- **CORS Policy**: Browsers block file:// requests to JSON files
- **Data Loading**: System needs to fetch from `/data/` folder
- **Team Collaboration**: Consistent environment for everyone

## 📝 Team Workflow

1. **Pull latest changes** from git
2. **Run local server** (python -m http.server 8000)
3. **Open browser** (http://localhost:8000) 
4. **Select your profile** from dropdown
5. **Work on tasks** - changes save to localStorage
6. **Commit your work** when done

## 🔄 MongoDB Integration

- Currently uses **localStorage** with your JSON data
- **MongoDB Atlas** ready for real-time sync
- All task assignments persist locally for now

## ❓ Having Issues?

- Make sure you're using **http://localhost:8000** (not file://)
- Check browser console for error messages
- Verify you're in the right folder (`01_TaskManagement`)