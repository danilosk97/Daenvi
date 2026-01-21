// functions/api/products.js
export async function onRequest(context) {
  const { request } = context;

  // COLE A MESMA URL /exec DO SEU APPS SCRIPT (A QUE DEU CERTO AGORA)
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx6z6hD9iORhK6E9MARxKopbysGVaunBZUYGXv5beBPgHg4RiHcEmdP9JNPkCnrwHTj/exec";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method === "GET") {
      const incomingUrl = new URL(request.url);
      const upstreamUrl = new URL(APPS_SCRIPT_URL);

      incomingUrl.searchParams.forEach((v, k) => upstreamUrl.searchParams.set(k, v));

      const res = await fetch(upstreamUrl.toString(), { method: "GET" });
      const text = await res.text();

      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "POST") {
      const bodyJson = await request.json();

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyJson)
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