// A text link back to the home, centred in a run's cap. Shown on the end
// screen only (owner, 2026-10-17): during play the cap stays as it was.
// The caller renders it only when the run is done; it centres itself on the
// cap, so the cap is made position:relative here.
const CSS = `
.pc-cap,.ls-cap,.dj-cap,.rr-cap,.rn-cap,.vr .vr-cap{position:relative}
.rbl{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:6px;color:inherit;font-weight:800;font-size:13px;text-decoration:none;white-space:nowrap;z-index:1}
.rbl:hover .rbl-l,.rbl:hover .rbl-s{text-decoration:underline;text-underline-offset:3px}
.rbl:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:4px}
.rbl-s{display:none}
@media(max-width:640px){.rbl-l{display:none}.rbl-s{display:inline}}
`;

export default function RunBackLink({ color }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <a className="rbl" href="/" style={color ? { color } : undefined}>
        <span aria-hidden="true">&larr;</span>
        <span className="rbl-l">Return to all daily puzzles</span>
        <span className="rbl-s">All puzzles</span>
      </a>
    </>
  );
}
