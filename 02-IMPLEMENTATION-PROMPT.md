Continue implementation from the current repository.

Work feature-by-feature in this order:

PHASE 1
- install/configure dependencies
- database
- schema
- seed demo users
- minimal auth/session

PHASE 2
- document create/list/get/update/rename
- owner authorization
- persistence

PHASE 3
- TipTap editor
- toolbar: bold, italic, underline, heading, bullet list, ordered list
- save status
- reopen with formatting intact

PHASE 4
- .txt/.md upload
- validation
- import into editable document
- clear supported-file messaging

PHASE 5
- sharing dialog
- choose seeded user
- create share record
- owned/shared document sections
- server-side access checks

PHASE 6
- loading/error/empty states
- responsive UI
- accessibility basics
- confirmation for destructive actions
- useful success/error feedback

PHASE 7
- meaningful automated test for an important behavior, preferably authorization or document persistence
- run lint
- run typecheck
- run tests
- run production build

Do not add stretch features until every required feature is verified.
