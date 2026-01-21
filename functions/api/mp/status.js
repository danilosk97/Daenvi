export async function onRequestGet(context) {
  try {
    const { MP_ACCESS_TOKEN } = context.env;
    if (!MP_ACCESS_TOKEN) return json({ ok: false, error: "missing_mp_token" }, 500);

    const url = new URL(context.request.url);
    const payment_id = url.searchParams.get("payment_id");
    if (!payment_id) return json({ ok: false, error: "missing_payment_id" }, 400);

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(payment_id)}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });

    const data = await res.json();
    if (!res.ok) return json({ ok: false, error: "mp_error", details: data }, 400);

    return json({
      ok: true,
      status: data.status,                 // approved | pending | rejected
      status_detail: data.status_detail,
      external_reference: data.external_reference,
      transaction_amount: data.transaction_amount,
      payment_method_id: data.payment_method_id,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}