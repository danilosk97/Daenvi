export async function onRequestPost(context) {
  try {
    const { STORE_SCRIPT_URL, STORE_API_KEY } = context.env;
    if (!STORE_SCRIPT_URL) return json({ ok: false, error: "missing_store_script_url" }, 500);
    if (!STORE_API_KEY) return json({ ok: false, error: "missing_store_api_key" }, 500);

    const body = await context.request.json();
    const id = String(body.id || "").trim();
    if (!id) return json({ ok: false, error: "missing_id" }, 400);

    const res = await fetch(STORE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "product_delete",
        key: STORE_API_KEY,
        id
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return json({ ok: false, error: "store_error", details: data }, 400);

    return json({ ok: true });
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