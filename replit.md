# Megatron - Multi-Platform Content Automation Platform

## Overview

Megatron is a production-ready, multi-tenant SaaS platform for automated content farming and performance testing across multiple social media platforms. The system enables users to schedule, generate, and publish content to TikTok, Instagram, YouTube Shorts, Twitter/X, LinkedIn, Reddit, and Discord with AI-powered content generation, advanced analytics, and A/B testing capabilities.

The platform is built as a full-stack application with a React frontend and Express backend, featuring a modern component-based architecture with TypeScript throughout. The system supports unlimited accounts per platform, automated posting quotas, AI content generation using Google's Gemini API, and comprehensive analytics with market fit scoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/build tooling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod schema validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handlers
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage
- **Job Processing**: BullMQ for background job queues (posting, analytics, health checks)

### Database Architecture
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migrations**: Drizzle Kit for schema management
- **Multi-tenancy**: Organization-based isolation with user-organization relationships

### Key Data Models
- **Users**: Authentication and profile information
- **Organizations**: Multi-tenant isolation with billing plans
- **Accounts**: Social media account connections per platform
- **Campaigns**: Content organization and scheduling
- **Calendar Slots**: Scheduled posts with platform targeting
- **Assets**: Media files and content library
- **Post Jobs**: Queue processing with status tracking
- **Metrics**: Performance analytics and engagement data
- **AB Tests**: A/B testing configurations and results
- **Templates**: Reusable content templates

### Authentication & Authorization
- **Provider**: Replit Auth with OIDC
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only cookies, CSRF protection, secure session handling
- **Multi-tenancy**: Organization-based access control

### Content Processing Pipeline
- **Queue System**: Redis-backed BullMQ for reliable job processing
- **Job Types**: Post publishing, metrics collection, health monitoring
- **Error Handling**: Retry logic, failure notifications, manual requeue capabilities
- **Rate Limiting**: Platform-specific quotas to prevent API violations

### AI Integration Architecture
- **Primary AI**: Google Gemini for text and multimodal content generation
- **Content Types**: Captions, hashtags, image prompts, FOMO-driven messaging
- **Fallback Systems**: Multiple AI providers for redundancy
- **Processing**: Async generation with queue-based processing

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Redis**: Queue backend for BullMQ job processing
- **Session Storage**: PostgreSQL-based session management

### AI Services
- **Google Gemini**: Primary AI for content generation (text and multimodal)
- **HeyGen**: Avatar video generation (planned integration)
- **Stable Diffusion**: Fallback image generation API

### Social Media APIs
- **TikTok API**: Direct posting integration
- **Instagram**: Buffer webhook or Make.com integration
- **YouTube Shorts**: YouTube Data API
- **Twitter/X API**: Direct posting
- **LinkedIn API**: Professional content posting
- **Reddit API**: Community posting
- **Discord API**: Server messaging

### Development Tools
- **Vite**: Frontend build tool and dev server
- **Replit**: Development environment with custom plugins
- **shadcn/ui**: Component library with Radix UI primitives
- **Tailwind CSS**: Utility-first styling framework

### Monitoring & Analytics
- **Built-in Analytics**: Custom metrics collection and processing
- **Market Fit Scoring**: Proprietary algorithm combining engagement, sentiment, and retention
- **A/B Testing**: Statistical significance testing with confidence intervals

### Third-Party Integrations
- **Buffer**: Alternative Instagram posting via webhooks
- **Make.com**: Automation platform integration for complex workflows
- **Google Sheets**: Import/export functionality for bulk operations
- **CSV Processing**: Bulk data import/export capabilities