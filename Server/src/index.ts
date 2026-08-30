import app from './app.js'
import { testDatabaseConnection } from './config/db.js'
import { scheduleRecurringSweep } from './queues/recurringQueue.js'
import './workers/recurringWorker.js'
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

  try {
    await scheduleRecurringSweep()
  } catch (error) {
    console.error('⚠️ Failed to schedule recurring sweep:', error)
  }

  console.log(`🚀 Server is running on http://localhost:${PORT}`)
})
