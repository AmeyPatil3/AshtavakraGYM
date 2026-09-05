# Ashtavakra Hostel Gym — Production Deployment Guide

This guide provides step-by-step instructions for deploying the **Ashtavakra Hostel Gym Slot Reservation & Attendance System** to production for **1,000–1,200 active student users**.

- **Repository**: [https://github.com/AmeyPatil3/AshtavakraGYM.git](https://github.com/AmeyPatil3/AshtavakraGYM.git)
- **Tech Stack**: Next.js 16.3.4 (App Router), React 19, Prisma ORM, PostgreSQL, Tailwind CSS v4

---

## 1. Production Database Setup (Managed PostgreSQL)

For high-concurrency slot booking during peak times, use a managed **PostgreSQL** instance to prevent file-locking bottlenecks.

1. Create a free managed database at **[Neon.tech](https://neon.tech/)** or **[Supabase.com](https://supabase.com/)**.
2. Name your database: `ashtavakra_gym`.
1. Your Supabase PostgreSQL Project Connection String:
   ```env
   postgresql://postgres:[YOUR-PASSWORD]@db.dyhjgrliagaavizqpwvz.supabase.co:5432/postgres
   ```

---

## 2. Environment Variables Configuration

Copy the sample environment template or set these environment variables in your hosting provider:

```env
# Node Environment
NODE_ENV="production"

# Production Supabase PostgreSQL Connection Pooler URL (Port 6543 for Vercel Serverless)
DATABASE_URL="postgresql://postgres.hhoupkqtszydiciovyqu:Ashtavakra2026@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Production Supabase Direct Connection URL (Port 5432)
DIRECT_URL="postgresql://postgres:Ashtavakra2026@db.hhoupkqtszydiciovyqu.supabase.co:5432/postgres?sslmode=require"

# Cryptographically Generated 64-character JWT Secret Key
JWT_SECRET="db7c6f06940370bf43af9798069834d5bf5a0374e546cb4ef351379439d47ef5"

# Organizational Email Domain Lock
ALLOWED_DOMAINS="somaiya.edu"

# Production Admin Credentials
ADMIN_EMAIL="admin@somaiya.edu"
ADMIN_INITIAL_PASSWORD="Admin@123"

# Optional: Feature Toggle for Google Auth (Default: false)
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH="false"
```

---

## 3. Deploying to Vercel (Recommended - Serverless Cloud)

Vercel provides zero-maintenance, automated SSL, and high-performance serverless deployment.

### Step-by-Step Vercel Deployment:
1. Log in to [Vercel.com](https://vercel.com/) using your GitHub account.
2. Click **Add New Project**.
3. Select the repository: **`AmeyPatil3/AshtavakraGYM`**.
4. In **Build and Output Settings**, set:
   - **Build Command**:
     ```bash
     npx prisma migrate deploy && npx tsx prisma/seed.ts && npm run build
     ```
5. Expand **Environment Variables** and add all variables from **Section 2**:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ALLOWED_DOMAINS`
   - `ADMIN_EMAIL`
   - `ADMIN_INITIAL_PASSWORD`
6. Click **Deploy**.
7. Vercel will compile the application and issue a free production HTTPS domain (e.g., `https://ashtavakragym.vercel.app`).

---

## 4. Deploying to Self-Hosted Ubuntu VPS (On-Premise Server)

If hosting on Somaiya University on-premise Linux servers:

### Step 1: Install Server Dependencies
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

### Step 2: Clone & Build Repository
```bash
cd /var/www
sudo git clone https://github.com/AmeyPatil3/AshtavakraGYM.git
cd AshtavakraGYM

# Install dependencies and build
npm ci
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run build
```

### Step 3: Start Application with PM2 Cluster Mode
```bash
pm2 start npm --name "ashtavakra-gym" -i 2 -- start
pm2 save
pm2 startup
```

### Step 4: Configure Nginx & SSL Certificate
Create `/etc/nginx/sites-available/gym.somaiya.edu`:

```nginx
server {
    listen 80;
    server_name gym.somaiya.edu;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable Nginx site & SSL:
```bash
sudo ln -s /etc/nginx/sites-available/gym.somaiya.edu /etc/nginx/sites-enabled/
sudo systemctl restart nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d gym.somaiya.edu
```

---

## 5. Automated Daily Slot Generator (Cron Job)

Operating slots for Monday to Saturday (06:00-09:00 AM & 16:00-21:00 PM, Capacity 25) generate automatically. Set up a daily cron job to run every midnight at **00:05 AM (IST)**:

### Vercel Cron or External Cron-Job.org Setup:
- **URL**: `https://gym.somaiya.edu/api/admin/slots`
- **Schedule**: `5 0 * * *` (Daily at 00:05 AM)

---

## 6. Verifying Production Admin Access

1. Open your live URL (e.g., `https://ashtavakragym.vercel.app/login` or `https://gym.somaiya.edu/login`).
2. Log in with the dedicated Admin credentials:
   - **Email**: `admin@somaiya.edu`
   - **Password**: `Admin@123`
3. Access the **Admin Control Center**:
   - Mark attendance dynamically with 1 click.
   - Configure dynamic slot capacity.
   - View calendar-filtered analytics.
   - Export CSV attendance logs for hostel warden filing.
