---
name: confirm-format-zhtw
description: When presenting episode content for user confirmation, show all story/dialog in zh_TW. Never present English summaries as the content to confirm.
type: feedback
---

# Confirm content in zh_TW

**Rule:** When creating a new episode and presenting the story for user confirmation, ALL content must be shown in zh_TW (Traditional Chinese). The confirm block is the story/dialog itself, not an English summary.

**Why:** User needs to review and approve the actual Chinese dialog that will appear in the video. English summaries don't allow quality review of the writing, humor, and tone. The user is Chinese-speaking and needs to judge if the zh_TW text is good.

**How to apply:**
- Present a structured confirm block with all 4 scenes' dialog in zh_TW
- Use the stable template from `rules/episode-creation.md`
- Do NOT proceed to code generation until user confirms the zh_TW content
- If user says "looks good" or approves, then generate code
- If user requests changes, modify the zh_TW content and re-present
