# Simple Cloud Storage

A secure and efficient cloud storage solution built with Node.js, Express, and MongoDB. This application provides a robust file storage system with features like file versioning, metadata management, and granular access control.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication system
- 📁 **File Management**:
  - Upload and download files
  - Create directories
  - File versioning
  - Metadata management
- 🔒 **Access Control**:
  - Granular permissions system
  - Private and public file sharing
  - User-specific access controls
- 🔄 **Version Control**:
  - Track file versions
  - Rollback to previous versions
  - Version history management
- 📊 **Metadata Support**:
  - Custom metadata for files
  - Metadata-based search
  - File categorization

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ShubhangiRaghuvanshi/simple-cloud-storage.git
cd simple-cloud-storage
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/simple-cloud-storage
JWT_SECRET=your_jwt_secret
```

4. Start the server:
```bash
cd src
node index.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Files
- `GET /api/files` - List files and directories
- `POST /api/files/upload` - Upload a file
- `GET /api/files/download` - Download a file
- `DELETE /api/files` - Delete a file
- `POST /api/files/directories` - Create a directory

### File Versions
- `GET /api/files/versions` - Get file versions
- `GET /api/files/versions/:version` - Get specific version
- `POST /api/files/versions/:version/rollback` - Rollback to version
- `DELETE /api/files/versions/:version` - Delete version

### Permissions
- `POST /api/permissions/set` - Set file permissions
- `GET /api/permissions` - Get file permissions
- `DELETE /api/permissions` - Remove access
- `GET /api/permissions/shared` - Get shared items

### Metadata
- `GET /api/files/metadata` - Get file metadata
- `PUT /api/files/metadata` - Update file metadata
- `GET /api/files/search` - Search files by metadata

## Project Structure

```
simple-cloud-storage/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── index.js        # Application entry point
├── uploads/            # File storage directory
├── .env               # Environment variables
├── .gitignore        # Git ignore file
└── package.json      # Project dependencies
```

## Security Features

- JWT-based authentication
- Password hashing
- File access control
- Secure file storage
- Environment variable protection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Shubhangi Raghuvanshi

## Acknowledgments

- Express.js
- MongoDB
- JWT
- Node.js 