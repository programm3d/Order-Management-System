import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api.service";
import { toast } from "react-hot-toast";
import UserForm from "./UserForm";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", 10);
      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter) params.append("role", roleFilter);

      const response = await api.get(`/users?${params}`);
      console.log("Users response:", response); // Debug log

      setUsers(response.users || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setShowForm(true);
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/users/${userId}/toggle-status`);
      toast.success(
        `User ${currentStatus ? "deactivated" : "activated"} successfully`
      );
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    if (
      !window.confirm(
        `Are you sure you want to change this user's role to ${newRole}?`
      )
    ) {
      return;
    }

    try {
      await api.put(`/users/${userId}`, { role: newRole });
      toast.success("User role updated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleFormSubmit = async (userData) => {
    try {
      await api.post("/users", userData);
      toast.success("User created successfully");
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on filter
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="user-management"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="management-header">
        <h1>User Management</h1>
        <button onClick={handleCreateUser} className="btn btn-primary">
          Add New User
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={handleRoleFilter}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="table-info">
        <p>Total Users: {total}</p>
      </div>

      {users.length === 0 ? (
        <div className="no-data">
          <p>No users found</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleUpdateUserRole(user._id, e.target.value)
                      }
                      className="role-select"
                      disabled={user.email === "admin@example.com"} // Protect main admin
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.isActive !== false ? "active" : "inactive"
                      }`}
                    >
                      {user.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() =>
                        handleToggleUserStatus(
                          user._id,
                          user.isActive !== false
                        )
                      }
                      className={`btn btn-small ${
                        user.isActive !== false ? "btn-danger" : "btn-success"
                      }`}
                      disabled={user.email === "admin@example.com"} // Protect main admin
                    >
                      {user.isActive !== false ? "🚫" : "✅"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <UserForm
            onSubmit={handleFormSubmit}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserManagement;
