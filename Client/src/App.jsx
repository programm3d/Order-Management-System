import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Layout from "./components/Layout/Layout";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import ProductList from "./components/Products/ProductList";
import OrderList from "./components/Orders/OrderList";
import OrderDetails from "./components/Orders/OrderDetails";
import CreateOrder from "./components/Orders/CreateOrder";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import CustomerDashboard from "./components/Dashboard/CustomerDashboard";
import ProductManagement from "./components/Admin/ProductManagement";
import UserManagement from "./components/Admin/UserManagement";
import "./App.css";
import CreateOrderForCustomer from "./components/Admin/CreateOrderForCustomer";


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster position="top-right" />
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<ProductList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/order-lookup/:orderId"
              element={<OrderDetails isPublic={true} />}
            />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/orders" element={<OrderList />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/create-order" element={<CreateOrder />} />
            </Route>

            {/* Admin/Staff Routes */}
            <Route
              element={<ProtectedRoute allowedRoles={["admin", "staff"]} />}
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<ProductManagement />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route
                path="/admin/create-order"
                element={<CreateOrderForCustomer />}
              />
            </Route>
          </Routes>
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
