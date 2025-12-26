# Deployment Guide - Vercel

## Domain: ai-signal.thosoft.xyz

### 1. Install Vercel CLI

```bash
pnpm add -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Configure Environment Variables

Trên Vercel Dashboard (https://vercel.com), vào project settings và thêm các Environment Variables sau:

**OpenAI Configuration:**
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

**⚠️ IMPORTANT - OpenAI Model:**
Use `gpt-4o-mini` (recommended) or `gpt-4o` for production

**Application Settings:**
```
NODE_ENV=production
AI_RATE_LIMIT_PER_MINUTE=10
AI_MAX_TOKENS=500
```

**Upstash Redis Configuration:**
```
KV_REST_API_READ_ONLY_TOKEN=AtEOAAIgcDFZPsqQrn-sRhzE8mUyfzk3hvwWrb30mTn97RvyC5Eifw
KV_REST_API_TOKEN=AdEOAAIncDyour_kv_read_only_token
KV_REST_API_TOKEN=your_kv_token
KV_REST_API_URL=https://your-redis-instance.upstash.io
KV_URL=rediss://default:your_token@your-redis-instance.upstash.io:6379
REDIS_URL=rediss://default:your_token@your-redis-instance

### 4. Deploy to Vercel

#### Option A: Deploy from CLI
```bash
# Initial deployment
vercel

# Production deployment
vercel --prod
```

#### Option B: Deploy from GitHub
1. Push code to GitHub repository
2. Import project on Vercel Dashboard
3. Configure environment variables
4. Deploy automatically

### 5. Configure Custom Domain

**Trên Vercel Dashboard:**

1. Vào project settings → Domains
2. Add domain: `ai-signal.thosoft.xyz`
3. Vercel sẽ cung cấp DNS records

**Trên DNS Provider (thosoft.xyz):**

Add các records sau:

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: ai-signal
Value: cname.vercel-dns.com
```

**Option B: A Record**
```
Type: A
Name: ai-signal
Value: 76.76.21.21
```

### 6. Verify Deployment

Sau khi deploy xong, test các endpoints:

```bash
# Health check
curl https://ai-signal.thosoft.xyz/api/health

# Get symbols
curl https://ai-signal.thosoft.xyz/api/symbols?filter=popular

# Get candles
curl https://ai-signal.thosoft.xyz/api/candles?symbol=BTCUSDT&timeframe=15m&limit=100
```

### 7. Environment-specific URLs

- **Production**: https://ai-signal.thosoft.xyz
- **Vercel Preview**: https://ai-signal-binance-[hash].vercel.app

### 8. Deployment Checklist

- [ ] Environment variables configured
- [ ] OpenAI API key valid and has credits
- [ ] Upstash Redis credentials valid
- [ ] Custom domain DNS configured
- [ ] SSL certificate active (automatic via Vercel)
- [ ] Build successful
- [ ] API endpoints working
- [ ] WebSocket connections working
- [ ] AI features functional

### 9. Monitoring & Logs

- **Vercel Dashboard**: Real-time logs and analytics
- **Deployment Logs**: Check build and runtime logs
- **Function Logs**: Monitor serverless function execution
- **Upstash Console**: Monitor Redis usage

### 10. Troubleshooting

**Build Fails:**
- Check Next.js 16.1.1 compatibility
- Verify all dependencies installed
- Check TypeScript errors

**API Errors:**
- Verify environment variables
- Check OpenAI API key validity
- Verify Upstash Redis credentials

**Domain Issues:**
- DNS propagation can take up to 48h
- Use `dig ai-signal.thosoft.xyz` to check DNS
- Verify SSL certificate issued

### 11. Performance Optimization

Vercel configuration in `vercel.json`:
- Region: `sin1` (Singapore - closest to Binance servers)
- Framework: Next.js with automatic optimizations
- Headers: No-cache for API routes (real-time data)

### 12. Cost Estimation

**Vercel Pro Plan:**
- ~$20/month
- 100GB bandwidth
- Unlimited deployments
- Custom domains

**Upstash Redis:**
- Current: Free tier
- Upgrade if needed: ~$0.20/100K commands

**OpenAI API:**
- gpt-4o-mini: ~$0.15/$0.60 per 1M tokens (input/output)
- Estimate: ~$5-10/month for moderate usage

---

## Quick Deploy Script

```bash
#!/bin/bash

# Deploy to Vercel
echo "Deploying to Vercel..."

# Build locally first to catch errors
pnpm build

# Deploy to production
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Visit: https://ai-signal.thosoft.xyz"
```

Save as `deploy.sh` and run:
```bash
chmod +x deploy.sh
./deploy.sh
```
