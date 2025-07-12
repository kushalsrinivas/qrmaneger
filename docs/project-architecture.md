# Project Architecture Documentation

## System Overview

MojoQR is a full-featured QR code generator, management platform, and analytics dashboard built with modern web technologies. The system supports both static and dynamic QR codes with comprehensive tracking, customization, and management capabilities.

### Core Architecture Principles

1. **Scalability**: Microservices-ready architecture with clear separation of concerns
2. **Performance**: Optimized for fast QR generation and real-time analytics
3. **Maintainability**: Clean code structure with TypeScript and modern patterns
4. **Security**: Enterprise-grade security with proper authentication and authorization
5. **Extensibility**: Plugin-based architecture for new QR types and integrations

## Technology Stack

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI + shadcn/ui
- **State Management**: React Context + Zustand (for complex state)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics visualization

### Backend

- **Runtime**: Node.js
- **Framework**: Next.js API Routes + tRPC
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **File Storage**: AWS S3 or Vercel Blob
- **Cache**: Redis for session and data caching

### Infrastructure

- **Deployment**: Vercel (Frontend + API) + Railway (Database)
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Sentry
- **Email**: Resend for transactional emails
- **Search**: PostgreSQL Full-Text Search

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (tRPC)        │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   QR Generator  │              │
         │              │   Service       │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Analytics     │              │
         │              │   Engine        │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   File Storage  │              │
         │              │   (S3/Blob)     │              │
         │              └─────────────────┘              │
         │                                               │
         │              ┌─────────────────┐              │
         └──────────────►│   Redis Cache   │◄─────────────┘
                        └─────────────────┘
```

### Microservices Architecture (Future)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   API Gateway   │    │   Auth Service  │
│   (Next.js)     │◄──►│   (tRPC)        │◄──►│   (NextAuth)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
          ┌─────────────────┐   │   ┌─────────────────┐
          │   QR Generator  │   │   │   Analytics     │
          │   Service       │   │   │   Service       │
          └─────────────────┘   │   └─────────────────┘
                    │           │           │
          ┌─────────────────┐   │   ┌─────────────────┐
          │   Redirect      │   │   │   Notification  │
          │   Service       │   │   │   Service       │
          └─────────────────┘   │   └─────────────────┘
                                │
                    ┌─────────────────┐
                    │   File Storage  │
                    │   Service       │
                    └─────────────────┘
```

## Database Schema

### Core Tables

#### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  role user_role DEFAULT 'member',
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Organizations

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan subscription_plan DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### QR Codes

