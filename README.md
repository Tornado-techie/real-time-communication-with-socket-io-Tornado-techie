# Real-Time Chat Application with Socket.io
## Real-Time Chat Application (Socket.io + MERN)

This repository contains a real-time chat application built with a React front-end and a Node/Express + Socket.io back-end. It demonstrates bidirectional real-time messaging, user presence, message operations (reply, star, edit, delete), private messaging, and additional UX improvements and is a requirement of my week 5 assignment in my specialization as a full stack MERN developer.

---

## Project overview

- Frontend: React (client/) — real-time UI, context providers, custom hooks, and a message context menu
- Backend: Node.js + Express (server/) — REST endpoints, Socket.io handlers, MongoDB models
- Communication: Socket.io for real-time events (messages, typing, presence, notifications)

This app was created as a learning project and includes several advanced chat features described below.

## Repository structure

```
real-time-communication-with-socket-io-Tornado-techie/
├── .git/                   # Git repository metadata
├── .gitignore              # Git ignore rules
├── render.yaml             # Render deployment configuration
├── client/                 # React front-end application
│   ├── public/             # Static files
│   │   └── index.html      # Main HTML template
│   ├── src/                # React source code
│   │   ├── components/     # UI components
│   │   │   ├── ChatRoom.jsx           # Main chat interface
│   │   │   ├── Login.jsx              # Login/Register component
│   │   │   └── MessageContextMenu.jsx # Right-click context menu
│   │   ├── context/        # React context providers
│   │   │   └── AuthContext.jsx        # Authentication context
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useMessageContextMenu.js  # Context menu hook
│   │   │   └── useNotifications.js       # Browser notifications hook
│   │   ├── socket/         # Socket.io client configuration
│   │   │   └── socket.js   # Socket client setup
│   │   ├── App.css         # Global styles
│   │   ├── App.jsx         # Main app component
│   │   └── index.js        # React entry point
│   └── package.json        # Client dependencies and scripts
├── server/                 # Express + Socket.io server
│   ├── middleware/         # Express middleware
│   │   └── auth.js         # Socket authentication middleware
│   ├── models/             # Mongoose database models
│   │   ├── Message.js      # Chat message model
│   │   └── user.js         # User model
│   ├── routes/             # Express API routes
│   │   └── auth.js         # Authentication routes
│   ├── socket/             # Socket.io event handlers
│   │   └── ChatHandlers.js # Chat-related socket events
│   ├── server.js           # Server entry point
│   └── package.json        # Server dependencies and scripts
├── screenshots/            # Application screenshots
│   ├── advancedfeature1.png
│   ├── advancedfeature2.png
│   ├── advancedfeature3-online-status.png
│   ├── chatsection.png
│   ├── loginpage.png
│   └── registerpage.png
├── Week5-Assignment.md     # Assignment instructions
└── README.md               # This documentation file
```

---

## Advanced features implemented

- Real-time messaging with Socket.io
- User authentication and presence tracking (isOnline, lastSeen)
- Message history per room and private messages
- Typing indicators and stop-typing events
- Message actions via context menu: Reply, Reply privately, Star/Unstar, Copy, Forward
- Reply-to-message feature with reply preview and clickable reply previews (scrolls and highlights original message)
- Message edit and delete
- Message starring (star/unstar) with per-user state
- Desktop/notification hooks when receiving messages or presence changes
- Graceful server shutdown and error handling

---

## Setup and Deployment

### Local Development

Follow these steps to run the project locally. Commands assume you're in the repository root.

**Prerequisites:**
- Node.js (v16+ recommended) and npm installed
- MongoDB running locally (or a cloud MongoDB URI)

**Server Setup:**
```powershell
cd server
# Install server dependencies
npm install

# Create .env file in server/ with required variables (see Environment Variables section)
# Start server in development mode
npm run dev
```

**Client Setup:**
```powershell
cd client
npm install
# Start client development server
npm start
```

Open http://localhost:3000 in your browser. The client connects to the server at http://localhost:5000.

### Production Deployment

**Render (Backend):**
1. Connect your GitHub repository to Render
2. Create a new Web Service using the `render.yaml` blueprint
3. Set the required environment variables in Render dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `CLIENT_URL`: Your frontend URL (GitHub Pages URL)
   - `NODE_ENV`: Set to `production`
