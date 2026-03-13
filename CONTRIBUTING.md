# Contributing to USTC Payment Portal Dev Dashboard

Thank you for contributing!
This document explains how to work locally and how to contribute using **AWS Amplify Gen 2**, including **Sandbox**, **PR Preview deployments**, and **main-branch deployments**.

***

# **1. Local Development**

This project uses:

*   **Node.js 24+**
*   **Vite**
*   **TypeScript**
*   **AWS Amplify Gen 2 Backend** (AppSync, Cognito, DynamoDB, Lambdas, etc.)

## **1.1. Clone the Repository**

```bash
git clone https://github.com/ustaxcourt/ustc-payment-portal-dev-dashboard.git
cd ustc-payment-portal-dev-dashboard
```

## **1.2. Install Dependencies**

```bash
npm ci
```

## **1.3. Run Locally**

Start the Vite dev server:

```bash
npm run dev
```

This launches the frontend (only). Backend features require running the Amplify **Sandbox** (see below).

***

# **2. Contributing with Amplify Sandbox**

Amplify **Sandbox** gives you a temporary, isolated backend environment for development.
This is ideal when you need to test backend changes **without deploying** or affecting shared environments.
Sandbox automatically watches the `amplify/` directory. [\[github.com\]](https://github.com/aws-amplify/amplify-cli/issues/2645)

## **2.1. Start Sandbox**

```bash
npx ampx sandbox
```

Sandbox will:

*   Deploy a temporary backend environment into AWS
*   Watch all changes inside your `amplify/` folder
*   Re-deploy backend changes automatically
*   Produce `amplify_outputs.json` for your local frontend to use

Sandbox resources follow naming patterns like:

    amplify-<app>-<username>-sandbox-xxxx

 [\[docs.amplify.aws\]](https://docs.amplify.aws/react/reference/amplify_outputs/)

## **2.2. Stop Sandbox**

Press:

    Ctrl + C

## **2.3. Delete Sandbox Resources**

When you're done:

```bash
npx ampx sandbox delete
```

This removes **all** temporary sandbox CloudFormation stacks/resources.    [\[docs.amplify.aws\]](https://docs.amplify.aws/react/reference/amplify_outputs/)

***

# **3. Git Workflow**

We follow a standard PR-based workflow:

1.  Create a feature branch:

    ```bash
    git checkout -b feat/ISSUE-ID-your-feature
    ```

2.  Commit changes:

    ```bash
    git commit -am "ISSUE-ID: description"
    ```

3.  Push and open a Pull Request.

***

# **4. PR Preview Deployments (Frontend + Backend)**

Every Pull Request automatically gets:

*   A **preview backend environment** (via `npx ampx pipeline-deploy`)
*   A **preview frontend deployment** through **Amplify Hosting PR Previews**
*   A unique preview URL based on the branch name (e.g.,
    `https://feat-pay-053-add-amplify.<APP-ID>.amplifyapp.com`)

### How it works

*   GitHub Actions runs `ci_preview.yml`
*   AWS OIDC authenticates GitHub to AWS
*   The workflow:
    *   Installs dependencies
    *   Runs lint, typecheck, build, and Cypress tests
    *   Creates the Amplify branch if it does not exist
    *   Deploys backend via `npx ampx pipeline-deploy`
        (custom pipelines are designed for CI deployments) [\[zenn.dev\]](https://zenn.dev/ncdc/articles/8da04fbca4105e?locale=en)
    *   Amplify Hosting builds and deploys the **frontend** automatically
        (Hosting uses S3 + CloudFront) [\[stackoverflow.com\]](https://stackoverflow.com/questions/74069647/how-to-use-a-single-amplify-backend-for-multiple-apps-in-a-mono-repo)

### PR Cleanup

When PRs are closed, Amplify Hosting can automatically remove preview frontend environments if **auto-disconnect** is enabled.
Backends can optionally be cleaned up using a GitHub Actions cleanup workflow.

***

# **5. Deploying to `main` (Production / Stable Environment)**

Merging to `main` triggers `deploy.yml`, which:

1.  Builds + tests locally (lint, typecheck, build, Cypress)
2.  Assumes the AWS IAM OIDC role
3.  Ensures the Amplify branch `main` exists
4.  Runs:

```bash
npx ampx pipeline-deploy --branch main --app-id <APP-ID>
```

According to Amplify’s custom pipeline documentation, this deploys backend updates using Amplify Gen 2’s CDK‑powered deployment engine.    [\[stackoverflow.com\]](https://stackoverflow.com/questions/78158703/how-do-i-set-node-options-in-amplify-yaml)

The frontend is built & deployed by **Amplify Hosting**, which handles:

*   S3 upload
*   CloudFront CDN invalidation
*   Production URL hosting    [\[stackoverflow.com\]](https://stackoverflow.com/questions/74069647/how-to-use-a-single-amplify-backend-for-multiple-apps-in-a-mono-repo)

***

# **6. Amplify Architecture Summary**

| Component           | How it Deploys                                                             |
| ------------------- | -------------------------------------------------------------------------- |
| **Backend**         | `npx ampx sandbox` (local), or `npx ampx pipeline-deploy` (CI)             |
| **Frontend (SPA)**  | Must be deployed using **Amplify Hosting** (repo connection or webhook)    |
| **PR Previews**     | Backend via custom pipeline, frontend via Amplify Hosting Preview branches |
| **Main Deployment** | Backend via pipeline-deploy, frontend via Hosting on GitHub commits        |

Amplify Hosting supports full frontend deploy flows (build, upload, CDN) for SPA apps.

Amplify Gen 2 supports fullstack branch environments via custom CI pipelines.    [\[stackoverflow.com\]](https://stackoverflow.com/questions/74069647/how-to-use-a-single-amplify-backend-for-multiple-apps-in-a-mono-repo) [\[docs.aws.amazon.com\]](https://docs.aws.amazon.com/amplify/latest/userguide/yml-specification-syntax.html)

***

# **7. Code Style & Quality**

Before pushing changes, run:

```bash
npm run lint       # ESLint
npm run tsc        # Type-checking
npm run build      # Production build
npm run test:e2e   # Cypress tests
```

Your PR will run these automatically in CI.
