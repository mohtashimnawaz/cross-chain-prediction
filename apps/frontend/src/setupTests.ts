import '@testing-library/jest-dom'

// Polyfills for Node test environment
const util = require('util')
if (typeof (global as any).TextEncoder === 'undefined') {
  (global as any).TextEncoder = util.TextEncoder
}
if (typeof (global as any).TextDecoder === 'undefined') {
  (global as any).TextDecoder = util.TextDecoder
}
