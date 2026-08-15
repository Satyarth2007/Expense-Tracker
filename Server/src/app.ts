import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'Server is running' })
})

// Error handling middleware
app.use((err: Error, _req: Request, res: Response) => {
  console.error('Error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
