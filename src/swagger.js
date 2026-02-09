import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Smart Reminder API",
      version: "1.0.0",
      description: "API for Smart Reminder application",
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT", // optional, just for display
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
    ],
  },
  apis: ["./src/routes/*.js"], // path to your route files for annotations
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
