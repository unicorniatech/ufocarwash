const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function send404(response) {
  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const fullPath = path.normalize(path.join(root, requested));
  return fullPath.startsWith(root) ? fullPath : null;
}

const server = http.createServer((request, response) => {
  const filePath = safePath(request.url || "/");
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send404(response);
    return;
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = types[ext] || "application/octet-stream";

  if (ext === ".mp4" && request.headers.range) {
    const range = request.headers.range.replace(/bytes=/, "").split("-");
    const start = parseInt(range[0], 10);
    const end = range[1] ? parseInt(range[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;

    response.writeHead(206, {
      "content-range": `bytes ${start}-${end}/${stat.size}`,
      "accept-ranges": "bytes",
      "content-length": chunkSize,
      "content-type": contentType,
    });
    fs.createReadStream(filePath, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, {
    "accept-ranges": ext === ".mp4" ? "bytes" : "none",
    "content-length": stat.size,
    "content-type": contentType,
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`UFO Carwash running at http://127.0.0.1:${port}`);
});
