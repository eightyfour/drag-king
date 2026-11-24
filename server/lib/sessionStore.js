/**
 * Holds a MemoryStore instance for saving sessions
 *
 * @module sessionStore
 * @requires express-session
 */
const { MemoryStore } = require('express-session');

/**
 * Returns a memoryStore instance created from express-session
 * @returns {MemoryStore}
 */
module.exports = new MemoryStore();