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

## API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### File Operations

#### Create Directory
```http
POST /api/files/directories
Content-Type: application/json
Authorization: Bearer <token>

{
    "path": "parent/directory",
    "name": "new-directory"
}
```

#### Upload File
```http
POST /api/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- file: <file>
- path: "target/directory"
```

#### Get Files
```http
GET /api/files?path=<directory_path>
Authorization: Bearer <token>

Query Parameters:
- path: Directory path to list files from
- search: Search query (optional)
- searchType: "name" | "metadata" | "all" (optional)
- metadata: JSON object for metadata search (optional)
```

#### Download File
```http
GET /api/files/download?path=<file_path>
Authorization: Bearer <token>

Query Parameters:
- path: Path of the file to download
```

#### Delete File
```http
DELETE /api/files?path=<file_path>
Authorization: Bearer <token>

Query Parameters:
- path: Path of the file to delete
```

### Permission Management

#### Set Permissions
```http
POST /api/permissions/set
Content-Type: application/json
Authorization: Bearer <token>

{
    "path": "file/or/directory/path",
    "accessType": "private|public|shared",
    "sharedWith": [
        {
            "email": "user@example.com",
            "permissions": {
                "read": true,
                "write": false,
                "delete": false
            }
        }
    ]
}
```

#### Get Permissions
```http
GET /api/permissions?path=<file_path>
Authorization: Bearer <token>

Query Parameters:
- path: Path of the file/directory to get permissions for
```

#### Remove Access
```http
DELETE /api/permissions
Content-Type: application/json
Authorization: Bearer <token>

{
    "path": "file/or/directory/path",
    "userId": "user_id_to_remove"
}
```

#### Get Shared Items
```http
GET /api/permissions/shared
Authorization: Bearer <token>
```

### Version Control

#### Get File Versions
```http
GET /api/files/versions?path=<file_path>
Authorization: Bearer <token>

Query Parameters:
- path: Path of the file to get versions for
```

#### Rollback Version
```http
POST /api/files/versions/:version/rollback?path=<file_path>
Authorization: Bearer <token>

Query Parameters:
- path: Path of the file to rollback
- version: Version number to rollback to
```

#### Delete Version
```http
DELETE /api/files/versions/:version?path=<file_path>
Authorization: Bearer <token>

Query Parameters:
- path: Path of the file
- version: Version number to delete
```

### Metadata Operations

#### Search by Metadata
```http
GET /api/files/search
Authorization: Bearer <token>

Query Parameters:
- metadata: JSON object containing metadata search criteria
Example: ?metadata={"type":"document","status":"draft"}
```

#### Update Metadata
```http
PUT /api/files/metadata
Content-Type: application/json
Authorization: Bearer <token>

{
    "path": "file/path",
    "metadata": {
        "type": "document",
        "status": "draft",
        "tags": ["important", "project"],
        "customField": "value"
    }
}
```

#### Get Metadata
```http
GET /api/files/metadata?path=<file_path>
Authorization: Bearer <token>

Query Parameters:
- path: Path of the file to get metadata for
```

## Response Formats

### Success Response
```json
{
    "message": "Operation successful",
    "data": {
        // Response data specific to the operation
    }
}
```

### Error Response
```json
{
    "error": "Error message",
    "details": "Detailed error information (if available)"
}
```

## Common HTTP Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

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