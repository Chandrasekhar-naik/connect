# Connect Chat

A chat application with a frontend built using Vite + React and a backend built with Express, Socket.io, and MongoDB.

## Project structure

- `src/` - frontend application source code
- `backend/` - backend server source code
- `backend/uploads/` - generated file uploads (not part of source)
- `backend/logs/` - generated backend logs
- `package.json` - root frontend package manifest
- `backend/package.json` - backend package manifest

## Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB running locally or accessible remotely

## Frontend commands

From the project root:

```bash
cd c:\Users\BIT\Downloads\connect-chat-main
npm install
npm run dev
```

Build and preview production frontend:

```bash
npm run build
npm run preview
```

## Backend commands

From the backend folder:

```bash
cd c:\Users\BIT\Downloads\connect-chat-main\backend
npm install
npm run dev
```

Start backend without auto reload:

```bash
npm start
```

## Notes

- The frontend uses Vite.
- The backend uses `nodemon` in development mode.
- Configure any required environment variables in the backend before running.
