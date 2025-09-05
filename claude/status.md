# Minimal Claude Tracking System

## Single File: `/claude/status.md`
```markdown
# Project Status

## Current Plan
Phase 1: [Name] - [Status]
- [ ] [Key task]
- [ ] [Key task]

Phase 2: [Name] - [Status]  
Phase 3: [Name] - [Status]

## Active Now
**Phase**: 1
**Next**: [One specific action]
**Blocker**: [If any]

## Recent Progress
- [Date]: [What was done]
- [Date]: [What was done]

## Key Decisions
- [Important choice made and why]
```

## Optimized `claude.md` (Project Root)
```markdown
# [Project Name]

**Status**: Phase [X] - [Brief description]
**Next**: [Immediate next action]

## For Claude
Read `/claude/status.md` first - tells you everything.

Ground Rules: [Link to rules]
```

## Token-Saving Protocol
1. **Session start**: "Read claude/status.md, continue current phase"
2. **Session end**: "Update status.md with progress and next step"
3. **Keep updates brief**: One-line entries, focus on what matters
4. **No redundancy**: Don't repeat info that's obvious from context