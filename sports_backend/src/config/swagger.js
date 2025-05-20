const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sports Event Management API',
      version: '1.0.0',
      description: 'API documentation for the Sports Event Management System',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Events',
        description: 'Event management endpoints',
      },
      {
        name: 'Event Management',
        description: 'Event type, age category, and schedule management',
      },
      {
        name: 'Reports',
        description: 'Reporting and analytics endpoints',
      },
      {
        name: 'System',
        description: 'System settings and backup management',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

module.exports = swaggerJsdoc(options); 