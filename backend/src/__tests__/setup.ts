let mongod: any;

export default async () => {
  try {
    // Use require so tsc does not fail if the package isn't installed
    // Tests should set MONGODB_TEST_URI externally if this package is not present.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_TEST_URI = mongod.getUri();

    process.on('exit', async () => {
      try {
        if (mongod) await mongod.stop();
      } catch (e) {
        // ignore
      }
    });
  } catch (err) {
    // mongodb-memory-server not installed — tests should provide MONGODB_TEST_URI
  }
};
