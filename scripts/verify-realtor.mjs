// scripts/verify-realtor.mjs: the Realtor bank. The checks live in verify-price-banks.mjs.
process.env.VERIFY_PRICE_ONLY = 'realtor';
await import('./verify-price-banks.mjs');
