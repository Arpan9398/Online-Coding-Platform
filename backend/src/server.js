import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config.js';
import { seed } from './seed.js';

try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
} catch (err) {
  console.error(`\nCould not connect to MongoDB at ${config.mongoUri}\n${err.message}`);
  console.error('Start MongoDB (for example: docker compose up -d) or set MONGO_URI in backend/.env\n');
  process.exit(1);
}

await seed();
app.listen(config.port, () => console.log(`API running on http://localhost:${config.port}`));
