---
description: Membership import workflow
---
# import

Read CLAUDE.md. Run:

```bash
npm run membership -- import wild-apricot <file.csv> [--dry-run] [--date-order=DMY|MDY]
```

Read docs/replace-wild-apricot.md. Run a dry run, compare totals, then import. Never infer dates or join consent. Preserve the source file.

Use --json when composing analysis. Ambiguous names list candidates and exit 1; resolve the candidate before continuing. Drafts never send.
