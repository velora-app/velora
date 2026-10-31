/**
 * Lib layer: single entry point for client-safe libraries. Each subfolder is a DDD-style
 * "library" (bounded context) with its own index. Server-only database is not re-exported
 * here so the client bundle does not pull in Node drivers (pg, mysql2, etc.).
 * API routes import executeQuery, fetchSchema, validateConnection from '@/lib/database'.
 */
export * from './api'
export * from './storage'
export * from './workspace'
export * from './remote'
export * from './export'
export * from './logger'
