// scripts/verify-agent.mjs: the Agent bank. The checks live in verify-price-banks.mjs.
process.env.VERIFY_PRICE_ONLY = 'agent';
await import('./verify-price-banks.mjs');