```sql
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  folder_id UUID REFERENCES folders(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type qr_code_type NOT NULL,
  content JSONB NOT NULL,
  is_dynamic BOOLEAN DEFAULT false,
  short_url VARCHAR(50) UNIQUE,
  style_config JSONB DEFAULT '{}',
  status qr_status DEFAULT 'active',
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Templates

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  type qr_code_type NOT NULL,
  content_template JSONB NOT NULL,
  style_config JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Analytics Events

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id),
  event_type event_type NOT NULL,
  user_agent TEXT,
  ip_address INET,
  country VARCHAR(2),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(50),
  os VARCHAR(50),
  referrer TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Supporting Tables

#### Folders

```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  parent_id UUID REFERENCES folders(id),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tags

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE qr_code_tags (
  qr_code_id UUID REFERENCES qr_codes(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (qr_code_id, tag_id)
);
```

## File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group routes
│   ├── (dashboard)/              # Dashboard group routes
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── trpc/                 # tRPC endpoints
│   │   └── webhooks/             # Webhook endpoints
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── forms/                    # Form components
│   ├── charts/                   # Chart components
│   └── qr/                       # QR-specific components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Auth configuration
│   ├── db.ts                     # Database connection
│   ├── qr-generator.ts           # QR generation logic
│   ├── analytics.ts              # Analytics utilities
│   ├── validators.ts             # Zod schemas
│   └── utils.ts                  # General utilities
├── server/                       # Server-side code
│   ├── api/                      # tRPC API
│   │   ├── routers/              # API route handlers
│   │   ├── root.ts               # Root router
│   │   └── trpc.ts               # tRPC configuration
│   ├── auth/                     # Auth configuration
│   └── db/                       # Database utilities
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── styles/                       # Additional styles
└── middleware.ts                 # Next.js middleware
```

## Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   ├── UserMenu
│   │   └── SearchBar
│   ├── Sidebar
│   │   ├── MainNavigation
│   │   ├── FolderTree
│   │   └── QuickActions
│   └── Footer
├── Pages
│   ├── Dashboard
│   │   ├── StatsCards
│   │   ├── RecentQRCodes
│   │   ├── AnalyticsChart
│   │   └── QuickActions
│   ├── QRGenerator
│   │   ├── TypeSelector
│   │   ├── ContentForm
│   │   ├── StyleCustomizer
│   │   └── PreviewPanel
│   ├── Analytics
│   │   ├── MetricsOverview
│   │   ├── TimeSeriesChart
│   │   ├── GeographicMap
│   │   └── DeviceBreakdown
│   └── Templates
│       ├── TemplateGrid
│       ├── TemplateCard
│       └── TemplateEditor
└── Modals
    ├── CreateQRModal
    ├── EditQRModal
    └── ShareModal
```

### Component Design Patterns

#### 1. Compound Components

```typescript
// Usage
<QRGenerator>
  <QRGenerator.TypeSelector />
  <QRGenerator.ContentForm />
  <QRGenerator.StyleCustomizer />
  <QRGenerator.Preview />
</QRGenerator>
```

#### 2. Render Props

```typescript
<DataFetcher>
  {({ data, loading, error }) => (
    <QRCodeList data={data} loading={loading} error={error} />
  )}
</DataFetcher>
```

#### 3. Custom Hooks

```typescript
const useQRGenerator = () => {
  const [qrData, setQRData] = useState();
  const [style, setStyle] = useState();
  const generateQR = useCallback(() => {
    // Generation logic
  }, [qrData, style]);

  return { qrData, style, generateQR, setQRData, setStyle };
};
```

## API Architecture

### tRPC Router Structure

```typescript
// Root router
export const appRouter = createTRPCRouter({
  auth: authRouter,
  qr: qrRouter,
  analytics: analyticsRouter,
  templates: templatesRouter,
  folders: foldersRouter,
  organizations: organizationsRouter,
});

// QR Router example
export const qrRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createQRSchema)
    .mutation(async ({ ctx, input }) => {
      // Create QR code logic
    }),

  list: protectedProcedure.input(listQRSchema).query(async ({ ctx, input }) => {
    // List QR codes logic
  }),

  update: protectedProcedure
    .input(updateQRSchema)
    .mutation(async ({ ctx, input }) => {
      // Update QR code logic
    }),

  delete: protectedProcedure
    .input(deleteQRSchema)
    .mutation(async ({ ctx, input }) => {
      // Delete QR code logic
    }),
});
```

### API Endpoints

#### REST API (for external integrations)

```
GET    /api/qr/:id                 # Get QR code details
POST   /api/qr                     # Create QR code
PUT    /api/qr/:id                 # Update QR code
DELETE /api/qr/:id                 # Delete QR code
GET    /api/qr/:id/analytics       # Get QR analytics
POST   /api/qr/bulk                # Bulk create QR codes
```

#### Webhook Endpoints

```
POST   /api/webhooks/scan          # QR code scan webhook
POST   /api/webhooks/stripe        # Stripe payment webhook
```

## State Management

### Global State (Zustand)

```typescript
interface AppState {
  user: User | null;
  organization: Organization | null;
  currentFolder: Folder | null;
  qrCodes: QRCode[];
  selectedQRCodes: string[];

  // Actions
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  setCurrentFolder: (folder: Folder | null) => void;
  selectQRCode: (id: string) => void;
  deselectQRCode: (id: string) => void;
  clearSelection: () => void;
}
```

### Local State Patterns

#### Form State (React Hook Form)

```typescript
const useQRForm = () => {
  const form = useForm<QRFormData>({
    resolver: zodResolver(qrFormSchema),
    defaultValues: {
      name: "",
      type: "url",
      content: {},
      style: defaultStyle,
    },
  });

  return form;
};
```

#### Data Fetching (tRPC + React Query)

```typescript
const {
  data: qrCodes,
  isLoading,
  error,
} = api.qr.list.useQuery({
  folderId: currentFolder?.id,
  limit: 50,
  offset: 0,
});
```

## Security Architecture

### Authentication Flow

```
1. User visits protected route
2. Middleware checks for session
3. If no session, redirect to login
4. User authenticates via OAuth/credentials
5. NextAuth creates session
6. User gains access to protected resources
```

### Authorization Patterns

#### Role-Based Access Control (RBAC)

```typescript
enum UserRole {
  ADMIN = "admin",
  TEAM_LEAD = "team_lead",
  MEMBER = "member",
  VIEWER = "viewer",
}

const permissions = {
  [UserRole.ADMIN]: ["*"],
  [UserRole.TEAM_LEAD]: ["qr:*", "template:*", "analytics:read"],
  [UserRole.MEMBER]: ["qr:create", "qr:read", "qr:update"],
  [UserRole.VIEWER]: ["qr:read", "analytics:read"],
};
```

#### Resource-Based Authorization

```typescript
const canAccessQR = (user: User, qrCode: QRCode) => {
  // Owner can access
  if (qrCode.userId === user.id) return true;

  // Same organization members can access
  if (qrCode.organizationId === user.organizationId) {
    return hasPermission(user.role, "qr:read");
  }

  return false;
};
```

## Performance Optimization

### Caching Strategy

#### Client-Side Caching

- React Query for API data caching
- Browser cache for static assets
- Service Worker for offline functionality

#### Server-Side Caching

- Redis for session storage
- Database query result caching
- CDN for QR code images

### Database Optimization

#### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_organization_id ON qr_codes(organization_id);
CREATE INDEX idx_qr_codes_created_at ON qr_codes(created_at);
CREATE INDEX idx_analytics_events_qr_code_id ON analytics_events(qr_code_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Full-text search indexes
CREATE INDEX idx_qr_codes_search ON qr_codes USING gin(to_tsvector('english', name || ' ' || description));
```

