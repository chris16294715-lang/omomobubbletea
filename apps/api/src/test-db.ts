import mongoose from 'mongoose';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../../.env') });
config({ path: join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

async function main() {
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  console.log('Variable: MONGODB_URI');
  console.log('Connecting to MongoDB Atlas...');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();

  console.log('Connected successfully!');
  console.log('Database:', db.databaseName);
  console.log(
    'Collections:',
    collections.length ? collections.map((c) => c.name).join(', ') : '(empty, ready for seed)',
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Connection failed:', err.message);
  process.exit(1);
});
