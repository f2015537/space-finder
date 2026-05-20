# Space Finder

A full-stack cloud application for listing and discovering spaces (venues, rooms, locations). Built entirely on AWS using the CDK for infrastructure-as-code and React for the frontend.

**Live demo:** https://d24kqex7dx8ru7.cloudfront.net

---

## Tech Stack

**Infrastructure**
- AWS CDK (TypeScript) — all infrastructure defined as code across six stacks
- API Gateway + Lambda — serverless REST API
- DynamoDB — space listings, partitioned per user
- S3 — photo storage with direct browser-to-S3 uploads
- Cognito — user pool, identity pool, and group-based IAM role mapping
- CloudFront — SPA hosting with edge caching
- SES — transactional email for signup verification
- CloudWatch + SNS — API error rate monitoring with Slack alerting

**Frontend**
- React 19 + TypeScript + Vite
- AWS Amplify v6 (auth)
- AWS SDK v3 (direct S3 uploads using Cognito federated credentials)
- React Router v7

---

## Architecture

```
Browser
  │
  ├── CloudFront (d24kqex7dx8ru7.cloudfront.net)
  │     └── S3 (React SPA)
  │
  ├── API Gateway /spaceFinder  ←── Cognito JWT authorizer
  │     └── Lambda (Node 20)
  │           └── DynamoDB
  │
  ├── S3 (photos) ←── direct upload via Cognito Identity Pool credentials
  │
  └── Cognito User Pool  ←── SES for verification emails
```

The frontend never proxies file uploads through the backend. After signing in, Amplify's `fetchAuthSession()` returns temporary AWS credentials from the Cognito Identity Pool which are used to upload photos directly to S3 from the browser.

Spaces are scoped per user — the Lambda stamps the Cognito `sub` claim onto every item at write time and filters by it at read time, without any application-level access control logic.

---

## Project Structure

```
├── src/
│   ├── infra/
│   │   ├── Launcher.ts          # CDK app entry point
│   │   └── stacks/              # One file per CDK stack
│   └── services/
│       ├── spaces/              # Lambda handlers (GET, POST, PUT, DELETE)
│       ├── monitor/             # CloudWatch alarm → Slack webhook handler
│       ├── model/               # Shared domain types
│       └── shared/              # Validation, utilities
├── frontend/
│   └── src/
│       ├── services/            # AuthService, DataService
│       ├── models/              # Frontend type definitions
│       ├── pages/               # Route-level components
│       └── components/          # Shared UI components
└── test/                        # Manual integration test scripts
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- AWS CLI configured with appropriate credentials
- AWS CDK CLI: `npm install -g aws-cdk`

### Environment setup

Copy the example env files and fill in your values after deploying the infrastructure:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

| File | Contains |
|------|----------|
| `.env` | Cognito IDs, region, Slack webhook URL — used by CDK at synth time and by test scripts |
| `frontend/.env` | `VITE_*` prefixed values for the React build — API URL, Cognito IDs, S3 bucket |

### Deploy infrastructure

```bash
npm install
cdk bootstrap   # first time only
cdk deploy --all
```

CDK outputs the API URL, Cognito pool IDs, and CloudFront domain after deployment — use these to populate your `.env` files.

### Run the frontend locally

```bash
cd frontend
npm install
npm run dev
```

### Build and deploy the frontend

```bash
cd frontend && npm run build && cd ..
cdk deploy UIDeploymentStack
```

The `UIDeploymentStack` automatically invalidates the CloudFront cache after uploading assets.

---

## Key Design Decisions

- **Single Lambda for all CRUD** — routes on `httpMethod` internally. Keeps deployment simple; a separate Lambda per route would be appropriate at larger scale.
- **Direct S3 uploads** — avoids routing large files through Lambda (which has a 6 MB payload limit) and eliminates unnecessary data transfer costs.
- **Per-user data isolation** — enforced at the DynamoDB query level using the Cognito `sub` claim from the API Gateway authorizer, not application logic.
- **SES sandbox** — by default, SES only sends to verified addresses. Request production access via the AWS console to send to any email.
