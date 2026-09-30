// The nine ramp steps as page variables, both registers, for the /iq pages.
// A plain module (not a client file) so the server-rendered hub can read the
// string: an export from a 'use client' file reaches a server component as a
// client reference, not as its value.
export const IQ_RAMP_CSS = `
.stage-page{--iq-r0:#7dd3fc;--iq-r1:#6ee7b7;--iq-r2:#bef264;--iq-r3:#e8b43a;--iq-r4:#fb923c;
  --iq-r5:#fb7185;--iq-r6:#e879f9;--iq-r7:#c084fc;--iq-r8:#fbbf24;--iq-r9:#a5b4fc;}
html:not([data-stage-boot='dark']) .stage-page[data-stage-theme='light']{--iq-r0:#0369a1;--iq-r1:#046c4e;--iq-r2:#176e2f;
  --iq-r3:#7c5104;--iq-r4:#a3480d;--iq-r5:#be123c;--iq-r6:#a21caf;--iq-r7:#6d28d9;--iq-r8:#8a5a00;--iq-r9:#3949ab;}
`;
