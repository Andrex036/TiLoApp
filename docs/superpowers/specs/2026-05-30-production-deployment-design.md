# TiLoApp Production Deployment Design
**Date:** 2026-05-30  
**Status:** Approved  
**Scope:** Complete puesta en línea con backend persistente

---

## 1. Context & Goals

**Current State:**
- React + Vite SPA with localStorage persistence
- All testing completed
- GitHub repo ready
- No authentication required
- Shared data model (all users see same data)

**Goals:**
- Deploy to production with persistent PostgreSQL database
- Automatic CI/CD pipeline
- Professional architecture suitable for real end-users
- Pragmatic implementation without over-engineering

**Success Criteria:**
- App accessible at `tiloapp.vercel.app` (or custom domain)
- All data persisted in Vercel Postgres
- Automatic deployment on every push to main
- Sub-2s page load time
- Zero data loss on redeploy

---

## 2. Architecture

### 2.1 Infrastructure Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Frontend** | Vercel | Auto-deploy from GitHub, edge optimization, built-in analytics |
| **Backend** | Vercel Edge Functions (API Routes) | Serverless, no ops overhead, integrated with frontend |
| **Database** | Vercel Postgres | Managed PostgreSQL, free tier generous, automatic backups |
| **CI/CD** | GitHub → Vercel | Native integration, preview deployments on every PR |
| **Auth** | None | Shared data model, no user isolation needed |

### 2.2 Data Flow

```
User Browser
    ↓ (fetch)
Vercel Edge Function
    ↓ (query)
Vercel Postgres
    ↑ (response)
Returns JSON
    ↓ (update UI)
React Component
```

### 2.3 API Routes

Three main endpoints, replacing current localStorage calls:

**POST /api/cases** — Create/update case  
**GET /api/cases** — Fetch all cases  
**DELETE /api/cases/[id]** — Delete case

**POST /api/activities** — Create/update activity  
**GET /api/activities** — Fetch activities for case  
**DELETE /api/activities/[id]** — Delete activity

**POST /api/alerts** — Create alert  
**GET /api/alerts** — Fetch alerts  
**DELETE /api/alerts/[id]** — Delete alert

Each route implements:
- Input validation
- Error handling (returns JSON with status)
- CORS headers if needed
- Request/response logging for debugging

---

## 3. Implementation Phases

### Phase 1: Infrastructure Setup (1-2 hours)
1. Connect GitHub repo to Vercel account
2. Create Vercel Postgres database
3. Define database schema (cases, activities, alerts tables)
4. Create initial data migration script
5. Deploy skeleton (frontend only) to verify connectivity

### Phase 2: Backend API Implementation (2-3 hours)
1. Create `/api/cases`, `/api/activities`, `/api/alerts` routes
2. Implement CRUD operations for each resource
3. Add error handling and validation
4. Test locally with `vercel dev`
5. Create Postman/curl test collection

### Phase 3: Frontend Integration (2-3 hours)
1. Replace localStorage calls with fetch() to API routes
2. Update service layer (caseService, activityService, alertService)
3. Handle loading/error states in UI
4. Test all flows in development environment
5. Verify data persistence across page reloads

### Phase 4: Pre-Production Verification (1 hour)
1. Run full test suite
2. Test on Vercel preview deployment
3. Verify database backups are enabled
4. Check environment variable configuration
5. Review error logging setup

### Phase 5: Production Deployment (30 min)
1. Final push to main branch
2. Verify Vercel deployment completes successfully
3. Smoke test all major flows in production
4. Monitor for errors in first hour
5. Document any issues

---

## 4. Database Schema

### cases table
```sql
CREATE TABLE cases (
  id TEXT PRIMARY KEY,
  identificacion TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  tipoCaso TEXT,
  estado TEXT DEFAULT 'Activo',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### activities table
```sql
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  caseId TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### alerts table
```sql
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  caseId TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  prioridad TEXT,
  mensaje TEXT,
  activo BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

**Key Features:**
- Foreign key constraints with cascading delete
- Timestamps for audit trail
- Simple indexing on frequently queried fields

---

## 5. Frontend Integration Pattern

### Before (localStorage):
```javascript
// src/services/caseService.js
const caseService = {
  getCases: () => readData('tilo_cases') || []
};
```

### After (API):
```javascript
// src/services/caseService.js
const caseService = {
  getCases: async () => {
    const res = await fetch('/api/cases');
    if (!res.ok) throw new Error('Failed to fetch cases');
    return res.json();
  }
};
```

### Components handle async:
```javascript
const [cases, setCases] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  caseService.getCases()
    .then(setCases)
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
}, []);

