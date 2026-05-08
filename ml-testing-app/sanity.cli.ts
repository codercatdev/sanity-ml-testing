import { defineCliConfig } from 'sanity/cli'
import { loadEnv } from 'vite'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables at the top level to ensure they are available
// when defineCliConfig is evaluated (such as for organizationId).
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const envDir = path.resolve(__dirname, '..');
const env = loadEnv(mode, envDir, '');

// Populate process.env with the loaded variables
process.env = { ...process.env, ...env };

export default defineCliConfig({
  app: {
    organizationId: process.env.SANITY_STUDIO_ORGANIZATION_ID || process.env.SANITY_ORGANIZATION_ID,
    entry: './src/App.tsx',
  },
  vite: async (viteConfig) => {
    return {
      ...viteConfig,
      define: {
        'process.env.SANITY_API_TOKEN': JSON.stringify(process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN),
        'process.env.SANITY_PROJECT_ID': JSON.stringify(process.env.SANITY_PROJECT_ID),
        'process.env.SANITY_DATASET': JSON.stringify(process.env.SANITY_DATASET),
        'process.env.SANITY_API_VERSION': JSON.stringify(process.env.SANITY_API_VERSION),
      },
    }
  }
})

