'use client';

// THE QUIZ-MIX HAND-OFF (owner, 2026-11-12, "Quiz Stage Restyle" run frames).
//
// Between the three quizzes of Potluck, Mixtape and Mishmash, the old page
// showed the finished quiz's result with a small "Banked. Quiz 2 in 5..." strip.
// The runs settled this screen on 2026-11-10: go straight to a very clean,
// concise, large start button for the next element, its countdown drawn as an
// outline that retreats around the button's edge from top centre down both
// sides (option C), and "Leave the run" as a small underlined link at the foot.
//
// It only draws. The countdown, the target and the write that banked the quiz
// all stay in QuizClient (potCountdown, potTarget, recordPotluck); a press
// simply goes now instead of when the count runs out.

import React from 'react';
import { createPortal } from 'react-dom';
import { useStageChrome } from '../../GauntletScreens';

export default function PotHandoff({ pastel = '#fb923c', label, title, sub, href, leaveHref, seconds = 5, onGo }) {
  const ground = `color-mix(in srgb, ${pastel} 60%, #ffffff)`;
  useStageChrome(ground);
  if (typeof document === 'undefined') return null;
  const el = (
    <div className="pho" role="dialog" aria-label={title} style={{ '--pho-bg': ground, '--pho-s': `${seconds}s` }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pho-col">
        <a className="pho-btn" href={href} onClick={(e) => { if (onGo) { e.preventDefault(); onGo(); } }}>
          <svg className="pho-trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M50 99.5 H6 Q0.5 99.5 0.5 94 V6 Q0.5 0.5 6 0.5 H50" pathLength="100" vectorEffect="non-scaling-stroke" />
            <path d="M50 99.5 H94 Q99.5 99.5 99.5 94 V6 Q99.5 0.5 94 0.5 H50" pathLength="100" vectorEffect="non-scaling-stroke" />
          </svg>
          {label ? <small>{label}</small> : null}
          <strong>{title}</strong>
          {sub ? <em>{sub}</em> : null}
          <span>Start</span>
        </a>
      </div>
      {leaveHref ? <a className="pho-leave" href={leaveHref}>Leave the run</a> : null}
    </div>
  );
  return createPortal(el, document.body);
}

const CSS = `
.pho{position:fixed;inset:0;z-index:9500;background:var(--pho-bg);color:#0b0d12;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Manrope',system-ui,sans-serif;padding:24px 22px max(24px, env(safe-area-inset-bottom));box-sizing:border-box;}
.pho-col{flex:1;display:flex;align-items:center;justify-content:center;width:100%;max-width:460px;}
.pho-btn{position:relative;display:block;width:100%;box-sizing:border-box;padding:44px 24px;border-radius:22px;background:#ffffff;color:#0b0d12;text-align:center;text-decoration:none;box-shadow:0 0 0 1px rgba(11,15,26,.16);}
.pho-btn:focus-visible{outline:3px solid #0b0d12;outline-offset:3px;}
.pho-btn small{display:block;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#3f4757;margin-bottom:12px;line-height:1.3;}
.pho-btn strong{display:block;font-size:clamp(24px,7vw,32px);font-weight:800;line-height:1.22;letter-spacing:-.01em;padding-bottom:.08em;}
.pho-btn em{display:block;font-style:normal;font-size:14px;font-weight:700;color:#3f4757;margin-top:10px;line-height:1.35;}
.pho-btn span{display:inline-block;margin-top:20px;font-size:16px;font-weight:800;padding:12px 30px;border-radius:999px;background:#0b0d12;color:#ffffff;}
.pho-trace{position:absolute;inset:-1px;width:calc(100% + 2px);height:calc(100% + 2px);overflow:visible;pointer-events:none;}
.pho-trace path{fill:none;stroke:#0b0d12;stroke-width:3;stroke-linecap:round;stroke-dasharray:100 100;stroke-dashoffset:0;animation:phoTrace var(--pho-s) linear forwards;}
@keyframes phoTrace{to{stroke-dashoffset:100;}}
@media (prefers-reduced-motion: reduce){.pho-trace path{animation:none;}}
.pho-leave{font-size:13px;font-weight:700;color:#2c2f38;text-decoration:underline;padding:10px;}
`;
