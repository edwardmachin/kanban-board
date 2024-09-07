# Full Stack Kanban Board Application

This project is a full-stack Kanban board application, designed to help teams manage their work efficiently.

## Prerequisites

Before you begin, ensure you have the following installed. Specified versions are guidelines based on what the application was developed with:

- Node.js: v21.7.3 or later
  - [Download](https://nodejs.org/en/download/)
- PNPM: v9.9.0 or later
  - [Installation guide](https://pnpm.io/installation)
- Docker: v27.1.1 or later
  - [Installation guide](https://docs.docker.com/engine/install/)
- Docker Desktop: v4.33.1 or later (Optional)
  - [Download](https://www.docker.com/products/docker-desktop/)

## Project Structure

The project is organized into a monorepo with the following structure:

```
/
├── packages/
│   ├── api/
│   └── ui/
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── docker-compose.test.yml
└── package.json
```

## Setup Development Environment

1. Clone the repository
2. Modify `docker-compose.dev.yml` to use required environment variables.
3. Modify `.env` files inside `/packages/api` and `/packages/ui` to match and ensure values are correct. Example:

   ```env
   # /packages/api/.env
   DATABASE_URL="postgresql://user:password@localhost:5432/kanban_db"
   REDIS_URL="redis://localhost:6379"

   # /packages/ui/.env
   REACT_APP_API_URL="http://localhost:3001"
   ```

4. At the root level, run the following commands:
   ```bash
   pnpm install
   pnpm docker:dev
   pnpm prisma:generate
   pnpm prisma:migrate:dev
   pnpm dev
   ```
   This will install dependencies, start Docker containers, generate Prisma client, run migrations, and start the development servers.
5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Setup Production Environment

1. Modify `docker-compose.prod.yml` to use required environment variables.
2. At the root level, run the following command:
   ```bash
   pnpm prod
   ```
   This command will build the application and start the production Docker containers.
3. Access the production application:

   - Frontend: http://localhost (or your configured domain)
   - Backend API: http://localhost:3000 (or your configured API domain)
   - Hocuspocus API: http://localhost:3001 (or your configured API domain)

### Container Breakdown

| Container    | Description                                                                                              | Network      |
| ------------ | -------------------------------------------------------------------------------------------------------- | ------------ |
| **migrate**  | Used to migrate the database to keep it in sync with the Prisma schema. Will stop once finished running. | **Internal** |
| **postgres** | PostgreSQL database                                                                                      | **Internal** |
| **redis**    | Redis caching server                                                                                     | **Internal** |
| **api**      | Node.js API                                                                                              | **External** |
| **ui**       | Nginx container with the built React UI                                                                  | **External** |

### Deployment Recommendations

When deploying this application to a production environment, it's important to consider security and performance. We recommend using a reverse proxy to handle SSL/TLS termination and to set up HTTPS. This approach provides several benefits:

- SSL/TLS termination: The reverse proxy can handle the SSL/TLS encryption and decryption, reducing the load on your application servers.
- Easy certificate management: You can manage SSL certificates at the reverse proxy level, making it easier to update and renew certificates without modifying the application containers.
- Load balancing: A reverse proxy can distribute incoming requests across multiple application instances for better performance and reliability.
- Additional security: The reverse proxy can act as an additional layer of security, helping to protect your application from certain types of attacks.

#### Recommended Setup

- Reverse Proxy: We recommend using Nginx or Traefik as a reverse proxy. Both are powerful, flexible, and well-suited for Docker environments.
- SSL/TLS Certificates: Use Let's Encrypt to obtain free, automated SSL/TLS certificates. Both Nginx and Traefik have integrations that make it easy to automatically obtain and renew certificates.
- Docker Network: Create a separate Docker network for your reverse proxy and connect your application containers to it. This allows the reverse proxy to communicate with your containers while keeping them isolated from the public internet.

## Setup Test Environment

1. Modify `docker-compose.test.yml` to use required environment variables.
2. Modify `.env` files inside `/packages/api` and `/packages/ui` to match and ensure values are correct for the test environment.
3. Modify the endpoint in the `cypress.config.ts` inside of `/packages/ui`. Example:
   ```typescript
   export default defineConfig({
   	viewportWidth: 1920,
   	viewportHeight: 1080,
   	component: {
   		devServer: {
   			framework: "react",
   			bundler: "vite",
   		},
   	},
   	e2e: {
   		baseUrl: "http://localhost",
   	},
   });
   ```
4. At the root level, run the following command:
   ```bash
   pnpm test
   ```
   This will start the test environment and run the test suite.

## Troubleshooting

- If you encounter issues with Docker, ensure Docker Desktop is running and try restarting it.
- For database connection issues, check that the `DATABASE_URL` in your `.env` file matches the credentials in your Docker Compose file.
- If the frontend can't connect to the backend, verify that the `REACT_APP_API_URL` in the UI `.env` file is correct.

## Contributing

We welcome contributions to improve the Kanban Board Application. Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with clear, descriptive messages
4. Push your changes to your fork
5. Submit a pull request to the main repository

Please ensure your code adheres to the existing style conventions and includes appropriate tests.

## License

See the [LICENSE](LICENSE) file for details.
