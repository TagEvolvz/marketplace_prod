// MongoDB initialization script
// Runs when the container starts for the first time

db = db.getSiblingDB('marketplace');

// Create app user with restricted permissions
db.createUser({
  user: 'marketplace_app',
  pwd: 'marketplace_app_password',
  roles: [
    { role: 'readWrite', db: 'marketplace' }
  ]
});

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['firstName', 'lastName', 'email', 'password', 'role'],
      properties: {
        email: { bsonType: 'string', pattern: '^\\S+@\\S+\\.\\S+$' },
        role: { enum: ['customer', 'vendor', 'admin'] }
      }
    }
  }
});

db.createCollection('products');
db.createCollection('orders');
db.createCollection('vendors');
db.createCollection('reviews');
db.createCollection('categories');
db.createCollection('carts');
db.createCollection('notifications');
db.createCollection('payments');

// Indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ name: 'text', description: 'text', tags: 'text' });
db.vendors.createIndex({ storeSlug: 1 }, { unique: true });
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ user: 1, createdAt: -1 });
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

print('✅ MongoDB marketplace database initialized successfully');
