import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl =
    process.env.VITE_BACKEND_URL ||
    env.VITE_BACKEND_URL ||
    "http://127.0.0.1:3000";

  return {
    plugins: [react()],



    // =====================================
    // CONFIGURACIÓN DE SASS
    // =====================================
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: [
            "import",
            "global-builtin",
            "color-functions",
            "if-function",
          ],
        },
      },
    },
    
    server: {
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
