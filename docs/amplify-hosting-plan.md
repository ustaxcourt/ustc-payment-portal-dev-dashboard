# Amplify Hosting Plan: USTC Payment Portal Dev Dashboard
**Still needs human review and comparison against the PAY-053 branch in ustc-payment-portL**
**Remove plan before merge**

**Target:** `dashboard.dev-payments.ustaxcourt.gov`
**API Target:** `dev-payments.ustaxcourt.gov` (ustc-payment-portal)
**AWS Account:** USTC Payment Portal Dev

---

## Phase 1 — Create the Amplify App in AWS

> Do this in the **Payment Portal Dev** AWS account.

1. **Open the Amplify console** → select your target region (match wherever the payment portal API lives).

2. **Create a new app** → "Host web app" → connect to your GitHub repo (`ustc-payment-portal-dev-dashboard`).
   - Select the `main` branch as the production branch.
   - Amplify will detect `amplify.yml` automatically — do **not** let it overwrite it.

3. **Note the App ID** that Amplify assigns (e.g. `d1abc123xyz`). You'll need this for GitHub secrets.

4. **Review the build settings** — Amplify should pick up `amplify.yml` verbatim:
   ```yaml
   preBuild: npm ci + npm run lint
   build: npm run build
   artifacts baseDirectory: dist
   ```
   Confirm `dist` is the artifact root before saving.

5. **Disable automatic branch deployments** on everything except `main` unless you intend to use PR previews. Under *App settings → General → Branch autodetect*, restrict it to `main`.

---

## Phase 2 — IAM: OIDC Trust for GitHub Actions

The existing `deploy.yml` already uses OIDC. You need an IAM role in the Payment Portal Dev account that GitHub Actions can assume.

1. **Create an OIDC Identity Provider** (if not already present):
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

2. **Create an IAM Role** (e.g. `github-actions-amplify-deploy`) with:

   **Trust Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": {
         "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
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
     }]
   }
   ```
   Replace `ustaxcourt/ustc-payment-portal-dev-dashboard` with the actual org/repo path.

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

3. **Copy the Role ARN** — it goes into GitHub secrets in Phase 5.

---

## Phase 3 — Set Environment Variables in Amplify

The dashboard has one runtime env var: `VITE_DASHBOARD_API_BASE_URL`. Vite bakes this into the bundle at **build time**, so it must be set in Amplify's build environment, not at runtime.

1. In the Amplify console → your app → **Environment variables**.
2. Add:

   | Key | Value |
   |-----|-------|
   | `VITE_DASHBOARD_API_BASE_URL` | `https://dev-payments.ustaxcourt.gov` |

   This will be the final value once the API custom domain is live. Until then, use the raw API Gateway/ALB URL (e.g. `https://xyz.execute-api.us-east-1.amazonaws.com/dev`) as a temporary value.

3. Set the **branch** scope to `main`.

> **Important:** Because Vite embeds this at build time, any URL change requires a new deployment. Do not expect it to be overrideable at runtime.

---

## Phase 4 — Custom Domain Setup in Amplify

1. In Amplify → your app → **Domain management** → **Add domain**.

2. Enter `dev-payments.ustaxcourt.gov` as the root domain.

3. **Configure subdomains:**

   | Subdomain | Branch |
   |-----------|--------|
   | `dashboard.dev-payments.ustaxcourt.gov` | `main` |

   > Alternatively, if the dashboard should be at the apex (`dev-payments.ustaxcourt.gov`), configure it directly — but a named subdomain like `dashboard` is safer since the API also lives under this domain.

4. Amplify will provision an **ACM certificate** for the domain automatically. It will output a set of **CNAME records** you must add to DNS to prove domain ownership and enable certificate issuance.

5. Amplify will also output a **CloudFront CNAME target** (e.g. `d1abc123xyz.cloudfront.net`) for the actual traffic routing record.

**Do not proceed to DNS until Amplify has generated both the validation CNAME and the CloudFront CNAME.**

---

## Phase 5 — DNS Configuration

> This requires access to whoever manages the `ustaxcourt.gov` DNS zone (likely Route 53 in a separate account or an external registrar).

You'll need to add **three records** total:

### A) ACM Certificate Validation (temporary — can be removed after cert is issued)

```
Type:  CNAME
Name:  _<amplify-generated-token>.dashboard.dev-payments.ustaxcourt.gov
Value: _<amplify-generated-value>.acm-validations.aws
TTL:   300
```

