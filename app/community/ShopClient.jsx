'use client';
// THE LOFT SHOP, /community/shop (owner, 2026-11-19: "let's put these on site", "no need for
// tabs, but sort function by brand, witty-ish", "also show sorting on our website for shirts,
// hats, coffee mugs, hoodies"). The products are made to order by Fourthwall. The page reads
// them from Fourthwall's Storefront API (app/community/shop/page.js), so a product added or
// changed there shows up here on its own. Buying happens on the Fourthwall product page.
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import CommunityShell from './CommunityShell';

const SHOP_URL = 'https://mindloft-shop.fourthwall.com';
const LINES = [['all', 'All'], ['brand', 'Brand'], ['witty', 'Witty-ish']];
const KINDS = [['all', 'All'], ['shirt', 'Shirts'], ['hoodie', 'Hoodies'], ['hat', 'Hats'], ['mug', 'Mugs']];

function money(n) {
  return '$' + (Number.isInteger(n) ? String(n) : n.toFixed(2));
}

export default function ShopClient({ products = [] }) {
  const [line, setLine] = useState('all');
  const [kind, setKind] = useState('all');
  const shown = useMemo(
    () => products.filter((p) => (line === 'all' || p.line === line) && (kind === 'all' || p.kind === kind)),
    [products, line, kind],
  );
  const count = (key, id) => (id === 'all' ? products.length : products.filter((p) => p[key] === id).length);

  return (
    <CommunityShell tab="shop" title="Loft Shop" sub="Mind Loft on tees, hoodies, hats and mugs. Each one is made to order and shipped to you."
      aside={<a className="cm-chip dk" href={SHOP_URL} target="_blank" rel="noopener" style={{ fontSize: 13, padding: '6px 14px', textDecoration: 'none' }}>Open</a>}>
      {products.length === 0 ? (
        <section className="cm-card">
          <div className="cm-cb">
            <p className="cm-mut">The shelf could not be loaded just now. The shop itself is open.</p>
            <a className="cm-btn pri" href={SHOP_URL} target="_blank" rel="noopener" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>Go To The Shop</a>
          </div>
        </section>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            <div className="cm-seg" role="group" aria-label="Show brand or witty-ish">
              {LINES.map(([id, label]) => (
                <button key={id} type="button" className={line === id ? 'on' : ''} aria-pressed={line === id} onClick={() => setLine(id)}>
                  {label} <i>{count('line', id)}</i>
                </button>
              ))}
            </div>
            <div className="cm-seg" role="group" aria-label="Show a kind of product">
              {KINDS.map(([id, label]) => (
                <button key={id} type="button" className={kind === id ? 'on' : ''} aria-pressed={kind === id} onClick={() => setKind(id)}>
                  {label} <i>{count('kind', id)}</i>
                </button>
              ))}
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="cm-mut">Nothing on the shelf matches both choices yet.</p>
          ) : (
            <div className="cm-g4">
              {shown.map((p) => (
                <a key={p.slug} className="cm-card" href={`${SHOP_URL}/products/${p.slug}`} target="_blank" rel="noopener"
                  style={{ textDecoration: 'none', color: 'var(--stg-ink)' }}>
                  <div style={{ aspectRatio: '3 / 4', background: '#ececec', borderBottom: '1px solid var(--stg-ink)', overflow: 'hidden' }}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} loading="lazy" decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : null}
                  </div>
                  <div className="cm-cb" style={{ gap: 6 }}>
                    <b style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.3 }}>{p.name}</b>
                    <p className="cm-mut" style={{ margin: 0 }}>
                      {p.colors > 1 ? `${p.colors} colors` : p.color || 'One color'}
                    </p>
                  </div>
                  <div className="cm-foot" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: 15, fontWeight: 800 }}>{p.max > p.min ? `From ${money(p.min)}` : money(p.min)}</b>
                    <span className="cm-chip">Buy</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}
      <p className="cm-mut" style={{ marginTop: 16 }}>
        Orders are printed, shipped and supported by Fourthwall. Want something else on the shelf?{' '}
        <Link href="/community/ideas?pitch=fix" style={{ color: 'var(--stg-ink)', fontWeight: 800 }}>Pitch it on the Idea Board</Link>.
      </p>
    </CommunityShell>
  );
}
