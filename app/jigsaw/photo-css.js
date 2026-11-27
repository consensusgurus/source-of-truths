// The puzzle table look for the YOUR PHOTO JIGSAWS pages (owner 2026-11-27; the portal's dark
// walnut table, app/jig/shelf ShelfClient TABLE.dark). Manrope comes from the site layout.
export const PHOTO_CSS = `
.pz{min-height:100vh;background:#16120e;color:#f4ead8;font-family:Manrope,system-ui,sans-serif}
.pz a{color:#f4ead8}
.pz-in{max-width:1080px;margin:0 auto;padding:20px 20px 56px;box-sizing:border-box}
.pz-crumb{display:flex;flex-wrap:wrap;gap:8px;font-size:13px;font-weight:600;color:rgba(244,234,216,.6);margin:0 0 18px}
.pz-crumb a{color:rgba(244,234,216,.82);text-decoration:none}
.pz-eyb{display:block;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#f3d98b;margin:0 0 6px}
.pz h1{font-size:clamp(28px,4.4vw,44px);line-height:1.15;font-weight:800;margin:0 0 12px;padding-bottom:2px}
.pz h2{font-size:22px;line-height:1.25;font-weight:800;margin:28px 0 10px}
.pz p{font-size:16px;line-height:1.6;margin:0 0 12px;color:rgba(244,234,216,.82)}
.pz-lede{font-size:17px !important;max-width:720px}
.pz-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;box-sizing:border-box;padding:12px 22px;border-radius:12px;background:#f3d98b;color:#16120e !important;font-weight:800;font-size:16px;text-decoration:none;border:0;cursor:pointer;font-family:inherit}
.pz-btn.ghost{background:transparent;color:#f4ead8 !important;border:1px solid rgba(244,234,216,.4)}
.pz-btn[disabled]{opacity:.5;cursor:default}
.pz-row{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}
.pz-card{background:#211b15;border:1px solid rgba(244,234,216,.16);border-radius:16px;padding:18px}
.pz-pic{display:block;width:100%;height:auto;max-height:520px;object-fit:contain;border-radius:14px;border:1px solid rgba(244,234,216,.16);background:#211b15}
.pz-sizes{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));border:1px solid rgba(244,234,216,.3);border-radius:12px;overflow:hidden;margin:8px 0 6px}
.pz-sizes a,.pz-sizes span{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:52px;font-size:15px;font-weight:800;text-decoration:none;border-right:1px solid rgba(244,234,216,.2);border-bottom:1px solid rgba(244,234,216,.2);margin:0 -1px -1px 0}
.pz-sizes a:hover{background:#2b241c}
.pz-sizes a.on{background:#f3d98b;color:#16120e}
.pz-sizes span{color:rgba(244,234,216,.35);background:#120e0b}
.pz-sizes small{font-size:11px;font-weight:600;opacity:.8}
.pz-note{font-size:13px !important;color:rgba(244,234,216,.6) !important}
.pz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;list-style:none;padding:0;margin:12px 0}
.pz-grid a{display:block;text-decoration:none;background:#211b15;border:1px solid rgba(244,234,216,.16);border-radius:14px;overflow:hidden}
.pz-grid img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
.pz-grid b{display:block;font-size:15px;padding:10px 12px 2px}
.pz-grid i{display:block;font-style:normal;font-size:12px;color:rgba(244,234,216,.6);padding:0 12px 12px}
.pz-faq h3{font-size:17px;font-weight:800;margin:18px 0 4px}
.pz-foot{margin-top:36px;padding-top:18px;border-top:1px solid rgba(244,234,216,.16);font-size:14px;color:rgba(244,234,216,.6)}
.pz-foot a{margin-right:16px}
.pz-bprose{max-width:720px;margin:0 auto;padding:22px 16px 8px}
.pz-bprose h1{font-size:26px}
@media (max-width:640px){.pz-in{padding:16px 14px 44px}.pz-sizes{grid-template-columns:repeat(3,minmax(0,1fr))}}
`;
