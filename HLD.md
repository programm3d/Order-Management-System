# Order Management System - High-Level Design Document

## Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │   React     │  │   Framer     │  │   Socket.io       │    │
│  │   + Vite    │  │   Motion     │  │   Client          │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/WSS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │    CORS     │  │ Rate Limiter │  │  Authentication   │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Express.js │  │  Socket.io   │  │   Business Logic  │    │
│  │   Routes    │  │   Server     │  │    Services       │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │   MongoDB   │  │   Mongoose   │  │   Transaction     │    │
│  │             │  │     ODM      │  │    Support        │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```
### Request-Response Flow
```
┌────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Client │      │   API    │      │ Service  │      │ Database │
└───┬────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
    │                │                  │                  │
    │  HTTP Request  │                  │                  │
    ├───────────────►│                  │                  │
    │                │                  │                  │
    │                │  Validate Auth   │                  │
    │                ├─────────────────►│                  │
    │                │                  │                  │
    │                │  Process Logic   │                  │
    │                │◄─────────────────┤                  │
    │                │                  │                  │
    │                │                  │   Query Data     │
    │                │                  ├─────────────────►│
    │                │                  │                  │
    │                │                  │   Return Data    │
    │                │                  │◄─────────────────┤
    │                │                  │                  │
    │  HTTP Response │                  │                  │
    │◄───────────────┤                  │                  │
    │                │                  │                  │

```
### Real-time Event Flow
```
┌────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Client │      │WebSocket │      │  Event   │      │  Other   │
│   A    │      │  Server  │      │ Handler  │      │ Clients  │
└───┬────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
    │                │                  │                  │
    │  Connect WSS   │                  │                  │
    ├───────────────►│                  │                  │
    │                │                  │                  │
    │  Authenticate  │                  │                  │
    ├───────────────►│                  │                  │
    │                │                  │                  │
    │  Join Rooms    │                  │                  │
    │◄───────────────┤                  │                  │
    │                │                  │                  │
    │  Order Update  │                  │                  │
    ├───────────────►│                  │                  │
    │                │                  │                  │
    │                │  Process Event   │                  │
    │                ├─────────────────►│                  │
    │                │                  │                  │
    │                │  Broadcast       │                  │
    │                │◄─────────────────┤                  │
    │                │                  │                  │
    │                │                  │  Notify Clients  │
    │                ├──────────────────┼─────────────────►│
    │                │                  │                  │

```
## Component Breakdown
### Frontend Components
```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.jsx        # Navigation bar with auth state
│   │   ├── Footer.jsx        # Application footer
│   │   └── Layout.jsx        # Main layout wrapper
│   │
│   ├── Auth/
│   │   ├── Login.jsx         # User login form
│   │   ├── Register.jsx      # User registration form
│   │   └── ProtectedRoute.jsx # Route authorization wrapper
│   │
│   ├── Products/
│   │   ├── ProductList.jsx   # Product catalog display
│   │   ├── ProductCard.jsx   # Individual product display
│   │   └── ProductForm.jsx   # Product creation/edit form
│   │
│   ├── Orders/
│   │   ├── OrderList.jsx     # User orders display
│   │   ├── OrderDetails.jsx  # Detailed order view
│   │   ├── CreateOrder.jsx   # Order creation flow
│   │   └── OrderCard.jsx     # Order summary card
│   │
│   ├── Dashboard/
│   │   ├── AdminDashboard.jsx    # Admin analytics view
│   │   └── CustomerDashboard.jsx # Customer overview
│   │
│   └── Admin/
│       ├── ProductManagement.jsx     # Product CRUD interface
│       ├── UserManagement.jsx        # User management interface
│       └── CreateOrderForCustomer.jsx # Staff order creation
│
├── contexts/
│   ├── AuthContext.jsx       # Authentication state management
│   └── CartContext.jsx       # Shopping cart state
│
├── services/
│   ├── api.service.js        # Axios instance & interceptors
│   ├── auth.service.js       # Authentication API calls
│   └── socket.service.js     # WebSocket connection manager
│
└── hooks/
    ├── useAuth.js            # Authentication hook
    ├── useWebSocket.js       # WebSocket events hook
    └── useApi.js             # Generic API hook
```
### Backend Components
```
server/
├── routes/
│   ├── auth.routes.js        # Authentication endpoints
│   ├── user.routes.js        # User management endpoints
│   ├── product.routes.js     # Product CRUD endpoints
│   └── order.routes.js       # Order management endpoints
│
├── middlewares/
│   ├── auth.middleware.js    # JWT verification & authorization
│   ├── validation.middleware.js # Request validation
│   ├── error.middleware.js   # Global error handling
│   └── rateLimit.middleware.js # API rate limiting
│
├── models/
│   ├── user.model.js         # User schema & methods
│   ├── product.model.js      # Product schema & virtuals
│   └── order.model.js        # Order schema & hooks
│
├── services/
│   └── websocket.service.js  # Socket.io event handling
│
└── utils/
    └── constants.js          # Application constants
