import React, { useState, useEffect } from 'react';
import { back4appApi } from '../utils/back4appApi';

/**
 * Admin Users Management Page
 * Features: Search, filter, view profiles, manage verification, handle disputes
 */
const AdminUsers = ({ onNavigate, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    premium: 0,
    suspended: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, filterType, sortBy]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await back4appApi.query('_User', { limit: 1000 });
      setUsers(allUsers);

      // Calculate stats
      setStats({
        total: allUsers.length,
        verified: allUsers.filter(u => u.isVerified).length,
        unverified: allUsers.filter(u => !u.isVerified).length,
        premium: allUsers.filter(u => u.planType === 'premium').length,
        suspended: allUsers.filter(u => u.status === 'suspended').length
      });
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(u => {
        if (filterType === 'verified') return u.isVerified;
        if (filterType === 'unverified') return !u.isVerified;
        if (filterType === 'premium') return u.planType === 'premium';
        if (filterType === 'suspended') return u.status === 'suspended';
        return true;
      });
    }

    // Sorting
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
    }

    setFilteredUsers(filtered);
  };

  const handleVerifyUser = async (userId) => {
    setActionLoading(true);
    try {
      await back4appApi.update('_User', userId, { isVerified: true });
      loadUsers();
      alert('User verified successfully');
    } catch (error) {
      alert('Failed to verify user: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;

    setActionLoading(true);
    try {
      await back4appApi.update('_User', userId, { status: 'suspended' });
      loadUsers();
      alert('User suspended successfully');
    } catch (error) {
      alert('Failed to suspend user: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    setActionLoading(true);
    try {
      await back4appApi.delete('_User', userId);
      loadUsers();
      setShowDetailModal(false);
      alert('User deleted successfully');
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgradeToPremium = async (userId) => {
    setActionLoading(true);
    try {
      await back4appApi.update('_User', userId, { planType: 'premium' });
      loadUsers();
      alert('User upgraded to premium');
    } catch (error) {
      alert('Failed to upgrade user: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('admin')} className="text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          </div>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatBox label="Total Users" value={stats.total} color="bg-blue-500" />
          <StatBox label="Verified" value={stats.verified} color="bg-green-500" />
          <StatBox label="Unverified" value={stats.unverified} color="bg-yellow-500" />
          <StatBox label="Premium" value={stats.premium} color="bg-purple-500" />
          <StatBox label="Suspended" value={stats.suspended} color="bg-red-500" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Users</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
              <option value="premium">Premium Users</option>
              <option value="suspended">Suspended Users</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="recent">Recent First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setSortBy('recent');
              }}
              className="px-4 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-all"
            >
              🔄 Reset Filters
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl animate-spin">⏳</div>
            <p className="text-gray-600 mt-2">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">User</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Plan</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Joined</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.objectId} className="hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-gray-900">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isVerified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {user.isVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.planType === 'premium'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.planType === 'premium' ? '👑 Premium' : '📦 Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                          >
                            👁️ View
                          </button>
                          {!user.isVerified && (
                            <button
                              onClick={() => handleVerifyUser(user.objectId)}
                              className="text-green-600 hover:text-green-700 font-semibold text-sm"
                            >
                              ✅ Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleSuspendUser(user.objectId)}
                            className="text-red-600 hover:text-red-700 font-semibold text-sm"
                          >
                            🚫 Block
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-red-500 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-2xl hover:opacity-75"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto">
                  {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="text-xl font-bold mt-4">{selectedUser.username}</h3>
                <p className="text-gray-600">{selectedUser.email}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-bold ${selectedUser.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {selectedUser.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Plan Type</p>
                <p className={`text-lg font-bold ${selectedUser.planType === 'premium' ? 'text-purple-600' : 'text-blue-600'}`}>
                  {selectedUser.planType === 'premium' ? '👑 Premium' : '📦 Free Plan'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Joined</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                  {selectedUser.objectId}
                </p>
              </div>

              <div className="border-t pt-4 space-y-2">
                {!selectedUser.isVerified && (
                  <button
                    onClick={() => {
                      handleVerifyUser(selectedUser.objectId);
                      setShowDetailModal(false);
                    }}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all font-semibold"
                  >
                    ✅ Verify User
                  </button>
                )}

                {selectedUser.planType !== 'premium' && (
                  <button
                    onClick={() => {
                      handleUpgradeToPremium(selectedUser.objectId);
                      setShowDetailModal(false);
                    }}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-all font-semibold"
                  >
                    👑 Upgrade to Premium
                  </button>
                )}

                <button
                  onClick={() => {
                    handleSuspendUser(selectedUser.objectId);
                    setShowDetailModal(false);
                  }}
                  className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-all font-semibold"
                >
                  ⚠️ Suspend User
                </button>

                <button
                  onClick={() => {
                    handleDeleteUser(selectedUser.objectId);
                  }}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-all font-semibold"
                >
                  🗑️ Delete User
                </button>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400 transition-all font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color }) => (
  <div className={`${color} bg-opacity-10 border-2 border-opacity-30 border-gray-300 rounded-lg p-4 text-center`}>
    <p className="text-gray-600 text-sm font-medium">{label}</p>
    <p className={`text-3xl font-bold ${color.replace('bg-', 'text-')}`}>{value}</p>
  </div>
);

export default AdminUsers;
