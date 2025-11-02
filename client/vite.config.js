import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [
    // Comment out mkcert if you don't want HTTPS (wallet won't work)
    // mkcert(),  // <-- Uncomment this to enable HTTPS for wallet features
    wasm()
  ],
  server: {
    https: false,  // Set to true with mkcert for wallet features
    port: 3000,
  },
});
