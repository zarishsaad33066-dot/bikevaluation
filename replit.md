# Overview

BikeCheck is a comprehensive motorcycle inspection and valuation system designed for the Pakistani motorcycle market. The application serves mechanics, dealerships, and administrators with tools to conduct detailed vehicle inspections, generate market-based valuations, and produce professional reports. The system features a scoring algorithm that evaluates motorcycles across multiple categories (engine, frame, suspension, brakes, tires, electricals, body, and documentation) to provide accurate market value estimates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Full-Stack Architecture
The application uses a monorepo structure with a React frontend and Express.js backend, sharing TypeScript types and schemas across the entire stack. The build system uses Vite for the frontend and esbuild for the backend, enabling efficient development and deployment.

## Frontend Architecture
- **React + TypeScript**: Component-based UI with strict typing
- **Wouter**: Lightweight client-side routing without unnecessary complexity
- **TanStack Query**: Server state management with caching and background updates
- **shadcn/ui + Radix UI**: Accessible component library with consistent design system
- **Tailwind CSS**: Utility-first styling with CSS variables for theming
- **React Hook Form + Zod**: Type-safe form handling with validation

## Backend Architecture
- **Express.js**: RESTful API server with middleware-based request processing
- **Drizzle ORM**: Type-safe database queries with schema-first approach
- **PostgreSQL**: Relational database optimized for complex queries and relationships
- **Session-based Authentication**: Secure user sessions stored in PostgreSQL

## Database Design
The database schema supports the Pakistani motorcycle market with:
- **Motorcycle Brands & Models**: Complete catalog with pricing data for 2024-2025
- **User Management**: Role-based access (mechanics, dealers, admins)
- **Inspection System**: Detailed scoring across 8 evaluation categories
- **Scoring Rules**: Configurable parameters for market-based valuations

## Authentication & Authorization
- **Replit Auth Integration**: OAuth-based authentication with OpenID Connect
- **Role-based Permissions**: Three user roles with different access levels
- **Session Management**: PostgreSQL-stored sessions with configurable TTL
- **Route Protection**: Middleware-based authorization for API endpoints

## Inspection Scoring System
The core business logic implements a sophisticated scoring algorithm:
- **Multi-category Evaluation**: 8 distinct inspection areas with weighted scoring
- **Market Integration**: Real-time pricing data for accurate valuations
- **Condition Assessment**: Granular scoring based on wear, damage, and maintenance
- **Report Generation**: Professional PDFs with detailed findings and recommendations

## State Management
- **Server State**: TanStack Query handles API data with intelligent caching
- **Client State**: React hooks for UI state and form management
- **Theme Management**: Context-based dark/light mode with system preference detection
- **Error Handling**: Centralized error boundaries with user-friendly messaging

# External Dependencies

## Database & ORM
- **@neondatabase/serverless**: PostgreSQL connection with serverless optimization
- **drizzle-orm**: Type-safe ORM with migration support
- **drizzle-kit**: Database toolkit for schema management and migrations

## Authentication
- **openid-client**: OpenID Connect implementation for Replit Auth
- **passport**: Authentication middleware with strategy pattern
- **express-session**: Session management with PostgreSQL storage
- **connect-pg-simple**: PostgreSQL session store adapter

## UI Components & Styling
- **@radix-ui/react-***: Headless UI primitives for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Intelligent Tailwind class merging

## Form Handling & Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Form validation resolver integration
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Drizzle schema to Zod validation bridge

## Development Tools
- **vite**: Fast development server and build tool
- **typescript**: Static type checking across the entire codebase
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Utilities & Data Management
- **date-fns**: Date manipulation and formatting utilities
- **nanoid**: Secure unique ID generation
- **memoizee**: Function memoization for performance optimization