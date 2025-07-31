# Order Management System (OMS)

A full-stack Order Management System built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring real-time updates, role-based access control, and inventory management.


## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Common Commands](#common-commands)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Features

- **User Management**: Customer registration, staff/admin account creation
- **Product Management**: CRUD operations, inventory tracking, stock reservation
- **Order Management**: Order creation, status tracking, payment management
- **Real-time Updates**: WebSocket-based notifications for order status changes
- **Role-Based Access**: Customer, Staff, and Admin roles with different permissions
- **Admin Dashboard**: Analytics, order management, user management
- **Responsive Design**: Mobile-friendly dark theme UI

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose ODM
- Socket.io for WebSockets
- JWT Authentication
- Bcrypt for password hashing

### Frontend
- React 18 with Vite
- React Router v6
- Framer Motion for animations
- Socket.io Client
- React Hot Toast for notifications

## Prerequisites

- Node.js v14+ and npm/yarn
- MongoDB v4.4+ (local or cloud instance)
- Git

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/oms.git
cd oms
```
### 2. Backend Setup
```
cd server
npm install
```

#### Start development server
```
node server.js
```
### 3. Frontend Setup
```
cd client
npm install
```
#### Start development server
```
npm run dev
```

### 4. Access the Application

[Frontend](https://ignipc-pushan.netlify.app/)  
[Backend API](https://order-management-system-9ev0.onrender.com/api)  
[Socket.io](https://order-management-system-9ev0.onrender.com)

## Environment Variables
### Backend (.env)
```
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/oms
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/oms

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Optional: Logging
LOG_LEVEL=debug
```

### Frontend (.env)
```
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
## API Documentation

### Authentication Endpoints

| Method |  Endpoint | Description |
|:---------|:--------:|---------:|
| POST	 | ```/api/auth/register```	 | Register new customer |
| POST | ```/api/auth/login``` | User login |
|GET|```/api/auth/me```|Get current user|
|POST|```/api/auth/logout```|Logout user|

### User Management (Admin only)

| Method |  Endpoint | Description |
|:---------|:--------:|---------:|
| GET	 | ```/api/users```	 |List all users|
| POST | ```/api/users``` |Create new user|
|GET|```/api/users/:id```|Get user details|
|PUT|```/api/users/:id```|Update user|
|PATCH|```/api/users/:id/toggle-status```|Activate/deactivate user|

### Product Management

| Method |  Endpoint | Description |
|:---------|:--------:|---------:|
| GET	 | ```/api/products```	 |List products (public)|
| GET | ```/api/products/:id``` |Get product details|
|POST|```/api/products```|Create product (staff/admin)|
|PUT|```/api/products/:id```|Update product (staff/admin)|
|PATCH|```/api/products/:id/stocK```|Update stock (staff/admin)|
|PATCH|```/api/products/:id/toggle-status```|Toggle active status|

### Order Management

| Method |  Endpoint | Description |
|:---------|:--------:|---------:|
|POST|```/api/orders```|Create order|
|POST|```/api/orders/create-for-customer	```|Staff creates order|
|GET|```/api/orders	```|List orders|
|GET|```/api/orders/:id	```|Get order details|
|GET|```/api/orders/lookup/:orderId	```|Public order lookup|
|PATCH|```/api/orders/:id/status```|Update order status|
|PATCH|```/api/orders/:id/payment```|Update payment status|
|GET|```/api/orders/export/csv```|Export orders to CSV|

