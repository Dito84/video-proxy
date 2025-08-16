// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const app = express();

// Middleware para permitir CORS
app.use(cors());

// Ruta principal
app.get('/', (req, res) => {
  res.send(`
    <h2>🎥 Proxy de Video Activo</h2>
    <p>Usa: <code>/proxy?url=URL_DEL_VIDEO</code></p>
    <p>Ejemplo: <a href="/proxy?url=https://example.com/video.mp4">/proxy?url=https://example.com/video.mp4</a></p>
  `);
});

// Proxy para videos
app.use('/proxy', createProxyMiddleware({
  target: '',
  changeOrigin: true,
  selfHandleResponse: false,
  logLevel: 'info',
  onProxyReq: (proxyReq, req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      res.status(400).send('Falta el parámetro "url"');
      return;
    }

    try {
      const url = new URL(videoUrl);
      proxyReq.setHeader('Origin', url.origin);
      proxyReq.setHeader('Referer', url.origin);
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      proxyReq.path = url.pathname + url.search;
      proxyReq.host = url.host;
      proxyReq.protocol = url.protocol;
    } catch (err) {
      res.status(400).send('URL inválida');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Permitir CORS
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD';
    proxyRes.headers['Access-Control-Allow-Headers'] = '*';
    // Permitir reproducción con seek
    proxyRes.headers['Accept-Ranges'] = 'bytes';
    proxyRes.headers['Content-Type'] = 'video/mp4'; // Puedes ajustarlo
  },
  router: (req) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return 'http://localhost:8080/fallback'; // fallback
    try {
      return new URL(videoUrl).origin;
    } catch {
      return 'http://localhost:8080';
    }
  },
}));

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy escuchando en el puerto ${PORT}`);
});
