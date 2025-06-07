# Simple Cloud Storage

A simple cloud storage solution built with Node.js, Express, and MongoDB. This application provides file storage, versioning, and metadata management capabilities.

## Features

- File upload and download
- Directory management
- File versioning
- Metadata management
- User authentication
- Permission management
- Search functionality
- Docker support

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Docker and Docker Compose (for containerized deployment)

## Installation

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/simple-cloud-storage.git
   cd simple-cloud-storage
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/simple-cloud-storage
   PORT=3000
   JWT_SECRET=your_jwt_secret
   ```

4. Start the application:
   ```bash
   npm start
   ```

### Docker Deployment

#### Prerequisites for Docker
1. Install Docker Desktop:
   - Download from [Docker's official website](https://www.docker.com/products/docker-desktop)
   - Follow the installation instructions for your operating system
   - For Windows users:
     ```powershell
     # Enable WSL 2
     wsl --install
     # Restart your computer after installation
     ```

2. Verify Docker installation:
   ```bash
   docker --version
   docker-compose --version
   ```

#### Running with Docker

1. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
   This will:
   - Build the Node.js application container
   - Pull and start the MongoDB container
   - Set up the network between containers
   - Create necessary volumes

2. Run in detached mode (background):
   ```bash
   docker-compose up -d
   ```

3. View logs:
   ```bash
   # All containers
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f app
   ```

4. Stop the containers:
   ```bash
   docker-compose down
   ```

#### Docker Commands Reference

```bash
# Rebuild containers
docker-compose build

# Start containers
docker-compose up

# Stop containers
docker-compose down

# View running containers
docker-compose ps

# Execute command in container
docker-compose exec app npm install <package>

# View container logs
docker-compose logs -f

# Remove all containers and volumes
docker-compose down -v
```

#### Docker Troubleshooting

1. **Container fails to start**
   ```bash
   # Check logs
   docker-compose logs app
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

2. **MongoDB connection issues**
   - Ensure MongoDB container is running: `docker-compose ps`
   - Check MongoDB logs: `docker-compose logs mongodb`
   - Verify network: `docker network ls`

3. **Permission issues with uploads**
   ```bash
   # Fix permissions on uploads directory
   docker-compose exec app chown -R node:node /usr/src/app/uploads
   ```

4. **Container cleanup**
   ```bash
   # Remove all containers and volumes
   docker-compose down -v
   
   # Remove all images
   docker-compose down --rmi all
   ```

#### Docker Environment Variables

The following environment variables can be set in the `docker-compose.yml` file:

```yaml
environment:
  - MONGODB_URI=mongodb://mongodb:27017/simple-cloud-storage
  - PORT=3000
  - JWT_SECRET=your_jwt_secret
```

#### Docker Volumes

The application uses the following volumes:
- `./uploads:/usr/src/app/uploads` - For persistent file storage
- `mongodb_data:/data/db` - For MongoDB data persistence

#### Docker Network

The application uses a default Docker network created by docker-compose. The services can communicate using their service names:
- Application service: `app`
- MongoDB service: `mongodb`

#### Docker Health Checks

To check if the services are running properly:

```bash
# Check container status
docker-compose ps

# Check application logs
docker-compose logs app

# Check MongoDB logs
docker-compose logs mongodb
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Files
- `GET /api/files` - List files and directories
- `POST /api/files/upload` - Upload a file
- `GET /api/files/download` - Download a file
- `DELETE /api/files` - Delete a file or directory
- `POST /api/files/directories` - Create a new directory

### Versioning
- `GET /api/files/versions` - Get file versions
- `GET /api/files/versions/:version` - Get specific version
- `POST /api/files/versions/:version/rollback` - Rollback to version
- `DELETE /api/files/versions/:version` - Delete version

### Metadata
- `PATCH /api/files/metadata` - Update file metadata
- `GET /api/files/metadata` - Get file metadata
- `GET /api/files/search` - Search files by metadata

## File Structure

```
simple-cloud-storage/
├── src/
│   ├── controllers/
│   │   ├── fileController.js
│   │   └── authController.js
│   ├── models/
│   │   ├── File.js
│   │   ├── FileVersion.js
│   │   └── Permission.js
│   ├── routes/
│   │   ├── fileRoutes.js
│   │   └── authRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── storage.js
│   └── index.js
├── uploads/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `PORT`: Application port (default: 3000)
- `JWT_SECRET`: Secret key for JWT token generation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email your-email@example.com or open an issue in the GitHub repository. 