import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const loggerPlugin = () => ({
  name: 'dev-logger',
  configureServer(server: any) {
    server.middlewares.use('/api/log', (req: any, res: any) => {
      if (req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: any) => body += chunk)
        req.on('end', () => {
          try {
            const logs = JSON.parse(body)
            const logFile = path.resolve(__dirname, 'debug.log')
            const lines = logs.map((log: any) => `[${new Date().toISOString()}] [${log.level}] ${log.messages.join(' ')}`).join('\n') + '\n'
            fs.appendFileSync(logFile, lines)
          } catch (e) {}
          res.statusCode = 200
          res.end()
        })
      } else {
        res.statusCode = 404
        res.end()
      }
    })
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), loggerPlugin()],
})
