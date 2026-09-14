"""Local preview server.

Identical to `python -m http.server` except for two development conveniences:

  * every response carries `Cache-Control: no-store`, so edits to CSS and JS
    show up on reload instead of being masked by a cached copy;
  * `POST /__capture/<name>.png` writes a base64 image body to
    `.captures/<name>.png`, which lets a page hand a rendered <canvas> back
    for inspection without squeezing it through the console.

Development only. Vercel serves the real thing.
"""
import base64
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

CAPTURE_DIR = ".captures"


class DevHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_POST(self):
        if not self.path.startswith("/__capture/"):
            self.send_error(404)
            return
        name = os.path.basename(self.path)
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        os.makedirs(CAPTURE_DIR, exist_ok=True)
        with open(os.path.join(CAPTURE_DIR, name), "wb") as fh:
            fh.write(base64.b64decode(body))
        self.send_response(204)
        self.end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s\n" % (fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    ThreadingHTTPServer(("127.0.0.1", port), partial(DevHandler, directory=".")).serve_forever()
