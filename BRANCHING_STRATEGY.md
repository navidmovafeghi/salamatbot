# 🌳 **Solo Developer Git Strategy**

## 📋 **Overview**

Ultra-simple Git workflow for solo development. No PRs, no reviews, just organized development.

---

## 🎯 **One-Branch-Per-Feature**

```
main (production)
├── feature/enhanced-prompts
├── feature/ui-improvements  
└── feature/emergency-detection
```

Work in branches, merge when ready. That's it.

---

## 🚀 **Branch Rules**

### **`main` Branch**
- **Purpose**: Working production code
- **Deployment**: Auto-deploys to Netlify
- **Protection**: None needed (you're solo!)

### **Feature Branches**
- **Purpose**: All development work
- **Naming**: `feature/description` or just the feature name
- **Lifetime**: Create → Work → Merge → Delete

---

## 🔄 **Solo Workflow**

### **1. Start New Feature**
```bash
git checkout main
git pull origin main
git checkout -b feature/new-thing
```

### **2. Work & Commit Often**
```bash
# Make changes
git add .
git commit -m "Add new thing"

# Keep working...
git commit -m "Fix bug in new thing"
git commit -m "Improve new thing styling"
```

### **3. Merge When Ready**
```bash
git checkout main
git merge feature/new-thing
git push origin main
git branch -d feature/new-thing
```

### **4. Or Push Branch for Backup**
```bash
# Optional: backup your work
git push origin feature/new-thing
```

---

## 📝 **Simple Commits**

Just describe what you did:
```bash
git commit -m "Fix Persian text bug"
git commit -m "Add emergency detection"
git commit -m "Improve mobile layout"
git commit -m "Update Gemini prompts"
```

---

## 🏷️ **Tag Releases**

When you deploy something significant:
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 🆘 **Quick Fixes**

For urgent production fixes:
```bash
# Option 1: Fix directly on main (fastest)
git checkout main
# fix the issue
git commit -m "Fix critical bug"
git push origin main

# Option 2: Use hotfix branch (safer)
git checkout -b hotfix/urgent-fix
# fix the issue
git commit -m "Fix critical bug"
git checkout main
git merge hotfix/urgent-fix
git push origin main
```

---

## 🎯 **That's It!**

- Work in feature branches for organization
- Merge to main when ready
- No PRs, no reviews, no overhead
- Focus on building your medical chatbot

**Main rule**: Keep main working, everything else is flexible.