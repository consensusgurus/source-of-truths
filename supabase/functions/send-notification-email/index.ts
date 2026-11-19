import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
// Mind Loft's address for everything since 2026-11-16 (owner, 2026-11-18). Takes effect only
// once this function is redeployed in Supabase.
const ADMIN_EMAIL = "m@mindloftdaily.com";

serve(async (req) => {
  try {
    const payload = await req.json();
    const { table, record } = payload;

    let subject = "";
    let htmlContent = "";

    // Raw mode: caller supplies subject + html directly (always sent to
    // ADMIN_EMAIL). Used by the weekly research summary cron on the site.
    // Gateway JWT verification is disabled for this function (the site's
    // sb_secret key is not a JWT), so raw mode authenticates here instead:
    // the apikey header must match the project's secret/service key.
    if (payload.type === "raw" && payload.subject && payload.html) {
      const expected =
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SB_SECRET_KEY") || "";
      const provided = req.headers.get("apikey") || "";
      if (!expected || provided !== expected) {
        console.error("raw mode auth mismatch", {
          expectedPrefix: expected.slice(0, 10),
          providedPrefix: provided.slice(0, 10),
        });
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      subject = String(payload.subject);
      htmlContent = String(payload.html);
    } else if (table === "user_lists") {
      subject = `New List Submission: ${record.title}`;
      htmlContent = `<p>New list submitted:</p>
            <p><strong>${record.title}</strong></p>
            <p>Category: ${record.category}</p>
            <p>Name: ${record.submitter_name || "Not provided"}</p>
            <p>Email: ${record.submitter_email || "Not provided"}</p>
            <p><a href="https://sourceoftruths.com/admin">View in Admin Panel</a></p>`;
    } else if (table === "complaints") {
      subject = `New Research Request: ${record.list_title}`;
      htmlContent = `<p>New research request:</p>
            <p><strong>${record.list_title}</strong></p>
            <p>Message: ${record.message || "No message"}</p>
            <p>Name: ${record.name || "Not provided"}</p>
            <p>Email: ${record.email || "Not provided"}</p>
            <p><a href="https://sourceoftruths.com/admin">View in Admin Panel</a></p>`;
    } else if (table === "extras") {
      subject = `New Vote Item Submitted: ${record.item_name}`;
      htmlContent = `<p>New user-submitted vote item:</p>
            <p><strong>${record.item_name}</strong></p>
            <p>List: ${record.list_id}</p>
            <p><a href="https://sourceoftruths.com/list/${record.list_id}">View the list</a> &middot; <a href="https://sourceoftruths.com/admin">View in Admin Panel</a></p>`;
    }

    if (!subject) {
      return new Response(JSON.stringify({ error: "Unknown ta