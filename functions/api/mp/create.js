export async function onRequestPost(context) {
  try {
    const { MP_ACCESS_TOKEN } = context.env;
    if (!MP_ACCESS_TOKEN) {
      return json({ ok: false, error: "missing_mp_token" }, 500);
    }

    const body = await context.request.json();
    const { orderId, title, amount, backUrl } = body || {};

    if (!orderId || !title || !amount || !backUrl) {
      return json({ ok: false, error: "missing_fields" }, 400);
    }

    const preference = {
      items: [
        {
          title: String(title),
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(amount),
        },
      ],
      external_reference: String(orderId),
      back_urls: {
        success: `${backUrl}?orderId=${encodeURIComponent(orderId)}&mp=success`,
        pending: `${backUrl}?orderId=${encodeURIComponent(orderId)}&mp=pending`,
        failure: `${backUrl}?orderId=${encodeURIComponent(orderId)}&mp=failure`,
      },
      auto_return: "approved",
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();

    if (!res.ok) {
      return json({ ok: false, error: "mp_error", details: data }, 400);
    }

    return json({
      ok: true,
      preferenceId: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
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