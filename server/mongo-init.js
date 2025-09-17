// MongoDB initialization script
db = db.getSiblingDB('virallens_chatbot');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password must be at least 6 characters'
        },
        firstName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'First name is required and must be between 1-50 characters'
        },
        lastName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Last name is required and must be between 1-50 characters'
        }
      }
    }
  }
});

db.createCollection('conversations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'title', 'messages', 'model'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'User ID must be a valid ObjectId'
        },
        title: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Title must be between 1-200 characters'
        },
        messages: {
          bsonType: 'array',
          maxItems: 100,
          items: {
            bsonType: 'object',
            required: ['role', 'content', 'createdAt'],
            properties: {
              role: {
                enum: ['user', 'assistant', 'system'],
                description: 'Role must be user, assistant, or system'
              },
              content: {
                bsonType: 'string',
                minLength: 1,
                maxLength: 10000,
                description: 'Content must be between 1-10000 characters'
              },
              createdAt: {
                bsonType: 'date',
                description: 'CreatedAt must be a date'
              }
            }
          }
        },
        model: {
          bsonType: 'string',
          minLength: 1,
          description: 'Model must be a non-empty string'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.conversations.createIndex({ userId: 1, updatedAt: -1 });
db.conversations.createIndex({ userId: 1, createdAt: -1 });
db.conversations.createIndex({ 'messages.createdAt': -1 });

print('Database initialized successfully');
