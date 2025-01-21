import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import dalleRoutes from './routes/dalle.routes.ts'
dotenv.config();

const app = express()
app.use(cors());
app.use(express.json({ limit: '50mb'}))

app.use('/api/v1/dalle', dalleRoutes)

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello from DALL.E'})
})

app.listen(8080, () => console.log('Server running on port 8080'))