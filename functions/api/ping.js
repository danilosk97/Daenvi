export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, pong: true }), {
    headers: { "Content-Type": "application/json" }
  });
}