```
### State Management Flow
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Components    │────►│    Contexts      │────►│   API Services  │
│                 │     │                  │     │                 │
│  - Login Form   │     │  - AuthContext   │     │  - auth.service │
│  - Product List │     │  - CartContext   │     │  - api.service  │
│  - Order View   │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         ▲                       │                         │
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                         State Updates

```
## Database Schema

### Entity Relationship Diagram
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Users       │     │    Products     │     │     Orders      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ _id: ObjectId   │     │ _id: ObjectId   │     │ _id: ObjectId   │
│ name: String    │     │ sku: String     │     │ orderId: String │
│ email: String   │     │ name: String    │     │ customerId: Ref │
│ passwordHash:   │     │ description:    │     │ items: Array    │
│ role: Enum      │     │ price: Number   │     │ status: Enum    │
│ phone: String   │     │ stock: Number   │     │ paymentStatus:  │
│ address: Object │     │ reservedStock:  │     │ totalAmount:    │
│ isActive: Bool  │     │ category: String│     │ shippingAddress │
│ createdAt: Date │     │ isActive: Bool  │     │ notes: String   │
│ updatedAt: Date │     │ createdAt: Date │     │ createdBy: Ref  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         │                       └──────┬──────────────────┘
         │                              │
         │                              ▼
         │                    ┌─────────────────┐
         │                    │   OrderItems    │
         │                    ├─────────────────┤
         └────────────────────┤ productId: Ref  │
                              │ quantity: Number│
                              │ priceAtTime:    │
                              └─────────────────┘
```
### Indexing Strategy

```
// User Indexes
users.createIndex({ email: 1 }, { unique: true })
users.createIndex({ role: 1 })
users.createIndex({ createdAt: -1 })

// Product Indexes
products.createIndex({ sku: 1 }, { unique: true })
products.createIndex({ name: 'text', description: 'text' })
products.createIndex({ category: 1 })
products.createIndex({ isActive: 1 })

