import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | undefined;

export default async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_TEST_URI = mongod.getUri();

  // Ensure the in-memory server is stopped when the process exits
  process.on('exit', async () => {
    try {
      if (mongod) await mongod.stop();
    } catch (e) {
      // ignore
    }
  });
};
