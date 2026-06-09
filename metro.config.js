// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite sur le web charge un module WebAssembly (wa-sqlite).
// 1) Autoriser la résolution des fichiers .wasm comme assets.
config.resolver.assetExts.push('wasm');

// 2) En-têtes COOP/COEP requis par SharedArrayBuffer (worker SQLite web).
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  };
};

module.exports = config;
