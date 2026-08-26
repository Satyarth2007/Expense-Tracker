import app from './app.js'
import { testDatabaseConnection } from './config/db.js'
import dotenv from 'dotenv'


dotenv.config()

const PORT = process.env.PORT || 3000



app.listen(PORT, async () => {
  try {
    await testDatabaseConnection()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.log('⚠️ Database not connected yet:', error)
  }

  console.log(`🚀 Server is running on http://localhost:${PORT}`)
})
