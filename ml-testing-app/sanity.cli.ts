import { defineCliConfig } from 'sanity/cli'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Manually load .env.local to guarantee it is picked up under any CLI context
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=')
      const key = parts[0]?.trim()
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '')
      if (key) {
        process.env[key] = value
      }
    }
  })
}

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

