/**
 * User Data Service - Backward Compatibility Layer
 *
 * This file maintains backward compatibility by re-exporting all functions
 * from the modularized service files. All existing imports will continue to work.
 *
 * The service has been refactored into focused modules:
 * - userData/userDataHelpers.js: Utility functions
 * - userData/userDataCRUD.js: Core CRUD operations
 * - userData/userDataSettings.js: Settings and profile management
 * - userData/userDataListeners.js: Real-time listeners
 * - userData/userDataMigration.js: Data migration utilities
 * - userData/userDataSecret.js: Secret page operations
 *
 * For new code, consider importing directly from the specific modules:
 * import { fetchMemosFromFirestore } from './services/userData/userDataCRUD';
 */

// Re-export all functions from the modularized structure
export * from './userData/index';
