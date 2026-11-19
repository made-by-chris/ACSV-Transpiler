export default {
  async fetch(request: Request) {
    const destination = new URL(request.url);
    destination.hostname = "zrow.majaku.com";
    destination.protocol = "https:";
    destination.port = "";
    return new Response(null, {
      status: 308,
      headers: {
        Location: destination.toString(),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  },
};