// Order Indexes
orders.createIndex({ orderId: 1 }, { unique: true })
orders.createIndex({ customerId: 1 })
orders.createIndex({ status: 1 })
orders.createIndex({ createdAt: -1 })
orders.createIndex({ paymentStatus: 1, status: 1 }) // Compound index
```

## API Contract
### Authentication Endpoints
|Method |Endpoint|Request Body|Success Response|Error Response|
|:------|:------:|:------:|:-------:|-------:|
|POST	|```/api/auth/register```|	```{ name, email, password, phone?, address? }```	|```201: { user, token }```|```400: { error: "Validation error" }```|
|POST|	```/api/auth/login```|	```{ email, password }```|	```200: { user, token }```|	```401: { error: "Invalid credentials" }```|
|GET|	```/api/auth/me```| -|	```200: { user }```	|```401: { error: "Please authenticate" }```|
|POST	|```/api/auth/logout```|	-|	```200: { message: "Logged out" }```|```401: { error: "Please authenticate" }```|

### User Management Endpoints
|Method |Endpoint|Request Body|Success Response|Error Response|
|:------|:------:|:------:|:-------:|-------:|
|GET|	```/api/users```|	Query: ```page, limit, role, search```|	```200: { users, totalPages, total }```|	```403: { error: "Access denied" }```|
|POST|	```/api/users```|	```{ name, email, password, role, phone?, address? }```|	```201: { user }```|```400: { error: "Validation error" }```|
|GET| ```/api/users/:id	```|-	|```200: { user }```|```404: { error: "User not found" }```|
|PUT|```	/api/users/:id```|	```{ name?, email?, role?, phone?, address? }```|	```200: { user }```|	```404: { error: "User not found" }```|
|PATCH|	```/api/users/:id/toggle-status```|	-	|```200: { message, isActive }```|	```404: { error: "User not found" }```|

### Product Management Endpoints

|Method |Endpoint|Request Body|Success Response|Error Response|
|:------|:------:|:------:|:-------:|-------:|
|GET	|```/api/products```|Query: ```page, limit, category, search, inStock```|```200: { products, totalPages, total }```|```500: { error: "Server error" }```|
|GET|```/api/products/:id```|-|```/api/products/:id	```|```404: { error: "Product not found" }```|
|POST|```/api/products	```|```{ sku, name, description?, price, stock, category }	```|```201: { product }	```|```400: { error: "Validation error" }```|
|PUT|```/api/products/:id```|```{ sku, name, description?, price, stock, category }```|```200: { product }```|`404: { error: "Product not found" }`|
|PATCH|`/api/products/:id/stock`|	`{ quantity, operation: 'add'	'subtract'	'set' }`|-|-|
|PATCH|	`/api/products/:id/toggle-status`|	-|	`200: { message, isActive }`|	`404: { error: "Product not found" }`|
|GET|	`/api/products/meta/categories`|	-	|`200: { categories: string[] }`|	`500: { error: "Server error" }`|

### Order Management Endpoints

|Method |Endpoint|Request Body|Success Response|Error Response|
|:------|:------:|:------:|:-------:|-------:|
|POST|	`/api/orders`|	`{ items: [{productId, quantity}], shippingAddress?, notes? }`|	`201: { order }`| `400: { error: "Insufficient stock" }`|
|POST|`/api/orders/create-for-customer`|`{ customerId, items, shippingAddress?, notes?, paymentStatus? }`|`201: { order }`|`403: { error: "Access denied" }`|
|GET|`/api/orders`|Query:`page, limit, status, paymentStatus, startDate, endDate`|	`200: { orders, totalPages, total }`|`401: { error: "Please authenticate" }`|
|GET|`/api/orders/:id`|	-	|`200: { order }`|	`404: { error: "Order not found" }`|
|GET|	`/api/orders/lookup/:orderId	`|-|`	200: { order }`|	`404: { error: "Order not found" }`|
|PATCH|`	/api/orders/:id/status`|	`{ status: 'PLACED'	'PICKED'	'SHIPPED'}`|-|-|
|PATCH|`/api/orders/:id/payment`|`{ paymentStatus: boolean }`|`	200: { message, order }`|	`403: { error: "Access denied" }`|
|GET|`/api/orders/export/csv`|	-	|`200: CSV file	`|`403: { error: "Access denied" }`|

## Sequence Diagrams
### Place Order Flow

```
┌────────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐
│Customer│   │Frontend │   │   API    │   │ Product  │   │  Order   │   │WebSocket │
│        │   │         │   │  Server  │   │ Service  │   │ Service  │   │  Server  │
└───┬────┘   └────┬────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
    │             │              │              │              │              │
    │ Click Order │              │              │              │              │
    ├────────────►│              │              │              │              │
    │             │              │              │              │              │
    │             │ POST /orders │              │              │              │
    │             ├─────────────►│              │              │              │
    │             │              │              │              │              │
    │             │              │ Check Auth   │              │              │
    │             │              ├─────────────►│              │              │
    │             │              │              │              │              │
    │             │              │ Verify Stock │              │              │
    │             │              ├─────────────►│              │              │
    │             │              │              │              │              │
    │             │              │◄─────────────┤              │              │
    │             │              │ Stock OK     │              │              │
    │             │              │              │              │              │
    │             │              │ Begin Transaction           │              │
    │             │              ├─────────────┬──────────────►│              │
    │             │              │             │               │              │
    │             │              │             │ Reserve Stock │              │
    │             │              │             ├──────────────►│              │
    │             │              │             │               │              │
    │             │              │             │ Create Order  │              │
    │             │              │             ├──────────────►│              │
    │             │              │             │               │              │
    │             │              │             │ Commit Trans  │              │
    │             │              │◄────────────┴───────────────┤              │
    │             │              │                             │              │
    │             │              │ Emit Event                  │              │
    │             │              ├─────────────────────────────┼─────────────►│
    │             │              │                             │              │
    │             │◄─────────────┤ Order Created               │              │
    │             │              │                             │              │
    │◄────────────┤ Show Success │                             │              │
    │             │              │                             │              │
    │             │              │                             │   Broadcast  │
    │             │              │                             │◄─────────────┤
    │             │◄─────────────┼─────────────────────────────┼──────────────┤
    │             │ Real-time Update                           │              │
    
```

### Order Status Update Flow (Admin)
```
┌─────┐   ┌────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐   ┌────────┐
│Admin│   │Frontend│   │   API    │   │  Order  │   │WebSocket │   │Customer│
│     │   │        │   │  Server  │   │ Service │   │  Server  │   │        │
└──┬──┘   └───┬────┘   └────┬─────┘   └────┬────┘   └────┬─────┘   └───┬────┘
   │          │             │              │              │             │
   │ Change   │             │              │              │             │
   │ Status   │             │              │              │             │
   ├─────────►│             │              │              │             │
   │          │             │              │              │             │
   │          │ PATCH       │              │              │             │
   │          │ /orders/:id │              │              │             │
   │          │ /status     │              │              │             │
   │          ├────────────►│              │              │             │
   │          │             │              │              │             │
   │          │             │ Check Auth & │              │             │
   │          │             │ Permissions  │              │             │
   │          │             ├─────────────►│              │             │
   │          │             │              │              │             │
   │          │             │ Update Status│              │             │
   │          │             ├─────────────►│              │             │
   │          │             │              │              │             │
   │          │             │◄─────────────┤              │             │
   │          │             │ Status Updated              │             │
   │          │             │              │              │             │
   │          │             │ Emit Event   │              │             │
   │          │             ├──────────────┼─────────────►│             │
   │          │             │              │              │             │
   │          │◄────────────┤              │              │             │
   │◄─────────┤ Success     │              │              │             │
   │          │             │              │              │             │
   │          │             │              │              │ Notify      │
   │          │             │              │              │ Customer    │
   │          │             │              │              ├────────────►│
   │          │             │              │              │             │


```
