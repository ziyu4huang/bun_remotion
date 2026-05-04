# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## GitHub Projects — bun_app app mapping

Each `bun_app/<name>` directory maps to a GitHub Project named `<name>`.

| bun_app directory | GitHub Project name |
|---|---|
| `bun_app/agent_game_content_creation` | `agent_game_content_creation` (project #2) |
| `bun_app/storygraph` | `storygraph` (project #3) |
| `bun_app/remotion_types` | `remotion_types` (project #4) |
| `bun_app/episodeforge` | `episodeforge` (project #5) |
| `bun_app/bun_tts` | `bun_tts` (project #6) |
| `bun_app/bun_image` | `bun_image` (project #7) |
| `bun_app/bun_pi_agent` | `bun_pi_agent` (project #8) |

**Key commands:**
- List projects: `gh project list --owner ziyu4huang`
- Add issue to project: `gh project item-add <project-num> --owner ziyu4huang --url <issue-url>`
- List project items: `gh project item-list <project-num> --owner ziyu4huang`
- Create project: `gh project create --owner ziyu4huang --title "<name>"`
- Rename project: `gh project edit <project-num> --owner ziyu4huang --title "<new-name>"`
- Create issue and add to project: `gh issue create ... --project <project-num>`

**Convention:** When creating issues for a `bun_app/<name>` app, also add them to the corresponding project so they're browsable as a board.

**Auth requirement:** `project` scope needed — run `gh auth refresh -s project` if missing.

## Issue relationships (sub-issues + dependencies)

Use native GitHub relations instead of writing `Parent:` / `Depends on:` in comments or bodies.

### Get node IDs (required for all GraphQL mutations)

```bash
gh api graphql -f query='{
  repository(owner: "ziyu4huang", name: "dev_game") {
    i81: issue(number: 81) { id }
    i83: issue(number: 83) { id }
  }
}'
```

### Sub-issues (parent → child hierarchy)

A PRD issue owns its phase issues as sub-issues. GitHub shows completion % on the parent automatically.

```bash
# Add child as sub-issue of parent
gh api graphql \
  -H "GraphQL-Features: sub_issues" \
  -f query='mutation($parentId: ID!, $childId: ID!) {
    addSubIssue(input: {issueId: $parentId, subIssueId: $childId}) {
      issue { number }
      subIssue { number }
    }
  }' \
  -f parentId="<parent-node-id>" \
  -f childId="<child-node-id>"
```

### Blocked-by dependencies

Use when an issue cannot start until another is done.

```bash
# Mark issueId as blocked by blockingIssueId
gh api graphql -f query='
mutation($issueId: ID!, $blockingIssueId: ID!) {
  addBlockedBy(input: {issueId: $issueId, blockingIssueId: $blockingIssueId}) {
    issue { number }
    blockingIssue { number }
  }
}' \
-f issueId="<blocked-node-id>" \
-f blockingIssueId="<blocking-node-id>"

# Remove a blocked-by relationship
# Use removeBlockedBy with same input shape
```

### Convention

- PRD issues → all phase issues are sub-issues
- Phase N blocked by Phase N-1 when there is a hard dependency
- Do **not** write `Parent:` / `Depends on:` / `Prev:` / `Next:` in comments — native relations are the source of truth
