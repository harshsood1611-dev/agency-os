# AgencyOS - Setup Guide

AgencyOS is a professional agency management platform built with Next.js (frontend) and Express.js + MongoDB (backend). This is Phase 1, featuring authentication, dashboard, and client management.

## Architecture

- **Frontend**: Next.js 15 with React, TypeScript, and Tailwind CSS
- **Backend**: Node.js with Express.js and MongoDB
- **Authentication**: JWT-based with bcryptjs password hashing
- **Database**: MongoDB with Mongoose ODM

## Prerequisites

- Node.js 18+ and npm/pnpm
- MongoDB (local or cloud connection string)

## Setup Instructions

### 1. Frontend Setup

The frontend is already in the root directory. Install dependencies:

```bash
pnpm install
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
pnpm install
```

### 3. Environment Configuration

#### Backend Environment (.env)

Create a `.env` file in the backend directory based on `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# MongoDB connection string (local or cloud)
MONGODB_URI=mongodb://localhost:27017/agencyos
# or for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agencyos

PORT=5000
JWT_SECRET=your-very-secure-secret-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Database Setup

Make sure MongoDB is running:

- **Local MongoDB**: Run `mongod` in your terminal
- **MongoDB Atlas**: Use your connection string in `.env`

The database and collections will be created automatically when the backend starts.

### 5. Running the Application

#### Terminal 1 - Backend

```bash
cd backend
pnpm dev
```

Expected output:
```
MongoDB connected
Backend server running on port 5000
```

#### Terminal 2 - Frontend

```bash
pnpm dev
```

Expected output:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
```

### 6. Access the Application

1. Open `http://localhost:3000` in your browser
2. You'll be redirected to the login page
3. Click "Sign up" to create a new account
4. Fill in your details and create an account
5. You'll be logged in and redirected to the dashboard

## Features (Phase 1)

### Authentication
- User registration with email and password
- JWT-based authentication
- Secure password hashing with bcryptjs
- Protected routes that require authentication
- Persistent login with localStorage

### Dashboard
- Overview of client statistics (total, active, prospects)
- Quick action buttons
- User profile information in sidebar

### Client Management
- Create, read, update, and delete clients
- Search clients by name, email, or company
- Filter clients by status (active, inactive, prospect)
- Pagination support (10 items per page)
- Detailed client information including:
  - Contact details (name, email, phone)
  - Company information
  - Address (street, city, state, zip)
  - Billing rate
  - Status and notes
  - Timestamps

### Navigation
- Sidebar navigation with quick access
- Protected dashboard and clients pages
- User profile and logout functionality

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user info (requires token)

### Clients
- `GET /api/clients` - List all clients with pagination/filtering
- `GET /api/clients/:id` - Get single client details
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/stats/overview` - Get dashboard statistics

## Folder Structure

```
agencyos/
├── app/                          # Next.js app directory
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication state management
│   ├── components/
│   │   ├── ProtectedRoute.tsx    # Route protection wrapper
│   │   ├── DashboardLayout.tsx   # Main dashboard layout
│   │   └── ClientForm.tsx        # Client CRUD form
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── register/
│   │   └── page.tsx              # Registration page
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard page
│   ├── clients/
│   │   ├── page.tsx              # Clients list
│   │   ├── new/page.tsx          # Create client
│   │   └── [id]/page.tsx         # Edit client
│   └── page.tsx                  # Home page (redirects)
├── backend/                       # Express server
│   ├── models/
│   │   ├── User.js               # User schema and methods
│   │   └── Client.js             # Client schema
│   ├── routes/
│   │   ├── auth.js               # Authentication endpoints
│   │   └── clients.js            # Client CRUD endpoints
│   ├── middleware/
│   │   └── auth.js               # JWT verification & token generation
│   ├── server.js                 # Express app setup
│   └── .env.example              # Environment template
└── components/ui/                # shadcn/ui components
```

## Testing the Application

### Create an Account
1. Go to http://localhost:3000/register
2. Fill in your details:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Agency Name: Acme Agency
   - Password: (6+ characters)
3. Click "Sign Up"

### Use the Dashboard
1. View client statistics on the dashboard
2. Click "Add New Client" to create a client
3. Fill in client details and save
4. View all clients in the Clients list
5. Edit or delete clients as needed

### Test Authentication
1. Log out and try to access `/dashboard` directly
2. You should be redirected to login
3. Log back in with your credentials

## Troubleshooting

### Backend not connecting to MongoDB
- Check MONGODB_URI in `.env`
- Ensure MongoDB is running (local or remote)
- For MongoDB Atlas, whitelist your IP address

### Frontend showing "Loading..." indefinitely
- Check browser console for errors
- Ensure backend is running on port 5000
- Check FRONTEND_URL in backend `.env` matches frontend URL

### CORS errors
- Ensure backend has correct FRONTEND_URL in `.env`
- Backend CORS is configured for the frontend URL

### JWT token issues
- Tokens expire after 7 days (configurable in .env)
- If token is invalid, user is redirected to login
- Tokens are stored in localStorage

## Next Steps (Phase 2 & 3)

Phase 2 will include:
- Project and task management
- Real-time chat/messaging
- Activity tracking

Phase 3 will include:
- Billing and subscription management
- Advanced analytics
- Notification system

## Security Notes

For production deployment:
1. Change JWT_SECRET to a long, random string
2. Use HTTPS for all connections
3. Set NODE_ENV=production
4. Use environment variables from a secure vault
5. Enable rate limiting on API endpoints
6. Add input validation on all endpoints
7. Use helmet.js for security headers
8. Enable CORS only for your domain

## Support

For issues or questions, refer to the documentation in the code comments or the plan file at `v0_plans/smart-process.md`.
