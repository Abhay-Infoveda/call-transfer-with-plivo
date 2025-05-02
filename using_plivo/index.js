// index.js
import express from 'express';
import 'dotenv/config';
import { router as plivoRoutes } from './routes/plivo.js';

const port = 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount the Plivo routes
app.use('/plivo/', plivoRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});