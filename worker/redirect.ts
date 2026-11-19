export default {
  async fetch(request: Request) {
    const destination = new URL(request.url);
    if (destination.pathname === "/_draft-migration") {
      return new Response(`<!doctype html><meta charset="utf-8"><script>
        let draft=null;
        try {
          const stored=localStorage.getItem('acsv.workbench.v1');
          if(stored) draft=JSON.parse(stored);
          else {
            const input=localStorage.getItem('ACSVEditor_input');
            if(input!==null) draft={input,title:localStorage.getItem('ACSVEditor_title')||'Imported draft',mode:'acsv',format:'csv'};
          }
        } catch {}
        parent.postMessage({type:'zrow-draft-migration',draft},'https://zrow.majaku.com');
      </script>`, { headers: {
        "Content-Type": "text/html;charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "frame-ancestors https://zrow.majaku.com",
        "Referrer-Policy": "no-referrer",
      } });
    }
    destination.hostname = "zrow.majaku.com";
    destination.protocol = "https:";
    destination.port = "";
    return new Response(null, { status: 308, headers: {
      Location: destination.toString(),
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    } });
  },
};
