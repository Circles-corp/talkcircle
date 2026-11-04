# Contributing to Circle

Thanks for helping build Circle. These rules keep the codebase consistent, safe and
easy to review. Pull requests that don't follow them will be asked to change before merging.

## Before you start
- Read `docs/SPEC.md`. It is the source of truth for features, data models and the API.
- Node.js 24 is required.
- Install with `npm ci` inside `client/` and `server/`.
- Copy `server/.env.example` to `server/.env` and use your **own** values.
  Never ask for, share or commit anyone else's.

## Workflow
1. Every change starts from an issue or an agreed task.
2. Create a branch from `main`: `feat/short-name`, `fix/short-name` or `docs/short-name`.
3. Keep pull requests small: one feature or fix each.
4. Commit messages use the format `type(scope): summary`, for example
   `feat(server): add event attendance endpoint` or `fix(client): close radial menu on Esc`.
5. Open a pull request and fill in the template completely.
6. CI must pass and the maintainer must approve before merging. Nobody pushes to `main` directly.

## Code rules
- TypeScript strict mode. No `any`, no non-null assertions (`!`), no `@ts-ignore`.
- Explicit, readable logic over clever one-liners.
- No comments in code. Explanations go in the pull request description.
- Handle edge cases and failures: empty data, missing records, network errors, slow responses.
- Every value used in more than one place lives in one constant (for example `ROUTES` for paths).

### Client
- Colours, radii and fonts come only from the tokens in `client/src/index.css`. Never use raw hex values in components.
- Never build Tailwind class names dynamically (`bg-${colour}`). Write full class names.
- Accessibility: touch targets at least 44px, every icon-only button has an `aria-label`,
  and colour is never the only way information is shown.
- New screens or major UI changes need an agreed mockup before code.
- Data is fetched only through the RTK Query API in `client/src/app/api.ts`.
  When an endpoint changes, update `client/src/mocks/` to match.

### Server
- Follow the folder layers in `docs/SPEC.md` section 3. A service calls only its own repository.
- Validate all input with Zod. Enforce permissions in services, not controllers.
- Errors always use the shape `{ "error": { "code", "message" } }`.
- Like, follow, join and "going" endpoints must be idempotent.
- Counters change in the same transaction as the record they count.
- Lists use cursor pagination as described in the spec.
- Every new endpoint needs Vitest and Supertest tests.

## Before opening a pull request
Run inside each package you changed:

    npm run lint
    npm run typecheck
    npm test          (server)
    npm run build

Then test the feature by hand and list the steps in the pull request.
Passing checks mean the code is valid, not that the feature works.

## Safety
- Never commit `.env` files or any secret, token or password.
- Never use `--force`, `--legacy-peer-deps` or `npm audit fix --force` to get past dependency errors.
  Ask first.
- Never run destructive commands (`rm -rf`, `git reset --hard`, force-push) on shared work without agreement.
- Don't commit editor or AI-assistant configuration files.

## Changing the spec
If your change alters an endpoint, data model or rule, update `docs/SPEC.md` in the same pull request.
