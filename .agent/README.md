# .agent Folder - AI-Driven Development Workflow

This folder contains the AI-driven development infrastructure for maintaining clean chat sessions and preventing task deviation.

---

## 📁 Contents

### Core Documents
- **`current-state.md`** - Single source of truth for project state
  - Current sprint and active story
  - Story completion tracking
  - Blockers and dependencies
  - Quick navigation guide
  - **Read this first in every new chat session!**

- **`workflow.md`** - TDD workflow documentation
  - 7-phase story development process
  - Red → Green → Refactor methodology
  - Testing strategies and patterns
  - Commit and documentation standards

### Templates
- **`story-templates/story-plan.md`** - Template for planning each story
- **`story-templates/story-completion.md`** - Template for documenting completed stories

### Completed Work
- **`completed-stories/`** - Archive of completed story plans with test results

---

## 🔄 How This Workflow Works

### For AI Agents (GitHub Copilot)

**Starting a new chat session?**
1. Read `.agent/current-state.md` first
2. Review active story or blockers
3. If no active story, ask user which story to tackle next
4. Follow the workflow in `.agent/workflow.md`

**Working on a story?**
1. Copy `.agent/story-templates/story-plan.md` to `.agent/story-X.Y-plan.md`
2. Fill out the plan with technical approach
3. Follow TDD: Red → Green → Refactor
4. Update `.agent/current-state.md` when complete
5. Move plan to `.agent/completed-stories/story-X.Y.md`

**Finishing a chat session?**
1. Ensure current-state.md is updated with progress
2. Note any blockers or open questions
3. Commit all changes with [Story X.Y] prefix
4. Leave clear notes for next session

### For Developers

**Starting work?**
- Read `.agent/current-state.md` to understand where the project stands
- Check completed-stories/ to see what's been done
- Select a story that has no blockers

**Switching contexts?**
- Update current-state.md with your progress
- Note the active story
- Document any blockers discovered

**Code review?**
- Check that story plan exists in `.agent/` or `completed-stories/`
- Verify tests exist and pass
- Confirm current-state.md was updated

---

## 📋 Workflow Summary

```
1. READ:    .agent/current-state.md
2. PLAN:    .agent/story-X.Y-plan.md (from template)
3. RED:     Write failing tests
4. GREEN:   Implement minimum code
5. REFACTOR: Clean up and document
6. UPDATE:  .agent/current-state.md
7. ARCHIVE: Move plan to .agent/completed-stories/
```

---

## 🎯 Benefits

- **Clean Chat Sessions**: Every chat starts with full context from current-state.md
- **No Deviation**: Story plans keep work focused on acceptance criteria
- **Quality Code**: TDD ensures everything is tested
- **Clear Progress**: current-state.md shows exactly where project stands
- **Easy Handoffs**: Anyone can pick up where you left off
- **Audit Trail**: completed-stories/ has history of all work

---

## 📚 Quick Reference

### Essential Files to Update
- `.agent/current-state.md` - After every story completion
- `.agent/story-X.Y-plan.md` - During active development
- `docs/user-stories.md` - Never modify (source of truth)
- `CHECKLIST.md` - Major milestones only

### Commit Message Format
```
[Story X.Y] Brief description

- Detailed change 1
- Detailed change 2
- Test results: X passed, Y failed
- Coverage: Z%
```

### Story Status Indicators
- 🔴 Not Started
- 🟡 In Progress
- ✅ Complete
- 🚫 Blocked

---

## 🚀 Getting Started

**First time here?**
```powershell
# 1. Read the current state
code .agent/current-state.md

# 2. Review the workflow
code .agent/workflow.md

# 3. Start working on a story
cp .agent/story-templates/story-plan.md .agent/story-12.1-plan.md
code .agent/story-12.1-plan.md
```

**AI Agent starting a chat?**
```
1. Read .agent/current-state.md for full context
2. Check active story or ask user what to work on
3. Follow workflow.md for TDD process
4. Update current-state.md when done
```

---

## 📖 Example Story Lifecycle

### Story Start
```
.agent/
├── current-state.md           # Active Story: 12.2 (In Progress)
├── story-12.2-plan.md         # Planning doc (WIP)
└── completed-stories/
    └── story-12.1.md          # Previous completed story
```

### Story Complete
```
.agent/
├── current-state.md           # Active Story: 12.3 (In Progress)
└── completed-stories/
    ├── story-12.1.md          # Completed
    └── story-12.2.md          # Just completed (moved from root)
```

---

This workflow ensures consistent, high-quality development across chat sessions and team members.
