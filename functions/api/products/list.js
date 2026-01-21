export async function onRequestGet(context) {
  try {
    const { STORE_SCRIPT_URL, STORE_API_KEY } = context.env;

    if (!STORE_SCRIPT_URL) {
      return json({ ok: false, error: "missing_STORE_SCRIPT_URL" }, 500);
    }

    if (!STORE_API_KEY) {
      return json({ ok: false, error: "missing_STORE_API_KEY" }, 500);
    }

    const url = new URL(STORE_SCRIPT_URL);
    url.searchParams.set("action", "products_list");
    url.searchParams.set("key", STORE_API_KEY);

    const res = await fetch(url.toString(), { method: "GET" });

    const text = await res.text(); // <-- pega o texto bruto

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = { raw: text }; // <-- mostra HTML/erro bruto
    }

    return json({
      ok: res.ok && parsed.ok === true,
      status: res.status,
      store_ok: parsed.ok ?? null,
      store_response: parsed
    }, res.ok ? 200 : 400);

  } catch (e) {
    return json({ ok: false, error: "exception", message: e.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}