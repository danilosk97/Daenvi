export async function onRequestGet(context) {
  try {
    const { STORE_SCRIPT_URL, STORE_API_KEY } = context.env;
    if (!STORE_SCRIPT_URL) return json({ ok: false, error: "missing_store_script_url" }, 500);
    if (!STORE_API_KEY) return json({ ok: false, error: "missing_store_api_key" }, 500);

    const url = new URL(STORE_SCRIPT_URL);
    url.searchParams.set("action", "products_list");
    url.searchParams.set("key", STORE_API_KEY);

    const res = await fetch(url.toString(), { method: "GET" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) return json({ ok: false, error: "store_error", details: data }, 400);

    return json({ ok: true, data: data.data || [] });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}