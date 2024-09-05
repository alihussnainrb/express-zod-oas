# Express Zod OAS

A powerful wrapper around Express.js that integrates Zod for request validation and automatic OpenAPI documentation generation.

## Features

- Built on top of Express.js
- Zod integration for request validation (body, params, query)
- Automatic OpenAPI (v3.1) specification generation
- Built-in documentation UI options (Scalar and Redoc)
- TypeScript support
- Easy-to-use API for defining routes with OpenAPI metadata
- Support for middleware
- Mock example generation for request/response schemas

## Installation

```bash
npm install express-zod-oas
```

## Quick Start

```typescript
import { Application, z } from 'express-zod-oas';

const app = new Application({
  openapi: {
    info: {
      title: 'My API',
      version: '1.0.0',
    },
  },
});

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

app.openapi({
  method: 'get',
  path: '/users/:id',
  tags: ['Users'],
  operationId: 'getUserById',
  validate: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Successful response',
      content: {
        type: 'application/json',
        schema: UserSchema,
      },
    },
  },
  handler: async (ctx) => {
    // Your handler logic here
    ctx.respond(200, { id: ctx.req.params.id, name: 'John Doe', email: 'john@example.com' });
  },
});

app.listen(3000);
```

## API Reference

### `Application`

The main class for creating your application.

#### Constructor

```typescript
new Application(options?: Partial<ApplicationOptions>)
```

Options:
- `openapi`: OpenAPI specification options
- `docs`: Configuration for documentation UI
- `jsonPath`: Path to serve the OpenAPI JSON (default: '/api/openapi.json')
- `generateMockExamples`: Whether to generate mock examples for schemas (default: true)

#### Methods

- `openapi<TBody, TParams, TQuery>(config: RouteConfig<TBody, TParams, TQuery>)`: Define a route with OpenAPI metadata
- `listen(port: number)`: Start the server
- `registerRouter(params: { prefix: string; router: Router; middlewares?: RequestHandler[] })`: Register a router with a prefix
- `getSpec()`: Get the OpenAPI specification object
- `getSpecAsJson()`: Get the OpenAPI specification as a JSON string
- `getExpressApp()`: Get the underlying Express application

### `Router`

A class for creating modular route handlers.

#### Methods

- `openapi<TBody, TParams, TQuery>(config: RouteConfig<TBody, TParams, TQuery>)`: Define a route with OpenAPI metadata
- `getExpressRouter()`: Get the underlying Express router
- `getRoutes()`: Get all defined routes

## Documentation

By default, the OpenAPI specification is served at `/api/openapi.json`. 

Documentation UIs are automatically set up:
- Scalar docs: `/docs`
- Redoc: `/redocly`

To use Swagger UI, install the `swagger-ui` package and configure it to use the OpenAPI JSON URL or the specification object from `application.getSpec()`.

## Advanced Usage

### Using Express Response

If you need to access the Express response object directly:

```typescript
handler: async (ctx) => {
  ctx.res.status(200).json({ message: 'Hello, World!' });
}
```

### Accessing the Underlying Express App

```typescript
const expressApp = app.getExpressApp();
```

### Disabling Mock Example Generation

```typescript
const app = new Application({ generateMockExamples: false });
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
