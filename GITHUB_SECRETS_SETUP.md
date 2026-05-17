# GitHub Actions Secrets Setup

The CI/CD pipeline injects credentials into Kubernetes Secrets via GitHub Actions. **All six secrets must be set**, or the application will fail to start or login will fail silently.

## Required Secrets

Add these to **Settings → Secrets and variables → Actions** in your GitHub repository:

| Secret Name | Example Value | Notes |
|---|---|---|
| `AUTH_DEMO_EMAIL` | `admin@church.org` | Org admin demo login email |
| `AUTH_DEMO_PASSWORD` | `changeme` | Org admin demo login password (change this!) |
| `AUTH_PLATFORM_EMAIL` | `root@etithe.io` | Platform (root) admin email |
| `AUTH_PLATFORM_PASSWORD` | `platformdev` | Platform admin password (change this!) |
| `DATABASE_URL_PRIMARY` | `postgresql://user:pass@rds-us-east-1.xxx:5432/etithe` | RDS endpoint for us-east-1 cluster |
| `DATABASE_URL_SECONDARY` | `postgresql://user:pass@rds-us-west-2.xxx:5432/etithe` | RDS endpoint for us-west-2 cluster |

## Troubleshooting Login Failures

### Symptom: Login appears to work but dashboard shows nothing / redirects

This typically means:
- `AUTH_DEMO_PASSWORD` is set and matches (auth passes)
- But `DATABASE_URL_*` is empty or invalid (DB queries fail silently)
- The app falls back to demo/hardcoded behavior

**Fix: Verify `DATABASE_URL_PRIMARY` and `DATABASE_URL_SECONDARY` are set in GitHub secrets.**

Check the Pod's actual env vars:
```bash
kubectl exec -n etithe <pod-name> -- env | grep -i auth
kubectl exec -n etithe <pod-name> -- env | grep DATABASE_URL
```

If `DATABASE_URL` is empty, the pipeline validation didn't catch the missing secret. Add `DATABASE_URL_PRIMARY` and `DATABASE_URL_SECONDARY` to GitHub secrets and redeploy.

### Symptom: "Invalid email or password"

1. **Verify `AUTH_DEMO_PASSWORD` is set correctly** in GitHub secrets
2. Check the deployed Pod's env vars:
   ```bash
   kubectl exec -n etithe <pod-name> -- env | grep AUTH_DEMO_PASSWORD
   ```
3. If it shows as empty, re-add the secret in GitHub and redeploy
4. If it's set to a value, use that exact value to login (not what you *think* you set)

## Pod Startup Failures

If Pods fail to start with CrashLoopBackOff:

1. Check Pod logs:
   ```bash
   kubectl -n etithe logs <pod-name>
   ```
2. If you see "Error: connect ECONNREFUSED", the `DATABASE_URL_*` secret is likely invalid or missing
3. Verify the RDS endpoint is reachable from the cluster and the connection string is correct

## Rotating Secrets

To rotate a credential (e.g., `AUTH_DEMO_PASSWORD`):

1. Update the secret in GitHub
2. The pipeline will automatically update the Kubernetes Secret on the next deploy
3. Existing sessions (cookies) will remain valid until they expire
4. New logins will use the new password immediately

## Pipeline Flow

1. **Pipeline builds and pushes image** → no secrets needed
2. **Deploy job creates/updates Kubernetes Secrets** using `kubectl create secret generic ... --dry-run=client -o yaml | kubectl apply -f -`
3. **Pod starts and mounts Secrets as env vars** via `secretKeyRef`
4. **Application uses env vars** at runtime via `process.env.AUTH_DEMO_PASSWORD`, etc.

If any secret is missing at step 2, the Kubernetes Secret is created with an empty value, and step 4 fails silently (the application sees an empty string).
