# Standing Orders for GitHub Copilot

**These instructions must be followed at the start of EVERY chat session.**

---

## 🤖 Automatic Startup Procedure

When a new chat session begins, **IMMEDIATELY** execute these steps:

### Step 1: Read Project State (MANDATORY)
```
Read .agent/current-state.md
```

This document contains:
- Current sprint and active story
- Story completion tracking (X of 122 stories complete)
- Epic progress dashboard
- Blockers and dependencies
- Next recommended story

### Step 2: Greet User with Context
Provide a brief summary like:

```
📊 Project Status:
- Completed: X of 122 stories (Y%)
- Current Epic: Epic 12 - Billing, Metering & Payments (X of 12 complete)
- Active Story: [Story Number] - [Title] (In Progress)
  OR
- Active Story: None (Ready to start)

🎯 Next Recommended Story: 
Story X.Y - [Title] ([Priority], [Points] points)
Reason: [Why this story is recommended - critical path, unblocks others, etc.]

Ready to continue? Or would you like to work on a different story?
```

### Step 3: Wait for User Direction
Let the user choose:
- Continue with recommended story
- Work on a different story
- Check project status
- Review completed work

---

## 📋 Workflow Rules

### When Working on a Story
1. **Follow TDD workflow** defined in `.agent/workflow.md`
2. **Create story plan** from `.agent/story-templates/story-plan.md`
3. **Red → Green → Refactor** for all code
4. **Update `.agent/current-state.md`** after completion
5. **Commit with [Story X.Y] prefix**
6. **Close GitHub issue** with completion summary

### When Completing a Story
1. Move plan to `.agent/completed-stories/story-X.Y.md`
2. Update current-state.md:
   - Change story status from 🔴/🟡 to ✅
   - Update completion counts
   - Update epic percentages
   - Clear "Active Story" or set next one
3. Commit and push to GitHub
4. Close GitHub issue with link to commit

### Before Starting Any Story
1. ✅ Check `.agent/current-state.md` for blockers
2. ✅ Verify dependencies are complete
3. ✅ Read story in `docs/user-stories.md`
4. ✅ Review relevant sections in `docs/architecture.md`

---

## 🎯 Story Selection Priority

When recommending next story, prioritize:
1. **Critical Path** - Stories that unblock other work
2. **High Priority** - Stories marked as High priority
3. **No Dependencies** - Stories with all dependencies met
4. **Context Continuity** - Stories in same service/domain as previous work

### Epic 12 (Billing) Recommended Order
1. **12.2** - Stripe Integration (Foundation for all payments)
2. **12.1** - Usage Metering Infrastructure (Foundation for billing)
3. **12.9** - Billing Webhooks (Completes Stripe integration)
4. **12.3** - Subscription Plan Management (Depends on 12.2)
5. **12.4** - Automated Invoice Generation (Depends on 12.1, 12.2)
6. **12.6** - Resource Quota Enforcement (Depends on 12.1)
7. **12.10** - Sub-Tenant Billing Allocation (Depends on 12.1)
8. **12.5** - Tenant Billing Portal (Frontend, depends on 12.3, 12.4)
9. **12.8** - Revenue Analytics Dashboard (Reporting, depends on 12.4)
10. **12.7** - Multi-Currency Support (Enhancement to 12.2)
11. **12.11** - Promotional Codes (Nice-to-have)
12. **12.12** - Payment Method Compliance (Security)

---

## 🚫 Anti-Patterns to Avoid

❌ Starting work without reading current-state.md  
❌ Implementing code before writing tests  
❌ Completing multiple stories in one commit  
❌ Skipping state updates after story completion  
❌ Starting stories with incomplete dependencies  
❌ Forgetting to close GitHub issues  

---

## 📁 Essential File Locations

- **Project State**: `.agent/current-state.md` (READ FIRST!)
- **User Stories**: `docs/user-stories.md` (122 stories, source of truth)
- **Architecture**: `docs/architecture.md` (System design)
- **Workflow**: `.agent/workflow.md` (TDD process)
- **Story Templates**: `.agent/story-templates/`
- **Completed Work**: `.agent/completed-stories/`
- **GitHub Issues**: https://github.com/alaininaustralia-ux/Sensormine-Platform-v5/issues

---

## 🔄 Session Handoff Protocol

### Ending a Session
Before ending, ensure:
- [ ] All work committed and pushed
- [ ] `.agent/current-state.md` updated with progress
- [ ] Active story status is accurate (In Progress/Complete)
- [ ] Blockers documented if any
- [ ] GitHub issues updated

### Starting a Session
Always begin with:
- [ ] Read `.agent/current-state.md`
- [ ] Greet user with status summary
- [ ] Recommend next story with reasoning
- [ ] Wait for user direction

---

## 💡 Quick Commands for User

Users can say:
- "What's our current status?" → Read and summarize current-state.md
- "Continue" → Pick up where last session left off
- "What's next?" → Recommend next priority story
- "Start Story X.Y" → Begin work on specific story
- "Show completed work" → List files in completed-stories/

---

**This standing order ensures every chat session starts with full context and maintains consistency across development work.**
