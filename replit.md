# MTG Precon Deck Price Analyzer

## Overview

This is a full-stack web application for analyzing the value of Magic: The Gathering preconstructed decks. The application allows users to upload CSV files containing deck data (typically exported from Moxfield), select specific decks to analyze, and get real-time pricing information from the Scryfall API. It provides rankings, statistics, and detailed breakdowns of deck values with automatic rate limiting to respect API constraints.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for fast development and builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management with automatic caching and background updates
- **UI Framework**: Radix UI primitives with shadcn/ui components for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Component Structure**: Feature-based organization with reusable UI components and custom hooks

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless) with schema-first approach
- **API Design**: RESTful endpoints with JSON responses and comprehensive error handling
- **File Processing**: CSV parsing with Papa Parse for deck data import
- **Rate Limiting**: Built-in delays for external API calls to respect service limits

### Data Storage Solutions
- **Primary Database**: PostgreSQL with four main tables:
  - `cards`: Individual card information with pricing data
  - `precon_decks`: Deck metadata and calculated values
  - `deck_cards`: Many-to-many relationship between decks and cards
  - `analysis_jobs`: Progress tracking for long-running analysis operations
- **In-Memory Fallback**: MemStorage class for development/testing without database
- **Session Management**: Express sessions with PostgreSQL store using connect-pg-simple

### Authentication and Authorization
- **Session-based**: Uses Express sessions for user state management
- **No explicit auth**: Currently designed as a single-user application
- **Future-ready**: Architecture supports adding authentication layers

## External Dependencies

### Third-Party APIs
- **Scryfall API**: Primary source for Magic card data and pricing information
  - Automatic rate limiting (100ms delays between requests)
  - Handles card name resolution and price fetching
  - Graceful error handling for missing cards

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting platform
- **Connection**: Uses @neondatabase/serverless for optimized serverless connections

### Development and Build Tools
- **Vite**: Fast build tool with HMR for development
- **esbuild**: Production bundling for server code
- **Drizzle Kit**: Database migrations and schema management
- **TypeScript**: Full type safety across frontend and backend

### UI and Styling Dependencies
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management with validation

### File Processing
- **Papa Parse**: CSV parsing with header detection and error handling
- **Support**: Designed for Moxfield CSV export format with flexible column mapping

### Monitoring and Error Handling
- **Custom logging**: Request/response logging with timing information
- **Error boundaries**: Comprehensive error handling in React components
- **Toast notifications**: User feedback for operations and errors