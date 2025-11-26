# Deploy NOVA AI ke Render ✨

## Step-by-Step Guide

### 1️⃣ Siapkan GitHub Repository
```bash
# Jika belum push ke GitHub:
git init
git add .
git commit -m "Initial NOVA AI deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nova-ai.git
git push -u origin main
```

### 2️⃣ Buat Render Account
- Buka: https://render.com
- Sign up dengan GitHub account
- Connect GitHub repository

### 3️⃣ Deploy di Render
1. Klik **"New"** → **"Web Service"**
2. Pilih repository: `nova-ai`
3. Set konfigurasi:
   - **Name**: `nova-ai`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (atau Starter jika mau performa lebih baik)

### 4️⃣ Setup Database
1. Di Render dashboard, klik **"New"** → **"PostgreSQL"**
2. Set:
   - **Name**: `nova-postgres`
   - **Database**: `nova_db`
   - **User**: `postgres`
   - **Plan**: Free
3. Salin **Internal Database URL** (akan dipakai otomatis oleh render.yaml)

### 5️⃣ Setup Environment Variables
Di Render Web Service settings, tambah di "Environment":

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgres://user:pass@host:port/nova_db
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
SESSION_SECRET=generate_random_string_here
```

**Cara generate SESSION_SECRET**:
```bash
# Di terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6️⃣ Dapatkan API Keys

#### Google Gemini (GRATIS!)
1. Buka: https://aistudio.google.com/app/apikey
2. Klik **"Create API Key"**
3. Copy key → paste ke `GEMINI_API_KEY`

#### OpenAI (Opsional - untuk image generation)
1. Buka: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy key → paste ke `OPENAI_API_KEY`

### 7️⃣ Deploy!
- Klik **"Create Web Service"**
- Render akan otomatis:
  - Build app (`npm run build`)
  - Setup database
  - Deploy & serve di `https://nova-ai.onrender.com`

### ⚡ Tips
- **First deploy**: Bisa ambil 5-10 menit (building & setup)
- **Free tier**: Auto-pause setelah 15 menit inaktif
- **Upgrade**: Ke Starter ($7/bulan) untuk always-on
- **Custom domain**: Bisa ditambah di Render settings
- **Auto-deploy**: Setiap push ke GitHub, Render otomatis rebuild & deploy

### 🔗 Hasil
App akan live di: `https://nova-ai.onrender.com`
Database akan auto-connected via DATABASE_URL

### Troubleshoot

**"Build failed"**
```bash
# Check logs di Render dashboard
# Pastikan package.json & tsconfig valid
npm run build  # test locally dulu
```

**"Database connection error"**
- Verify DATABASE_URL di environment variables
- Pastikan PostgreSQL service sudah running
- Check database name: `nova_db`

**"Ports not matching"**
- Render uses PORT env var
- App sudah set ke `:5000` → OK
- Jangan hardcode port!

---

**Questions?** Check Render docs: https://render.com/docs