Amplify shows the exact name/value in the Domain management console.

### B) Dashboard routing record (permanent)

```
Type:  CNAME
Name:  dashboard.dev-payments.ustaxcourt.gov
Value: <your-amplify-cloudfront-url>.cloudfront.net
TTL:   300
```

### C) API routing record (coordinate with the payment portal API team)

```
Type:  CNAME  (or ALIAS if using Route 53 + ALB/API Gateway)
Name:  dev-payments.ustaxcourt.gov
Value: <payment-portal-api-alb-or-apigw-url>
TTL:   300
```

> **If the DNS zone is in a different AWS account:** open a ticket or coordinate with the infrastructure/platform team to add these. Do not add them yourself unless you have delegated authority over this zone.

> **ACM cert propagation** typically takes 5–30 minutes after the CNAME validation record is live. Amplify's Domain management page will show "Pending verification" → "Available".

---

## Phase 6 — GitHub Repo Secrets & Variables

In the GitHub repo settings → **Secrets and variables → Actions**:

**Repository Secrets:**

| Secret Name | Value |
|-------------|-------|
| `AWS_ROLE_TO_ASSUME` | `arn:aws:iam::<ACCOUNT_ID>:role/github-actions-amplify-deploy` |
| `AMPLIFY_APP_ID` | `<amplify-app-id-from-phase-1>` |

**Repository Variables:**

| Variable Name | Value |
|---------------|-------|
| `AWS_REGION` | `us-east-1` (or whichever region the Amplify app is in) |

These map exactly to what `deploy.yml` already expects — no workflow changes required.

---

## Phase 7 — First Deployment & Validation

1. **Trigger the deploy** by merging any commit to `main` (or push a no-op commit).

2. **Watch the GitHub Actions run** — the `deploy.yml` job should:
   - Install → lint → build → test → assume OIDC role → `ampx pipeline-deploy`

3. **Watch the Amplify console** — you should see a deployment job appear under the `main` branch within seconds of the GitHub Actions deploy step completing.

4. **Pre-domain validation:** Once deployed, Amplify provides a default URL (`https://main.<app-id>.amplifyapp.com`). Smoke test the dashboard here first — verify the DataGrid loads, the API calls hit the right base URL, and no console errors appear.

5. **Post-domain validation:** Once DNS propagates and the ACM cert is issued, verify:
   - `https://dashboard.dev-payments.ustaxcourt.gov` loads the app
   - No mixed-content warnings (all API calls go to `https://`)
   - Browser DevTools Network tab shows requests going to `https://dev-payments.ustaxcourt.gov`

---

## Phase 8 — CORS Configuration on the API

Once the dashboard is on a real domain, the API (ustc-payment-portal) must allow requests from it. Coordinate with the API team to ensure:

```
Access-Control-Allow-Origin: https://dashboard.dev-payments.ustaxcourt.gov
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

If the API uses API Gateway, this is configured in the API Gateway CORS settings or in the Lambda response headers. If it uses an ALB + Express/Node, it's in the `cors` middleware config.

During initial testing from the default Amplify URL (`main.<app-id>.amplifyapp.com`), the API will need to temporarily allow that origin as well.

---

## Phase 9 — Ongoing Operations

| Concern | How it's handled |
|---------|-----------------|
| **New deployments** | Push to `main` → GitHub Actions → Amplify auto-deploys |
| **Environment variable changes** | Update in Amplify console → manually trigger a new build |
| **PR previews** | Re-enable `.github/workflows/ci_preview.yml.disabled` when ready; Amplify will create branch-specific preview URLs |
| **Rollback** | Amplify console → select previous deployment → "Redeploy this version" |
| **Certificate renewal** | ACM auto-renews; no manual action needed as long as the CNAME validation record stays in DNS |
| **Access control** | Amplify supports basic auth password protection per-branch (useful for dev/staging) — set under *Branch settings → Access control* |

---

## Prerequisites Checklist

Before starting Phase 1, confirm you have:

- [ ] AWS console access to the **Payment Portal Dev** account with permissions to create Amplify apps and IAM roles
- [ ] GitHub repo admin access (to add secrets/variables)
- [ ] DNS write access to the `ustaxcourt.gov` zone (or a point of contact who does)
- [ ] Confirmation of the final API subdomain from the payment portal team (`dev-payments.ustaxcourt.gov` or otherwise)
- [ ] Confirmation of the AWS region to deploy into (must match the API's region to minimize latency and simplify networking)
