# Claude Code Clean Installation Guide

## 🚀 Complete Installation Process

### Step 1: Uninstall Current Claude Code
```bash
# Run as Administrator
claude_uninstall.bat
```
**Restart your computer after uninstall**

### Step 2: Clean Reinstall
```bash
# Run as Administrator  
claude_install.bat
```

### Step 3: Configure Global Settings
```bash
# Run as Administrator
claude_configure.bat
```

### Step 4: Verify Installation
```bash
claude-code --version
claude-code --help
```

## ⚙️ Global Configuration Features

### 🔒 Global Rules (No Hardcoding)
- Never hardcode values
- Always use config files/environment variables
- Prefer editing existing files over creating new ones
- Minimize token usage while maintaining quality

### 🔧 MCP Servers Included
- **filesystem** - File operations
- **git** - Version control
- **python-tools** - Python execution  
- **brave-search** - Web search
- **database** - Database operations
- **slack** - Team communication (optional)

### 📁 Configuration Location
```
%APPDATA%\Claude\claude-code\
├── global-defaults.json     # Behavior rules
├── mcp-servers.json         # MCP server configs
├── .env.template           # Environment template
└── project-template.json   # Project settings
```

## 🛠️ Post-Installation Setup

### 1. Configure API Keys
Copy `.env.template` to your project as `.env`:
```bash
cp %APPDATA%\Claude\claude-code\.env.template .env
```

Edit `.env` with your actual API keys:
```env
BRAVE_API_KEY=your_actual_brave_key
MONGODB_URI=mongodb+srv://your-connection-string
```

### 2. Project-Specific Settings
Claude Code will automatically apply:
- Python: Black formatting, Flake8 linting, PEP8 style
- JavaScript: Prettier formatting, ESLint, Airbnb style
- Naming: snake_case files/functions, PascalCase classes

### 3. Available Commands
```bash
# Backend
python app.py

# Frontend  
npm run dev

# Testing
pytest

# Code Quality
flake8 . && black .
```

## 🔍 Verification Checklist

✅ Claude Code responds to `claude-code --version`
✅ Global defaults prevent hardcoding
✅ MCP servers are configured
✅ Environment template exists
✅ Project conventions are set

## 🚨 Troubleshooting

**Claude Code not found:**
- Restart terminal/command prompt
- Check PATH environment variable
- Reinstall as Administrator

**MCP servers not working:**
- Ensure Node.js is installed
- Run: `npm install -g @modelcontextprotocol/server-filesystem`
- Check MCP server logs

**Global config not loading:**
- Verify files exist in: `%APPDATA%\Claude\claude-code\`
- Restart Claude Code
- Check file permissions

## 📋 Quick Reference

| Action | Command |
|--------|---------|
| Check version | `claude-code --version` |
| View help | `claude-code --help` |
| Start project | `claude-code .` |
| Global config | `%APPDATA%\Claude\claude-code\` |
| Project env | `.env` in project root |

## 🎯 Expected Behavior After Setup

When you use Claude Code, it will:
- ❌ Never hardcode values
- ✅ Ask before creating files
- ✅ Use environment variables
- ✅ Follow existing code patterns
- ✅ Provide concise responses
- ✅ Validate dependencies
- ✅ Use proper error handling