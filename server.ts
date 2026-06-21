import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createApiApp } from "./src/server/apiApp";

const app = createApiApp();
const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=== Vesta Platform Server Running on http://0.0.0.0:${PORT} ===`);
  });
}

void startServer();
