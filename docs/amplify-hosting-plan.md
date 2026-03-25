# Amplify Hosting Plan: USTC Payment Portal Dev Dashboard

**Still needs human review and comparison against the PAY-053 branch in ustc-payment-portal**
**Remove plan before merge**

**Target:** `dashboard.dev-payments.ustaxcourt.gov`
**API Target:** `dev-payments.ustaxcourt.gov` (ustc-payment-portal)
**AWS Account:** USTC Payment Portal Dev (account `723609007960`, region `us-east-1`)

---

## Phase 1 — Create the Amplify App in AWS - done

> Do this in the **Payment Portal Dev** AWS account.

1. **Open the Amplify console** → select **us-east-1** (confirmed region for the payment portal API and Route 53 hosted zone).

2. **Create a new app** → **"Build an app" (Gen 2)**, not "Host web app" (classic) → connect to your GitHub repo (`ustc-payment-portal-dev-dashboard`).
   - The repo uses `@aws-amplify/backend` and `ampx pipeline-deploy` — these require a Gen 2 app. Classic Amplify Hosting will not work with the existing `deploy.yml`.
   - Select the `main` branch as the production branch.
   - Amplify will detect `amplify.yml` automatically — do **not** let it overwrite it.

3. **Note the App ID** that Amplify assigns (e.g. `d1abc123xyz`). You'll need this for GitHub secrets.

4. **Review the build settings** — Amplify should pick up `amplify.yml` verbatim. The file already includes a `customRules` SPA rewrite that serves `index.html` for all non-asset paths, which is required for React Router to handle direct URL navigation and page refreshes correctly.

   ```yaml
   preBuild: npm ci + npm run lint
   build: npm run build
   artifacts baseDirectory: dist
   ```

   Confirm `dist` is the artifact root before saving.

5. **Disable automatic branch deployments** on everything except `main` unless you intend to use PR previews. Under _App settings → General → Branch autodetect_, restrict it to `main`.

---

## Phase 2 — IAM: OIDC Trust for GitHub Actions

The existing `deploy.yml` already uses OIDC. You need an IAM role in the Payment Portal Dev account that GitHub Actions can assume.

1. **The OIDC Identity Provider already exists** — the payment portal has already registered it in this account:

   ```
   arn:aws:iam::723609007960:oidc-provider/token.actions.githubusercontent.com
   ```

   Do not create a duplicate. Verify it is present under _IAM → Identity providers_ before proceeding.

2. **Create a new IAM Role** (e.g. `github-actions-amplify-deploy`) with:

   **Trust Policy:**

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::723609007960:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:ustaxcourt/ustc-payment-portal-dev-dashboard:*"
           },
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           }
         }
       }
     ]
   }
   ```

   The `sub` condition scopes this role exclusively to the dashboard repo — the payment portal's deployer role (`ustc-payment-processor-dev-cicd-deployer-role`) uses a separate condition scoped to `repo:ustaxcourt/ustc-payment-portal:*` and must not be reused here.

   **Permission Policy** (minimum required for `ampx pipeline-deploy`):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "amplify:StartDeployment",
           "amplify:GetApp",
           "amplify:GetBranch",
           "amplify:GetJob",
           "amplify:ListJobs",
           "amplify:StartJob",
           "amplify:StopJob",
           "cloudformation:*",
           "iam:PassRole",
           "s3:*"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

   Scope down the `Resource` ARNs once you have the Amplify app ARN and its CloudFormation stacks confirmed.

3. **Copy the Role ARN** — it goes into GitHub secrets in Phase 6.

---

## Phase 3 — Set Environment Variables in Amplify

The dashboard has one runtime env var: `VITE_DASHBOARD_API_BASE_URL`. Vite bakes this into the bundle at **build time**, so it must be set in Amplify's build environment, not at runtime.

1. In the Amplify console → your app → **Environment variables**.
2. Add:

   | Key                           | Value                                 |
   | ----------------------------- | ------------------------------------- |
   | `VITE_DASHBOARD_API_BASE_URL` | `https://dev-payments.ustaxcourt.gov` |

   The payment portal REST API uses this as its custom domain (stage `dev`, base path mapping at root). The raw API Gateway invoke URL (`https://<api-id>.execute-api.us-east-1.amazonaws.com/dev`) can be used as a temporary value during smoke testing before the CORS and resource policy changes in Phase 8 are deployed.

