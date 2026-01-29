import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = env.VITE_APP_BASE_NAME || '/';
  const API_BASE_URL = env.VITE_API_URL || 'http://localhost:8080/api';
  const PORT = 3000;

  return {
    base: API_URL,
    // Force host to localhost and disable auto open to avoid external preview links (Codespaces previews)
    server: {
      open: false,
      port: PORT,
      host: 'localhost'
    },
    preview: {
      open: false,
      host: 'localhost'
    },
    define: {
      global: 'window' // Only if you need it for legacy packages
    },
    resolve: {
      alias: {
        '@ant-design/icons': path.resolve(__dirname, 'node_modules/@ant-design/icons')
        // Add more aliases as needed
      }
    },
    plugins: [react(), jsconfigPaths()],

    optimizeDeps: {
      include: ['@mui/material/Tooltip', 'react', 'react-dom', 'react-router-dom']
    },
    build: {
      chunkSizeWarningLimit: 1000, // Raise warning limit to 1000kb
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('exceljs')) return 'vendor-excel';
              if (id.includes('@mui')) return 'vendor-mui';
              if (id.includes('chart') || id.includes('apexcharts') || id.includes('recharts')) return 'vendor-charts';
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
              if (id.includes('lodash') || id.includes('axios') || id.includes('date-fns') || id.includes('dayjs') || id.includes('yup') || id.includes('formik')) return 'vendor-utils';
              if (id.includes('jspdf') || id.includes('html5-qrcode') || id.includes('zxcvbn')) return 'vendor-libs';
            }
          }
        }
      }
    }
  };
});