// scripts/verify-curator.mjs: the Curator bank. The checks live in verify-price-banks.mjs.
process.env.VERIFY_PRICE_ONLY = 'curator';
await import('./verify-price-banks.mjs');
