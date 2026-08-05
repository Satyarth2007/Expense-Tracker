import express from 'express';
import { pool } from './config/db.js'
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.json());




app.get('/', (req, res) => {
    res.send('Hello, World!');
});


// Connect to the database pool
pool.connect().then
    (() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    })
