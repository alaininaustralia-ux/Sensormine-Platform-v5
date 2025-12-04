# Quick Start: AI-Driven Development

## For Starting a New Chat Session

### Step 1: Give Context to AI
```
Read .agent/current-state.md and tell me what story we should work on next
```

The AI will:
- Read the current state document
- Review which stories are complete
- Check for blockers or dependencies
- Recommend the next highest-priority story

### Step 2: Start Working on a Story
```
Let's implement Story 12.2 (Stripe Integration)
```

The AI will automatically:
1. ✅ Create story plan from template
2. ✅ Write failing tests (Red phase)
3. ✅ Implement minimum code (Green phase)
4. ✅ Refactor and clean up
5. ✅ Update `.agent/current-state.md`
6. ✅ Commit with [Story 12.2] prefix
7. ✅ Close GitHub issue #191

### Step 3: Continue or Switch
```
What's next?
```

The AI will check current-state.md and recommend the next story.

---

## For You (Developer)

### Check Project Status
```powershell
# Open current state document
code .agent/current-state.md
```

You'll see:
- Current sprint and active story
- Completion tracking (0 of 122 stories)
- Epic progress dashboard
- Blockers and dependencies
- Quick navigation to requirements

### View Completed Work
```powershell
# List completed stories
ls .agent/completed-stories/

# View a completed story
code .agent/completed-stories/story-12.1.md
```

Each completion document includes:
- Test results and coverage
- Files created/modified
- Architecture decisions
- Issues encountered and resolved
- Deployment notes

### Work on a Story Yourself

1. **Copy template**:
   ```powershell
   cp .agent/story-templates/story-plan.md .agent/story-12.3-plan.md
   ```

2. **Fill out plan**: Technical approach, files to modify, test strategy

3. **Follow TDD workflow**: Red → Green → Refactor (see `.agent/workflow.md`)

4. **Update state**: Mark story complete in `.agent/current-state.md`

5. **Move to completed**:
   ```powershell
   mv .agent/story-12.3-plan.md .agent/completed-stories/story-12.3.md
   ```

---

## Example Chat Sessions

### Session 1: Starting Fresh
**You**: 
> Read .agent/current-state.md and let's start on the first billing story

**AI**: 
> I see we have 0 of 12 billing stories complete. I recommend starting with Story 12.2 (Stripe Integration) as it's on the critical path. I'll create a plan, write tests, and implement the Stripe payment service. [Proceeds with work...]

---

### Session 2: Continuing Work
**You**: 
> What's the current state? What should we work on next?

**AI**: 
> Reading .agent/current-state.md... We've completed Story 12.2 (Stripe Integration). The next recommended story is 12.3 (Subscription Plan Management) which is now unblocked. Should I proceed with that?

---

### Session 3: Checking Progress
**You**: 
> Show me our progress on Epic 12

**AI**: 
> Based on .agent/current-state.md:
> - Epic 12: Billing, Metering & Payments
> - Completed: 2 of 12 stories (17%)
> - Stories done: 12.2 (Stripe), 12.9 (Webhooks)
> - Next up: 12.3 (Subscription Plans) or 12.1 (Usage Metering)

---

## Benefits

✅ **Clean Chats**: Start fresh, AI reads state document for full context  
✅ **No Deviation**: Story plans keep work focused on acceptance criteria  
✅ **Quality Code**: TDD ensures everything is tested  
✅ **Clear Progress**: Always know what's done and what's next  
✅ **Easy Handoffs**: Anyone can pick up where you left off  
✅ **Audit Trail**: Complete history in completed-stories/  

---

## File Structure

```
.agent/
├── README.md                      # This file (overview)
├── current-state.md               # 📌 READ THIS FIRST - Project status
├── workflow.md                    # TDD process documentation
├── story-templates/
│   ├── story-plan.md             # Template for planning
│   └── story-completion.md       # Template for completion docs
└── completed-stories/
    ├── story-12.1.md             # Completed story #1
    ├── story-12.2.md             # Completed story #2
    └── ...                        # More completed stories

docs/
├── user-stories.md               # 122 stories (source of truth)
├── architecture.md               # System design
├── requirements.md               # Functional requirements
└── ...

CHECKLIST.md                      # High-level milestone tracking
```

---

## Key Principles

1. **`.agent/current-state.md` is the single source of truth** for project progress
2. **One story = one commit** with `[Story X.Y]` prefix
3. **Always update current-state.md** after completing a story
4. **Follow TDD workflow**: Red → Green → Refactor
5. **Keep story plans during active work**, move to completed-stories/ when done

---

## Next Steps

1. ✅ Read `.agent/current-state.md` to understand project status
2. ✅ Review `.agent/workflow.md` to understand TDD process  
3. ✅ Start your next chat with: "Read .agent/current-state.md and recommend next story"
4. ✅ Let AI handle the TDD workflow automatically

---

**Your new workflow**: Clean chats, focused work, clear progress tracking! 🚀
