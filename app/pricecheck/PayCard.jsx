'use client';

// THE PAYMENT CARDS ON THE PAGE (owner, 2026-10-25: "the end animation needs
// to show the credit cards themselves as does the end screen"). The same five
// faces the share card draws (app/pricecheck/card/route.js PAY), as HTML, so
// the climb shows real cards and the ending lands on the one you earned.
// `ti` is the Shoppers tier, sharpest first (0 Black ... 4 Prepaid).

export const PAY = [
  { bg: 'linear-gradient(140deg, #2b2b30 0%, #0c0c0f 60%, #1e1e23 100%)', ink: '#e9cf7f' },
  { bg: 'linear-gradient(135deg, #ffe9a8 0%, #e6b532 45%, #a97a10 100%)', ink: '#2a1f04' },
  { bg: 'linear-gradient(135deg, #5b8ff0 0%, #2f6fe4 40%, #163a8c 100%)', ink: '#ffffff' },
  { bg: 'linear-gradient(160deg, #4b5a6e 0%, #36424f 100%)', ink: '#e7edf4' },
  { bg: '#fbfaf6', ink: '#22252b' },
];

const CSS = `
.pyc{position:relative;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;overflow:hidden;
  font-family:Manrope,system-ui,sans-serif;border-radius:14px;width:100%;aspect-ratio:1.586;padding:7% 8%;
  box-shadow:0 10px 24px rgba(11,13,18,.22);container-type:inline-size}
.pyc.pp{border:1px solid rgba(11,13,18,.18);padding-top:13%}
.pyc .bar{position:absolute;left:0;right:0;top:0;height:9%;background:linear-gradient(90deg,#ff6b3d 0%,#ffb02e 25%,#28c08a 50%,#3d8bff 75%,#c560ff 100%)}
.pyc .tp{display:flex;justify-content:space-between;font-size:max(9px,5.4cqw);font-weight:800}
.pyc .ch{width:16%;aspect-ratio:1.3;border-radius:16%;}
.pyc .nm{font-size:max(11px,9cqw);font-weight:800;letter-spacing:-.02em;line-height:1.05}
.pyc .tt{font-size:max(10px,8cqw);font-weight:800;font-variant-numeric:tabular-nums}
.pyc .tt small{font-size:.62em;font-weight:700;opacity:.7;margin-left:4px}
.pyc .sh{position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);
  animation:pycSheen 2.6s ease-in-out infinite;pointer-events:none}
@keyframes pycSheen{from{transform:translateX(-130%) skewX(-18deg)}to{transform:translateX(280%) skewX(-18deg)}}
.pyc.mini{border-radius:6px;padding:0;box-shadow:0 2px 5px rgba(11,13,18,.25);display:block}
.pyc.mini .ch{position:absolute;left:12%;top:34%;width:22%;}
.pyc.mini.pp .bar{height:18%}
@media (prefers-reduced-motion: reduce){.pyc .sh{animation:none;display:none}}
`;

export default function PayCard({ ti = 4, label = '', name = '', total = null, max = null, mini = false, sheen = false, style = null }) {
  const f = PAY[ti] || PAY[PAY.length - 1];
  const prepaid = ti === PAY.length - 1;
  const chipBg = ti >= 3
    ? 'linear-gradient(135deg, #eef0f4 0%, #a7adb8 55%, #dfe2e8 100%)'
    : 'linear-gradient(135deg, #f6dc8a 0%, #c9a227 55%, #f2d272 100%)';
  return (
    <span className={'pyc' + (prepaid ? ' pp' : '') + (mini ? ' mini' : '')} style={{ background: f.bg, color: f.ink, ...(style || {}) }} aria-hidden={mini ? 'true' : undefined}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {prepaid ? <span className="bar" /> : null}
      {mini ? <span className="ch" style={{ background: chipBg }} /> : (
        <>
          <span className="tp"><span>Mind Loft</span><span style={{ color: prepaid ? '#e2522a' : f.ink }}>{label}</span></span>
          <span className="ch" style={{ background: chipBg }} />
          <span className="nm">{name}</span>
          {total != null ? <span className="tt">{total}{max ? <small>/ {max}</small> : null}</span> : null}
        </>
      )}
      {sheen ? <span className="sh" /> : null}
    </span>
  );
}