3. Set the **branch** scope to `main`.

> **Important:** Because Vite embeds this at build time, any URL change requires a new deployment. Do not expect it to be overrideable at runtime.

---

## Phase 4 — Custom Domain Setup in Amplify

1. In Amplify → your app → **Domain management** → **Add domain**.

2. Enter `dev-payments.ustaxcourt.gov` as the root domain.

3. **Configure subdomains:**

   | Subdomain                               | Branch |
   | --------------------------------------- | ------ |
   | `dashboard.dev-payments.ustaxcourt.gov` | `main` |

4. Amplify will provision an **ACM certificate** for `dashboard.dev-payments.ustaxcourt.gov` automatically. Because the `dev-payments.ustaxcourt.gov` Route 53 hosted zone is in this same account, Amplify can insert the validation CNAME automatically — watch for a prompt to allow this. If it does not auto-validate, the required CNAME will be displayed in the Domain management console.

5. Amplify will also output a **CloudFront CNAME target** (e.g. `d1abc123xyz.cloudfront.net`) for the traffic routing record.

**Do not proceed to DNS until Amplify has generated both the validation CNAME and the CloudFront CNAME.**

---

## Phase 5 — DNS Configuration

The `dev-payments.ustaxcourt.gov` Route 53 hosted zone is managed by the payment portal's Terraform (`terraform/modules/api-gateway/main.tf` in `ustc-payment-portal`). Adding new records requires either a PR to that repo or a manual console addition.

You need to add **two new records** — the API DNS record (`dev-payments.ustaxcourt.gov` → API Gateway) already exists and is managed by the payment portal's Terraform; do not touch it.

### A) ACM Certificate Validation (temporary — can be removed after cert is issued)

```
Type:  CNAME
Name:  _<amplify-generated-token>.dashboard.dev-payments.ustaxcourt.gov
Value: _<amplify-generated-value>.acm-validations.aws
TTL:   300
```

Amplify shows the exact name/value in the Domain management console. If Amplify auto-validated using the Route 53 API, this record may already be present.

### B) Dashboard routing record (permanent)

```
Type:  CNAME
Name:  dashboard.dev-payments.ustaxcourt.gov
Value: <your-amplify-cloudfront-url>.cloudfront.net
TTL:   300
```

> **ACM cert propagation** typically takes 5–30 minutes after the CNAME validation record is live. Amplify's Domain management page will show "Pending verification" → "Available".

---

## Phase 6 — GitHub Repo Secrets & Variables

In the GitHub repo settings → **Secrets and variables → Actions**:

**Repository Secrets:**

| Secret Name          | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| `AWS_ROLE_TO_ASSUME` | `arn:aws:iam::723609007960:role/github-actions-amplify-deploy` |
| `AMPLIFY_APP_ID`     | `<amplify-app-id-from-phase-1>`                                |

**Repository Variables:**

| Variable Name | Value       |
| ------------- | ----------- |
| `AWS_REGION`  | `us-east-1` |

These map exactly to what `deploy.yml` already expects — no workflow changes required.

---

## Phase 7 — First Deployment & Validation

1. **Trigger the deploy** by merging any commit to `main` (or push a no-op commit).

2. **Watch the GitHub Actions run** — the `deploy.yml` job should:
   - Install → lint → build → test → assume OIDC role → `ampx pipeline-deploy`

3. **Watch the Amplify console** — a deployment job should appear under the `main` branch within seconds of the GitHub Actions deploy step completing.

4. **Pre-domain smoke test:** Amplify provides a default URL (`https://main.<app-id>.amplifyapp.com`). Use the raw API Gateway invoke URL as `VITE_DASHBOARD_API_BASE_URL` temporarily to verify the DataGrid loads and the API calls return data before the CORS changes in Phase 8 are live.

5. **Post-domain validation:** Once DNS propagates, the ACM cert is issued, and Phase 8 is complete, verify:
   - `https://dashboard.dev-payments.ustaxcourt.gov` loads the app
   - No mixed-content warnings (all API calls go to `https://`)
   - Browser DevTools Network tab shows requests going to `https://dev-payments.ustaxcourt.gov`
   - No CORS errors in the console

