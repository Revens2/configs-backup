---
name: deploy
description: >
  Deploy a project to one of Juliann's VPS (VPS Etude or VPS IA) using Docker, Nginx reverse proxy, and SSL/TLS domain configuration.
  Use when the user asks to deploy a app, container, service, or repository to a VPS, or invokes /deploy.
---

# Deploy Skill — VPS Deployment Automation

This skill automates the deployment of local web applications or services to Juliann's VPS infrastructure using SSH, Docker Compose, Nginx, and Certbot.

---

## 1. Vault & Infrastructure Reference (Source of Truth)

Before taking action, retrieve host information from Obsidian Vault if needed:
- **Location**: `G:\Mon Drive\Obsidian Vault\raw\assets\`
- **Known VPS Instances**:
  - **VPS Etude**: `100.76.252.77` (SSH key: `C:\Users\Juliann\.ssh\id_ed25519_juliann`, user: `juliann` or `ludo`)
  - **VPS IA**: `100.99.75.104` (SSH key: `C:\Users\Juliann\.ssh\id_ed25519_juliann`, user: `oui` / `juliann`)

---

## 2. Step-by-Step Deployment Workflow

When the user requests to deploy a project to a VPS:

### Step 1: Identify Target VPS, Domain & User Account
1. Confirm the target VPS (e.g. **VPS Etude** or **VPS IA**).
2. Confirm the destination user account (`juliann` by default) and directory on the VPS (e.g., `/home/juliann/<project_name>`).
3. Identify the domain name (e.g., `<project>-vps.duckdns.org` or custom domain).

### Step 2: Prepare Remote Directory & Transfer Files
1. Ensure Tailscale VPN is connected (`& 'C:\Program Files\Tailscale\tailscale.exe' up` if SSH fails).
2. Create remote directory:
   ```bash
   ssh -i "C:\Users\Juliann\.ssh\id_ed25519_juliann" <user>@<vps_ip> "mkdir -p /home/<user>/<project>"
   ```
3. Transfer project source files using `scp` or `rsync` (including `.env` and `docker-compose.yml`).
   *Note: Ensure all subdirectories (like `frontend/src`, `scripts`, etc.) and hidden files (`.env`) are copied.*

### Step 3: Configure Environment Variables
1. Verify `/home/<user>/<project>/.env` on the VPS.
2. Update `PUBLIC_URL` or domain references to the target domain:
   ```bash
   PUBLIC_URL=https://<domain_name>
   ```

### Step 4: Build & Launch Docker Containers
1. Run Docker Compose on the VPS:
   ```bash
   ssh -i "C:\Users\Juliann\.ssh\id_ed25519_juliann" <user>@<vps_ip> "cd /home/<user>/<project> && docker compose up -d --build"
   ```
2. Verify container health & logs:
   ```bash
   ssh -i "C:\Users\Juliann\.ssh\id_ed25519_juliann" <user>@<vps_ip> "docker ps"
   ```

### Step 5: Configure Nginx Reverse Proxy & SSL (Certbot)
1. Create Nginx site configuration (`/etc/nginx/sites-available/<project>`):
   ```nginx
   server {
       listen 80;
       server_name <domain_name>;

       location / {
           proxy_pass http://127.0.0.1:<web_port>;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
2. Enable site and test Nginx:
   ```bash
   sudo ln -sf /etc/nginx/sites-available/<project> /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. Generate SSL/TLS Certificate with Certbot:
   ```bash
   sudo certbot --nginx -d <domain_name> --non-interactive --agree-tos -m juliann.ecom@gmail.com
   ```

### Step 6: Empirical Verification & Documentation
1. Test public availability using `read_url_content` or `curl`:
   - Verify HTTP status code (200 OK).
   - Test API health endpoint (e.g., `https://<domain_name>/api/health`).
2. Log intervention in the corresponding VPS documentation file:
   - For VPS Etude: `G:\Mon Drive\VPS ETUDE\CLAUDE.md` and `GEMINI.md`.
