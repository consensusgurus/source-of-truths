// scripts/verify-dealer.mjs: the Dealer bank. The checks live in verify-price-banks.mjs.
process.env.VERIFY_PRICE_ONLY = 'dealer';
await import('./verify-price-banks.mjs');
