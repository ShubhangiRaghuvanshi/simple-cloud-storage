# Simple Cloud Storage

A simple cloud storage application that allows users to upload, download, and manage files through a modern web interface.

## Features

- File upload with drag-and-drop support
- File download
- File listing
- File deletion
- Modern and responsive UI
- Progress tracking for uploads

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or a remote instance)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd simple-cloud-storage
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cloud-storage
JWT_SECRET=your-super-secret-jwt-key
UPLOAD_DIR=uploads
```

4. Create the uploads directory:
```bash
mkdir uploads
```

## Running the Application

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Development

To run the application in development mode with auto-reload:
```bash
npm run dev
```

## API Endpoints

- `GET /` - Welcome message
- `POST /upload` - Upload a file
- `GET /files` - List all files
- `GET /download/:filename` - Download a file
- `DELETE /files/:filename` - Delete a file

## Technologies Used

- Backend:
  - Node.js
  - Express.js
  - MongoDB
  - Multer (for file uploads)

- Frontend:
  - HTML5
  - JavaScript (ES6+)
  - Tailwind CSS
  - Fetch API

## License

ISC 