#### Query Optimization

- Use database pagination
- Implement proper joins
- Avoid N+1 queries
- Use database aggregations

## Deployment Architecture

### Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │    │   AWS S3        │
│   (Frontend)    │◄──►│   (Database)    │    │   (File Storage)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Redis Cloud   │              │
         │              │   (Cache)       │              │
         │              └─────────────────┘              │
         │                                               │
         │              ┌─────────────────┐              │
         └──────────────►│   Sentry        │◄─────────────┘
                        │   (Monitoring)  │
                        └─────────────────┘
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run linting
        run: npm run lint
      - name: Type check
        run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Monitoring & Observability

### Application Monitoring

#### Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

#### Performance Monitoring

```typescript
// Custom metrics
const trackQRGeneration = (duration: number, type: string) => {
  analytics.track("qr_generation", {
    duration,
    type,
    timestamp: new Date().toISOString(),
  });
};
```

### Database Monitoring

#### Query Performance

```sql
-- Slow query monitoring
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;
```

#### Connection Monitoring

```typescript
// Database connection health check
const checkDatabaseHealth = async () => {
  try {
    await db.select().from(users).limit(1);
    return { status: "healthy", timestamp: new Date() };
  } catch (error) {
    return { status: "unhealthy", error: error.message, timestamp: new Date() };
  }
};
```

## Development Guidelines

### Code Style

#### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true
  }
}
```

#### ESLint Configuration

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error"
  }
}
```

### Testing Strategy

#### Unit Tests (Vitest)

```typescript
// lib/qr-generator.test.ts
import { describe, it, expect } from "vitest";
import { generateQRCode } from "./qr-generator";

describe("QR Generator", () => {
  it("should generate URL QR code", () => {
    const result = generateQRCode({
      type: "url",
      content: { url: "https://example.com" },
    });

    expect(result).toMatchObject({
      type: "url",
      data: expect.any(String),
      size: expect.any(Number),
    });
  });
});
```

#### Integration Tests (Playwright)

```typescript
// tests/qr-generation.spec.ts
import { test, expect } from "@playwright/test";

test("should generate QR code from dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await page.click('[data-testid="create-qr-button"]');
  await page.fill('[data-testid="qr-name-input"]', "Test QR");
  await page.fill('[data-testid="qr-url-input"]', "https://example.com");
  await page.click('[data-testid="generate-button"]');

  await expect(page.locator('[data-testid="qr-preview"]')).toBeVisible();
});
```

### Git Workflow

#### Branch Naming

```
feature/AUTH-001-oauth-integration
bugfix/BUG-001-template-filter-fix
hotfix/security-patch-auth
release/v1.2.0
```

#### Commit Messages

```
feat(auth): add OAuth integration with Google and GitHub
fix(templates): resolve category filter case sensitivity issue
docs(api): update QR generation endpoint documentation
test(qr): add unit tests for QR customization engine
```

## Scalability Considerations

### Database Scaling

#### Read Replicas

```typescript
// Database connection with read replicas
const dbConfig = {
  master: {
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
  },
  slaves: [
    {
      host: process.env.DB_REPLICA_1_HOST,
      port: 5432,
      database: process.env.DB_NAME,
    },
    {
      host: process.env.DB_REPLICA_2_HOST,
      port: 5432,
      database: process.env.DB_NAME,
    },
  ],
};
```

#### Sharding Strategy

```typescript
// Shard QR codes by user ID
const getShardKey = (userId: string) => {
  return parseInt(userId.slice(-2), 16) % 4;
};

const getShardedConnection = (userId: string) => {
  const shardKey = getShardKey(userId);
  return connections[shardKey];
};
```

### Application Scaling

#### Horizontal Scaling

- Stateless application design
- Load balancer configuration
- Session storage in Redis
- Database connection pooling

#### Vertical Scaling

- CPU and memory optimization
- Database query optimization
- Caching strategies
- Asset optimization

## Security Best Practices

### Data Protection

#### Encryption at Rest

```typescript
// Encrypt sensitive data before storing
const encryptSensitiveData = (data: string) => {
  const cipher = crypto.createCipher("aes-256-cbc", process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};
```

#### Encryption in Transit

- HTTPS everywhere
- TLS 1.3 for database connections
- Secure cookie settings
- HSTS headers

### Input Validation

#### Schema Validation (Zod)

```typescript
const createQRSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["url", "vcard", "wifi", "text"]),
  content: z.record(z.any()),
  folderId: z.string().uuid().optional(),
});
```

#### SQL Injection Prevention

- Parameterized queries only
- Input sanitization
- ORM usage (Drizzle)
- Stored procedures for complex operations

### Rate Limiting

#### API Rate Limiting

```typescript
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
};
```

#### QR Generation Rate Limiting

```typescript
const qrGenerationLimit = {
  free: 100, // per month
  pro: 10000, // per month
  enterprise: 100000, // per month
};
```

This architecture document serves as the foundation for consistent development practices and system design decisions. It should be updated as the system evolves and new requirements emerge.
