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

1. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

2. To run in detached mode:
   ```bash
   docker-compose up -d
   ```

3. To stop the containers:
   ```bash
   docker-compose down
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