4. Render will automatically build and deploy your backend

**GitHub Pages (Frontend):**
1. Frontend is deployed to GitHub Pages automatically
2. URL: https://tornado-techie.github.io/real-time-communication-with-socket-io-Tornado-techie/
3. Update `client/.env` with your Render backend URL before building

**Deployment Files:**
- `render.yaml`: Render service configuration for backend deployment

---

## Deployment Configuration

This project includes configuration for production deployment on Render:

- **`render.yaml`**: Render service blueprint for backend deployment

---

## Environment variables

### Development (.env file in server/ folder):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_secure_jwt_secret_here
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Production (Render Environment Variables):
```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app
JWT_SECRET=your_secure_production_jwt_secret
CLIENT_URL=https://tornado-techie.github.io/real-time-communication-with-socket-io-Tornado-techie
NODE_ENV=production
```

**Important Notes:**
- MongoDB Atlas is recommended for production (replace local MongoDB URI)
- Generate a secure JWT secret using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Client URL should point to your deployed frontend

---

## How reply highlighting works (quick note for maintainers)

- When a message is replied to, the message object contains a `repliedTo` field (either an id or an object depending on server serialization).
- The client shows a condensed reply preview inside the replying message and allows clicking the preview to scroll to and temporarily highlight the original message.
- The CSS class `highlighted-message` runs a brief pulse animation to make the origin obvious.

---

## Screenshots

![Chat - register view](screenshots/registerpage.png)

![Chat - login view](screenshots/loginpage.png)

![Chat - main view](screenshots/chatsection.png)

![Reply preview and highlighted message](screenshots/advancedfeature2.png)

![Send preview and core features](screenshots/advancedfeature1.png)

![Online status](screenshots/advancedfeature3-online-status.png)

---

## Deployed URLs

- **Backend Server (Render):** `https://your-render-service.onrender.com`
- **Frontend Client (GitHub Pages):** `https://tornado-techie.github.io/real-time-communication-with-socket-io-Tornado-techie`

The application is configured for production deployment with MongoDB Atlas as the database.

---

## Troubleshooting

**ERR_CONNECTION_REFUSED when connecting to Socket.io:**
- Ensure server is running (`npm run dev` in server directory)
- Confirm server port matches the client socket URL
- Check that CLIENT_URL environment variable is set correctly

**"require is not defined in ES module scope" errors:**
- Project uses ES modules (`"type": "module"` in package.json)
- Use `import/export` syntax instead of `require/module.exports`

**CORS issues:**
- Verify server CORS settings allow the client origin
- Check CLIENT_URL environment variable matches your frontend URL

**Render deployment failures:**
- Ensure all environment variables are set in Render dashboard
- Check Render build logs for specific error messages
- Verify MongoDB connection string is correct
- Render may take a few minutes for the initial deploy

**MongoDB connection issues:**
- For local development: Ensure MongoDB is running on localhost:27017
- For production: Verify MongoDB Atlas connection string and network access

**Environment variable issues:**
- Create a `.env` file in the `server/` directory for local development
- For production: Set variables in Render dashboard, not in .env file
- Ensure JWT_SECRET is a secure, long random string

---

## Development notes & next steps

**Technical Stack:**
- Frontend: React with Socket.io client
- Backend: Node.js, Express, Socket.io server
- Database: MongoDB (local development) / MongoDB Atlas (production)
- Deployment: GitHub Pages (frontend) + Render (backend)

**Potential Improvements:**
- Add unit/integration tests for socket handlers and React components
- Implement message delivery/read receipts
- Add persistence for starred messages per-user
- Improve accessibility (keyboard context menu, ARIA labels)
- Add file sharing capabilities
- Implement message search functionality

---

**Repository Notes:**
- This repository is a fork from the classroom repo
- Original classroom repo: `PLP-MERN-Stack-Development/real-time-communication-with-socket-io-Tornado-techie`
- Personal fork: `Tornado-techie/real-time-communication-with-socket-io-Tornado-techie`
- Frontend deployed from personal fork to GitHub Pages
- Backend deployed from personal fork to Render

---

Happy coding! by Salome Mundia