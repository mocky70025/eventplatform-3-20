# Mistakes

## 2026-09-10

- Mistake: Tried the global `vercel` executable before confirming it was installed.
- Cause: The Admin project was already linked, but the local CLI availability was not checked first.
- Fix: Use `npx vercel` for subsequent Vercel CLI access.
- Prevention: Verify the installed CLI command before relying on a global executable.

- Mistake: Opened the editable Vercel environment-variable view, which rendered existing administrator emails in tool output.
- Cause: Config-type variable values are visible in Vercel's edit UI.
- Fix: Did not repeat or disclose the values; the update will append the temporary E2E address without retyping the existing list.
- Prevention: Use non-revealing update mechanisms when available and avoid exposing config values in automation output.

- Mistake: Assumed the browser automation could confirm the Admin deletion dialog.
- Cause: The browser runtime did not expose the JavaScript confirmation dialog to the automation API.
- Fix: Verified the Admin UI action up to the confirmation step, then used the authorized backend path to complete the logical deletion.
- Prevention: Treat browser confirmation dialogs as a separate verification constraint and prepare an approved fallback for destructive test actions.
