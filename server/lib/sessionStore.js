/**
 * Holds a MemoryStore instance for saving sessions
 *
 * @module sessionStore
 * @requires express-session
 */
var MemoryStore = new require('express-session').MemoryStore;

/**
 * Returns a memoryStore instance created from express-session
 * @returns {MemoryStore}
 */
module.exports = new MemoryStore();