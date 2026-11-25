'use client';

// THE OFFER LETTER (owner, 2026-11-25), Hired's ending. Full screen on a gold
// pastel, in the stage's looks: an envelope opens, the letter rises out of it,
// its lines arrive one by one, the salary counts up in place (tabular figures,
// fixed width, so nothing resizes as it counts), the round record fills in and
// the HIRED stamp lands last. A zero gets the polite no-thanks letter instead.
// "See your results" hands on to the usual finish. Shown once at the end of the
// interview and again from the finish's "Your offer letter".

import React, { useEffect, useState } from 'react';
import { softGround, RAMP_INK } from '@/lib/category-ramp';
import { rampFor } from '@/lib/circuits';
import { useGauntletLook, stagePalette, useStageChrome } from '../GauntletScreens';
import StageTopBar from '../StageTopBar';
import { nextLook } from '@/lib/stage-look';
import { ROUND_NAMES, PER_ROUND, TOTAL_Q, LEVEL_NAMES, fmtMoney } from './offer';

const GOLD = rampFor(3);

function useCount(to, delay, dur = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (n) => {
      const p = Math.max(0, Math.min(1, (n - t0) / dur));
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, dur]);
  return v;
}

export default function HiredOffer({ offer, job, res, ms, dateLabel, name, onClose, onShare, copied }) {
  const [look, setLook] = useGauntletLook();
  const pal = look === 'color' ? { bg: softGround(GOLD), ink: RAMP_INK } : stagePalette(GOLD, look);
  useStageChrome(pal.bg);
  const dark = look === 'dark' || look === 'darktint';
  const paper = dark ? `color-mix(in srgb, ${pal.ink} 9%, ${pal.bg})` : '#fffdf7';
  const salary = useCount(offer.salary, 1700);
  const secs = Math.round((ms || 0) / 1000);
  const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const dear = name ? `Dear ${name},` : 'Dear candidate,';
  return (
    <div className="hof" role="dialog" aria-label={`Your offer letter: ${offer.rejected ? 'no offer' : offer.title}`}
      style={{ '--of-bg': pal.bg, '--of-ink': pal.ink, '--of-paper': paper }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hof-top"><StageTopBar look={look} onFlip={() => setLook(nextLook(look))} ink={pal.ink} href="/" allLooks /></div>
      <div className="hof-col">
        <div className="hof-env">
          <div className="hof-letter">
            <div className="hof-head hof-l" style={{ animationDelay: '0.9s' }}>
              <span>Mind Loft · Hiring</span><span>{dateLabel}</span>
            </div>
            {offer.rejected ? (
              <>
                <div className="hof-title hof-l" style={{ animationDelay: '1.1s' }}>Thank you for interviewing</div>
                <p className="hof-p hof-l" style={{ animationDelay: '1.3s' }}>{dear} thank you for your time today. After five rounds for the {job.name} role, we have decided to move forward with other candidates.</p>
                <p className="hof-p hof-l" style={{ animationDelay: '1.5s' }}>Our door stays open: a new interview, for a new job, opens tomorrow.</p>
              </>
            ) : (
              <>
                <div className="hof-title hof-l" style={{ animationDelay: '1.1s' }}>Offer of Employment</div>
                <p className="hof-p hof-l" style={{ animationDelay: '1.3s' }}>{dear} after five rounds for the {job.name} role, we are pleased to offer you the position of</p>
                <div className="hof-job hof-l" style={{ animationDelay: '1.5s' }}>{offer.title}</div>
                <p className="hof-p hof-l" style={{ animationDelay: '1.6s' }}>{LEVEL_NAMES[offer.level]}, at a starting salary of</p>
                <div className="hof-pay hof-l" style={{ animationDelay: '1.7s', minWidth: `${fmtMoney(offer.salary).length}ch` }}>{fmtMoney(salary)}<span> a year</span></div>
                {offer.corner ? <p className="hof-p hof-l hof-perk" style={{ animationDelay: '2.9s' }}>And the corner office is yours.</p> : null}
              </>
            )}
            <div className="hof-rec hof-l" style={{ animationDelay: '2.1s' }}>
              {ROUND_NAMES.map((nm, r) => (
                <div key={nm} className="hof-row">
                  <span>{nm}</span>
                  <span className="hof-pips">
                    {[0, 1, 2, 3].map((k) => {
                      const v = (res || [])[r * PER_ROUND + k];
                      return <i key={k} className={v === 1 ? 'on' : v === 0 ? 'mis' : ''} style={{ animationDelay: `${2.2 + r * 0.12 + k * 0.05}s` }} />;
                    })}
                  </span>
                </div>
              ))}
            </div>
            <div className="hof-foot hof-l" style={{ animationDelay: '2.5s' }}>{offer.right} of {TOTAL_Q} right · {time}</div>
            <div className="hof-sign hof-l" style={{ animationDelay: '2.6s' }}>
              <svg viewBox="0 0 160 34" aria-hidden="true"><path d="M4 26c10-14 18-20 22-16s-8 14-2 14 12-16 18-16-4 14 2 14 10-10 16-10 2 8 8 8 14-12 22-12 4 10 12 10 20-8 30-12" /></svg>
              <span>The Hiring Committee</span>
            </div>
            {!offer.rejected ? <div className="hof-stamp" aria-hidden="true">HIRED</div> : null}
          </div>
          <div className="hof-pocket" aria-hidden="true" />
        </div>
        <button type="button" className="hof-go hof-l" style={{ animationDelay: '2.8s' }} onClick={onClose}>See your results</button>
        <button type="button" className="hof-share hof-l" style={{ animationDelay: '3s' }} onClick={onShare}>{copied ? 'Copied' : 'Share your offer'}</button>
      </div>
    </div>
  );
}

const CSS = `
.hof{position:fixed;inset:0;z-index:88;background:var(--of-bg);color:var(--of-ink);display:flex;justify-content:center;overflow-y:auto;font-family:'Manrope',system-ui,sans-serif;}
.hof-top{position:fixed;top:0;left:0;right:0;z-index:2;}
.hof-col{width:100%;max-width:440px;padding:76px 18px 28px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;}
.hof-env{position:relative;padding-bottom:26px;}
.hof-pocket{position:absolute;left:-6px;right:-6px;bottom:0;height:64px;border:1px solid var(--of-ink);border-radius:10px;background:var(--of-bg);background-image:linear-gradient(160deg,transparent 49.5%,color-mix(in srgb,var(--of-ink) 35%,transparent) 50%,transparent 50.5%),linear-gradient(20deg,transparent 49.5%,color-mix(in srgb,var(--of-ink) 35%,transparent) 50%,transparent 50.5%);animation:hofPocket .9s ease 1.2s both;}
.hof-letter{position:relative;z-index:1;background:var(--of-paper);border:1px solid var(--of-ink);border-radius:10px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:8px;animation:hofRise .95s cubic-bezier(.2,.8,.2,1) .25s both;overflow:hidden;}
.hof-l{animation:hofIn .45s ease both;}
.hof-head{display:flex;justify-content:space-between;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.75;}
.hof-title{font-size:22px;font-weight:800;margin-top:4px;}
.hof-p{margin:0;font-size:14px;line-height:1.5;font-weight:600;}
.hof-job{font-size:25px;font-weight:800;line-height:1.15;}
.hof-pay{font-size:34px;font-weight:800;letter-spacing:-.01em;font-variant-numeric:tabular-nums;line-height:1.15;}
.hof-pay span{font-size:14px;font-weight:700;margin-left:6px;letter-spacing:0;}
.hof-perk{font-weight:800;}
.hof-rec{display:flex;flex-direction:column;gap:5px;margin-top:6px;padding-top:10px;border-top:1px solid color-mix(in srgb,var(--of-ink) 25%,transparent);}
.hof-row{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;font-weight:700;}
.hof-pips{display:flex;gap:5px;}
.hof-pips i{width:14px;height:14px;border-radius:3px;border:1px solid var(--of-ink);box-sizing:border-box;animation:hofPip .3s ease both;}
.hof-pips i.on{background:var(--of-ink);}
.hof-pips i.mis{background:color-mix(in srgb,var(--of-ink) 30%,transparent);}
.hof-foot{font-size:12.5px;font-weight:700;opacity:.75;}
.hof-sign{display:flex;flex-direction:column;gap:0;margin-top:2px;font-size:12px;font-weight:700;}
.hof-sign svg{width:130px;height:30px;fill:none;stroke:var(--of-ink);stroke-width:2;stroke-linecap:round;stroke-dasharray:420;stroke-dashoffset:420;animation:hofInk 1.1s ease 2.7s forwards;}
.hof-stamp{position:absolute;right:14px;bottom:18px;border:2px solid var(--of-ink);border-radius:8px;padding:4px 11px;font-size:22px;font-weight:800;letter-spacing:.1em;transform:rotate(-12deg);animation:hofStamp .35s cubic-bezier(.3,1.6,.5,1) 3.2s both;}
.hof-go{height:56px;border:none;border-radius:14px;background:var(--of-ink);color:var(--of-bg);font-family:inherit;font-size:17px;font-weight:800;cursor:pointer;}
.hof-share{height:44px;border:1px solid var(--of-ink);border-radius:12px;background:transparent;color:var(--of-ink);font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;}
@keyframes hofRise{from{transform:translateY(46%);opacity:0}to{transform:none;opacity:1}}
@keyframes hofPocket{from{transform:translateY(14px);opacity:1}to{transform:translateY(60px);opacity:0}}
@keyframes hofIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes hofPip{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
@keyframes hofInk{to{stroke-dashoffset:0}}
@keyframes hofStamp{from{transform:rotate(-12deg) scale(2.4);opacity:0}to{transform:rotate(-12deg) scale(1);opacity:1}}
@media (prefers-reduced-motion: reduce){.hof *{animation-duration:.01s !important;animation-delay:0s !important}.hof-sign svg{stroke-dashoffset:0}}
`;
