# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space Finder is a full-stack AWS application. The backend is a CDK-managed infrastructure project (TypeScript) and the frontend is a React + Vite + TypeScript SPA. They are two separate TypeScript projects with separate `tsconfig.json` files and `node_modules`.

## Commands

### Backend (run from repo root)
```bash
npx tsc --noEmit                        # type-check backend only
cdk deploy --all                        # deploy all stacks
cdk deploy <StackName>                  # deploy a single stack
cdk deploy --all --require-approval never  # deploy without IAM change prompts
npx ts-node test/auth.test.ts           # run manual auth integration test
npx ts-node test/monitor.test.ts        # run manual monitor test
```

### Frontend (run from `frontend/`)
```bash
npm run dev       # local dev server
npm run build     # tsc + vite build (output to frontend/dist/)
npm run lint      # eslint
```

### Full deployment workflow
```bash
cd frontend && npm run build && cd ..
cdk deploy --all --require-approval never
```

## Architecture

### Backend — CDK Stacks (`src/infra/stacks/`)
All stacks are wired together in `src/infra/Launcher.ts`, which also loads the root `.env` via `process.loadEnvFile`.

| Stack | Responsibility |
|---|---|
| `DataStack` | DynamoDB table + S3 photos bucket (public read, CORS enabled) |
| `LambdaStack` | Single `SpacesLambda` handling all CRUD for spaces |
| `ApiStack` | API Gateway REST API at `/spaceFinder` with Cognito authorizer |
| `AuthStack` | Cognito User Pool + Identity Pool + IAM roles + SES email identity |
| `UIDeploymentStack` | S3 + CloudFront for the React SPA; invalidates cache on every deploy |
| `MonitorStack` | CloudWatch 4XX alarm → SNS → Lambda → Slack webhook |

### Lambda routing (`src/services/spaces/`)
One Lambda handles all HTTP methods via a `switch(event.httpMethod)` in `handler.ts`. Each method delegates to a dedicated file (`GetSpaces.ts`, `PostSpaces.ts`, `UpdateSpace.ts`, `DeleteSpace.ts`). The DynamoDB client is instantiated once at module level and shared.

**Important:** `GetSpaces` and `PostSpaces` extract `userId` from `event.requestContext.authorizer.claims.sub` (Cognito JWT claim injected by API Gateway). Spaces are scoped per user — GET filters by userId via a DynamoDB `FilterExpression`, POST stamps userId on write.

### Frontend (`frontend/src/`)
- **Services** (`services/`): `AuthService` wraps Amplify auth (signin, signout, signup, session restore, credential generation). `DataService` handles REST calls to API Gateway and S3 uploads using Cognito Identity Pool credentials from `fetchAuthSession()`.
- **Models** (`models/`): Shared type definitions (e.g. `SpaceEntry`). Do not define shared types inside service files.
- **Routing** (`App.tsx`): React Router v7. Protected routes use a `ProtectedRoute` component that reads `username` state; a `authLoading` boolean prevents redirect races during session restore on mount.
- **Config**: All infrastructure values (API URL, Cognito IDs, S3 bucket) are read from `import.meta.env.VITE_*` — defined in `frontend/.env` and typed in `frontend/src/vite-env.d.ts`.

### Authentication flow
Amplify is configured once at module level in `AuthService.ts` (reads from `import.meta.env`). On app mount, `fetchAuthSession()` restores the existing Cognito session. S3 uploads use temporary AWS credentials obtained from `fetchAuthSession().credentials` (Identity Pool), not the ID token.

### Environment variables
- **Root `.env`** — loaded by `Launcher.ts` at CDK synth time and by `test/AuthService.ts` at test time. Contains Cognito IDs, region, and the Slack webhook URL.
- **`frontend/.env`** — loaded by Vite at build time. Contains `VITE_*` prefixed versions of the same Cognito values plus the API URL and S3 bucket name.
- Both `.env` files are git-ignored; `.env.example` files are committed as templates.

### TypeScript notes
- The root `tsconfig.json` (backend, `module: NodeNext`) and `frontend/tsconfig.app.json` (Vite, JSX) are completely separate. Running `tsc --noEmit` from the root only checks backend files.
- `erasableSyntaxOnly` is enabled in the frontend — TypeScript constructor parameter properties (`private readonly x`) are not allowed; declare fields explicitly.
- React 19 types deprecate `FormEvent` in favour of `SubmitEvent` for form submit handlers, and `ChangeEvent` for input handlers should be avoided by using inline handlers instead.