if (loading) return <Spinner />;
return <CaseList cases={cases} />;
```

---

## 6. Deployment & Operations

### Continuous Integration
- Every push to main → Vercel auto-deploys
- Every PR → Vercel creates preview deployment
- Automatic rollback on build failure

### Environment Variables
```
DATABASE_URL=postgres://[connection-string]
NODE_ENV=production
```

Managed in Vercel Settings → Environment Variables

### Monitoring & Observability
- **Error tracking:** Vercel logs (built-in)
- **Performance:** Vercel Analytics (built-in)
- **Database backups:** Automatic daily (Vercel Postgres)
- **Status page:** vercel.com/status

### Rollback Strategy
If production breaks:
1. Identify issue in Vercel logs
2. Fix code locally
3. Push to main
4. Vercel auto-redeploys (typically < 1 min)

If database corruption:
- Vercel maintains automatic daily backups
- Manual restore available in Vercel console

---

## 7. Performance & Scalability

### Current Load Assumptions
- Typical user: 10-50 cases with 5-20 activities each
- Peak concurrent users: ~100
- Data size: < 100MB

### Vercel Postgres Limits (Free Tier)
- Storage: 256MB ✓ (plenty)
- Connections: 50 ✓ (sufficient for 100 users)
- Queries: Unlimited

### If you outgrow free tier (future):
- Upgrade to paid plan (pay-as-you-go)
- No code changes required
- Automatic scaling

---

## 8. Security Considerations

### Current Scope
- No authentication → no login compromise risk
- All data is shared/public → no data isolation needed
- No sensitive PII → reasonable for educational project

### Best Practices Implemented
- [x] Input validation on all API routes
- [x] CORS headers configured
- [x] Environment variables for secrets
- [x] Database connection pooling (Vercel handles)
- [x] HTTPS everywhere (Vercel default)

### Out of Scope (for now)
- Row-level security (not needed without auth)
- Rate limiting (can add if needed)
- API key authentication (not needed for shared data)

---

## 9. Timeline & Effort

| Phase | Duration | Effort |
|-------|----------|--------|
| Infrastructure Setup | 1-2h | Low |
| Backend API | 2-3h | Medium |
| Frontend Integration | 2-3h | Medium |
| Verification | 1h | Low |
| Deployment | 0.5h | Low |
| **Total** | **6-8h** | **Medium** |

**Feasible in:** 1-2 days of focused development

---

## 10. Success Metrics

After deployment, verify:
- ✓ App loads in < 2 seconds
- ✓ All CRUD operations work end-to-end
- ✓ Data persists after page reload
- ✓ No errors in Vercel logs after 1 hour
- ✓ Database contains expected data
- ✓ Can scale to 100+ concurrent users

---

## 11. Known Constraints & Tradeoffs

| Constraint | Impact | Mitigation |
|-----------|--------|-----------|
| No authentication | All users see same data | By design; revisit if needed |
| Serverless (edge functions) | Cold starts on low traffic | Negligible for this scale |
| 256MB free database | Limited if data grows 10x | Upgrade tier when needed |
| No advanced caching | Every page load hits DB | Vercel caches aggressively; sufficient |

---

## 12. Future Enhancements

Not in scope now, but designed to support:
- Add authentication + row-level security (Vercel Postgres supports)
- Add real-time sync (WebSockets)
- Add offline support (Service Workers)
- Add full-text search (PostgreSQL FTS)
- Migrate to custom Node backend if needed

**Current design does not block any of these.**

---

## Appendix: Vercel Setup Checklist

- [ ] Account created at vercel.com
- [ ] GitHub repo connected to Vercel
- [ ] Vercel Postgres database created
- [ ] DATABASE_URL environment variable set
- [ ] `npm install` dependencies (next/edge functions if needed)
- [ ] `vercel dev` tested locally
- [ ] First deployment successful
- [ ] Domain configured (if applicable)
