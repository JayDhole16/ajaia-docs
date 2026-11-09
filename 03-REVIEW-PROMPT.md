Act as a hostile but fair code reviewer for the Ajaia assessment.

Do not praise the code. Find problems.

Audit:
- broken flows
- authorization bypasses
- data-loss risks
- race conditions
- validation gaps
- bad loading/error states
- mobile/responsive problems
- accessibility problems
- unnecessary dependencies
- insecure secrets
- deployment incompatibilities
- TypeScript errors
- dead code
- inconsistent architecture
- poor UX
- missing assignment requirements

Then fix the highest-impact issues yourself.

After fixes run:
- lint
- typecheck
- tests
- production build

Finally create a concise checklist mapping every assignment requirement to evidence in the code/UI.
