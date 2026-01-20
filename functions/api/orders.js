// functions/api/orders.js
export async function onRequest(context) {
  const { request } = context;

  // ====== CONFIG ======
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxeueroFgMjm5pFh01Aj55tkF8EvOZCaktQaPjjdetcx23JaOHRMYGxXCK_i_vFDKsb/exec";

  // CORS (agora liberamos pro seu próprio site)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  // Repassa para o Apps Script
  try {
    const url = new URL(APPS_SCRIPT_URL);

    if (request.method === "GET") {
      const inUrl = new URL(request.url);
      // repassa querystring inteira
      inUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

      const res = await fetch(url.toString(), { method: "GET" });
      const text = await res.text();

      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "POST") {
      const bodyText = await request.text();

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyText
      });

      const text = await res.text();

      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}