# Ahava Healthcare - Admin Portal

Administrative portal for managing the Ahava Healthcare platform.

## Features

- ✅ User Management (CRUD)
- ✅ Visit Oversight
- ✅ Payment Management
- ✅ System Statistics Dashboard
- ✅ Real-Time Updates
- ✅ Secure Authentication (httpOnly cookies)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **API Client**: Axios
- **Charts**: Recharts
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- Backend API running on port 4000

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local

# Update .env.local with your API URL
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Default Admin Credentials

Create an admin user via the backend API first, then login with those credentials.

## Pages

- `/` - Dashboard with statistics
- `/login` - Admin login
- `/users` - User management
- `/visits` - Visit management
- `/payments` - Payment management

## Features

### Dashboard
- System statistics overview
- Quick action cards
- Real-time data updates

### User Management
- List all users with filtering
- Search by name/email
- Filter by role and status
- View user details
- Deactivate users
- Pagination support

### Visit Management
- List all visits
- Filter by status
- View visit details
- Assign nurse/doctor
- Monitor active visits
- Real-time status updates

### Payment Management
- View all payments
- Filter by status
- Process refunds
- View transaction details

## Security

- httpOnly cookies for authentication
- Automatic token refresh
- CSRF protection
- Role-based access (Admin only)
- Secure API communication

## License

MIT