---

## Phase 8 — CORS and Resource Policy Changes in `ustc-payment-portal`

> These are **Terraform changes in the `ustc-payment-portal` repo**, not console toggles. Both must be deployed before the dashboard on its custom domain can call the API.

### 8a — CORS Headers on Dashboard Routes

The payment portal API is a **REST API** (not an HTTP API). REST APIs do not have a single CORS toggle — CORS must be configured per-resource by adding:

- An `OPTIONS` mock integration method on each resource
- `Access-Control-Allow-*` headers in the method response and integration response of both the `OPTIONS` and the actual `GET` methods

The three dashboard resources that need CORS added are:

- `GET /transactions`
- `GET /transactions/{paymentStatus}`
- `GET /transaction-payment-status`

Required response headers on both `OPTIONS` and each `GET`:

```
Access-Control-Allow-Origin:  https://dashboard.dev-payments.ustaxcourt.gov
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

During initial testing from the default Amplify URL, temporarily also allow `https://main.<app-id>.amplifyapp.com`. Remove that origin once the custom domain is confirmed working.

### 8b — API Gateway Resource Policy

The payment portal's API Gateway has a resource policy that restricts access to specific IAM principals. Dashboard calls originate from a user's browser and carry **no AWS credentials** — they will be blocked by the resource policy even though the dashboard routes have `authorization: NONE` at the method level.

A `Allow` statement must be added to the resource policy to permit unauthenticated requests to the dashboard paths:

```json
{
  "Effect": "Allow",
  "Principal": "*",
  "Action": "execute-api:Invoke",
  "Resource": [
    "arn:aws:execute-api:us-east-1:723609007960:<api-id>/dev/GET/transactions",
    "arn:aws:execute-api:us-east-1:723609007960:<api-id>/dev/GET/transactions/*",
    "arn:aws:execute-api:us-east-1:723609007960:<api-id>/dev/GET/transaction-payment-status",
    "arn:aws:execute-api:us-east-1:723609007960:<api-id>/dev/OPTIONS/transactions",
    "arn:aws:execute-api:us-east-1:723609007960:<api-id>/dev/OPTIONS/transactions/*",
    "arn:aws:execute-api:us-east-1:723609007960:<api-id>/dev/OPTIONS/transaction-payment-status"
  ]
}
```

This statement scopes the public allow strictly to the three dashboard endpoints and their `OPTIONS` preflight methods. The SigV4-protected routes (`/init`, `/process`, `/details/*`, `/test`) remain untouched.

---

## Phase 9 — Ongoing Operations

| Concern                          | How it's handled                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **New deployments**              | Push to `main` → GitHub Actions → Amplify auto-deploys                                                             |
| **Environment variable changes** | Update in Amplify console → manually trigger a new build                                                           |
| **PR previews**                  | Re-enable `.github/workflows/ci_preview.yml.disabled` when ready; Amplify will create branch-specific preview URLs |
| **Rollback**                     | Amplify console → select previous deployment → "Redeploy this version"                                             |
| **Certificate renewal**          | ACM auto-renews; no manual action needed as long as the CNAME validation record stays in DNS                       |
| **Access control**               | Amplify supports basic auth password protection per-branch — set under _Branch settings → Access control_          |

---

## Prerequisites Checklist

Before starting Phase 1, confirm you have:

- [ ] AWS console access to the Payment Portal Dev account (`723609007960`) with permissions to create Amplify apps and IAM roles
- [ ] GitHub repo admin access to `ustc-payment-portal-dev-dashboard` (to add secrets/variables)
- [ ] Access to add records to the `dev-payments.ustaxcourt.gov` Route 53 hosted zone, or a PR open against `ustc-payment-portal` to have the payment portal Terraform manage them
- [ ] A PR open or planned against `ustc-payment-portal` for the Phase 8 CORS and resource policy Terraform changes — the dashboard cannot make authenticated API calls until those are deployed (we can include this on the PR with our changes hooking up Knex so that migrations get applied to RDS DB)
