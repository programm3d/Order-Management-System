import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { CartContext } from "../../contexts/CartContext";
import { motion } from "framer-motion";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>IgniPC</h1>
        </Link>

        <nav className="nav">
          <Link to="/" className="nav-link">
            Products
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/orders" className="nav-link">
                My Orders
              </Link>

              {["admin", "staff"].includes(user.role) && (
                <>
                  <Link to="/admin" className="nav-link">
                    Admin
                  </Link>
                  <Link to="/admin/create-order" className="nav-link">
                    Create Order
                  </Link>
                </>
              )}

              {user.role === "customer" && (
                <Link to="/create-order" className="nav-link cart-link">
                  Cart
                  {cartCount > 0 && (
                    <motion.span
                      className="cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      key={cartCount}
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </Link>
              )}

              <div className="user-menu">
                <span className="user-name">{user.name}</span>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
