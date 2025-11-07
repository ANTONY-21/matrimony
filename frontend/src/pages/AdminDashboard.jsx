import React, { useState, useEffect } from 'react';
import { back4appApi } from '../utils/back4appApi';

/**
 * Admin Dashboard - Main control center for platform management
 * Features: Statistics, user management, system health, activity monitoring
 */
const AdminDashboard = ({ currentUser, onNavigate, onLogout }) => {
  const [adminTab, setAdminTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    activeUsers: 0,
    totalProfiles: 0,
    premiumUsers: 0,
    newUsersToday: 0,
    systemHealth: 95,
    totalRevenue: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [users, setUsers] = useState([]);

  // Fetch admin statistics on mount
  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      // Fetch users from Back4App
      const allUsers = await back4appApi.query('_User', { limit: 1000 });
      
      // Calculate statistics
      const verified = allUsers.filter(u => u.isVerified).length;
      const active = allUsers.filter(u => {
        const lastActive = new Date(u.lastActive || 0);
        const now = new Date();
        return (now - lastActive) < 7 * 24 * 60 * 60 * 1000; // Last 7 days
      }).length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newToday = allUsers.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= today;
      }).length;

      const premium = allUsers.filter(u => u.planType === 'premium' || u.planType === 'pro').length;

      setStats({
        totalUsers: allUsers.length,
        verifiedUsers: verified,
        activeUsers: active,
        totalProfiles: allUsers.length,
        premiumUsers: premium,
        newUsersToday: newToday,
        systemHealth: 95,
        totalRevenue: premium * 4.99 * 30, // Estimate: $4.99/month
        conversionRate: ((premium / allUsers.length) * 100).toFixed(2)
      });

      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const AdminSidebar = () => (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen fixed left-0 top-16 overflow-y-auto text-white z-40">
      <div className="p-4">
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
              👑
            </div>
            <div>
              <h3 className="font-bold text-white">Admin Panel</h3>
              <p className="text-sm text-gray-200">SuperAdmin</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setAdminTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              adminTab === 'overview'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">📊</span>
            <span className="font-medium">Overview</span>
          </button>

          <button
            onClick={() => setAdminTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              adminTab === 'users'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">👥</span>
            <span className="font-medium">Users</span>
            <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">{stats.totalUsers}</span>
          </button>

          <button
            onClick={() => setAdminTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              adminTab === 'reports'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">📈</span>
            <span className="font-medium">Reports</span>
          </button>

          <button
            onClick={() => setAdminTab('moderation')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              adminTab === 'moderation'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">🚨</span>
            <span className="font-medium">Moderation</span>
          </button>

          <button
            onClick={() => setAdminTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              adminTab === 'system'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">⚙️</span>
            <span className="font-medium">System</span>
          </button>

          <button
            onClick={() => setAdminTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              adminTab === 'analytics'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">📉</span>
            <span className="font-medium">Analytics</span>
          </button>

          <div className="pt-4 mt-4 border-t border-gray-700">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-all"
            >
              <span className="text-xl">🏠</span>
              <span className="font-medium">User Dashboard</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900 hover:bg-opacity-30 transition-all mt-2"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );

  // Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Platform Overview</h2>
        <p className="text-gray-600">Real-time platform statistics and metrics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon="👥"
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered members"
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon="✅"
          title="Verified Users"
          value={stats.verifiedUsers}
          subtitle={`${((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)}% verified`}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon="🔥"
          title="Active Users"
          value={stats.activeUsers}
          subtitle="Last 7 days"
          color="bg-gradient-to-br from-red-500 to-red-600"
        />
        <StatCard
          icon="👑"
          title="Premium Users"
          value={stats.premiumUsers}
          subtitle={`${stats.conversionRate}% conversion`}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          icon="💰"
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`}
          subtitle="Monthly recurring"
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
        <StatCard
          icon="📊"
          title="System Health"
          value={`${stats.systemHealth}%`}
          subtitle="All systems operational"
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-l-4 border-pink-500 pl-4">
            <p className="text-gray-600 text-sm">New Users Today</p>
            <h4 className="text-2xl font-bold text-gray-900">{stats.newUsersToday}</h4>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-gray-600 text-sm">Platform Growth</p>
            <h4 className="text-2xl font-bold text-gray-900">↑ 12.5%</h4>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-gray-600 text-sm">Avg. Session Duration</p>
            <h4 className="text-2xl font-bold text-gray-900">24 min</h4>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-gray-600 text-sm">User Retention</p>
            <h4 className="text-2xl font-bold text-gray-900">87%</h4>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <ActivityItem icon="🆕" message="New user registered" time="2 minutes ago" />
          <ActivityItem icon="✅" message="User verified profile" time="5 minutes ago" />
          <ActivityItem icon="💳" message="Premium subscription purchased" time="12 minutes ago" />
          <ActivityItem icon="⚠️" message="Suspicious activity flagged" time="15 minutes ago" />
          <ActivityItem icon="🔄" message="Database backup completed" time="1 hour ago" />
        </div>
      </div>
    </div>
  );

  // Users Management Tab
  const UsersTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">User Management</h2>
        <p className="text-gray-600">Manage and monitor platform users</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
          >
            <option value="all">All Users</option>
            <option value="verified">Verified Only</option>
            <option value="premium">Premium Users</option>
            <option value="free">Free Users</option>
            <option value="inactive">Inactive Users</option>
          </select>
          <button className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
            🔍 Advanced Search
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left font-bold text-gray-900">User</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Email</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Plan</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Joined</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.slice(0, 10).map((user) => (
                <tr key={user.objectId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="font-medium text-gray-900">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.isVerified
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.isVerified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.planType === 'premium'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.planType === 'premium' ? '👑 Premium' : '📦 Free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button className="text-blue-600 hover:text-blue-700 font-semibold">👁️ View</button>
                    <button className="text-red-600 hover:text-red-700 font-semibold">🚫 Block</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <p className="text-gray-600">Showing 1-10 of {stats.totalUsers} users</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100">← Previous</button>
            <button className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Reports Tab
  const ReportsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h2>
        <p className="text-gray-600">Generate and view detailed reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard
          title="User Growth Report"
          description="Monthly user registration trends"
          icon="📈"
          color="from-blue-500 to-blue-600"
        />
        <ReportCard
          title="Revenue Report"
          description="Subscription and payment analysis"
          icon="💰"
          color="from-green-500 to-green-600"
        />
        <ReportCard
          title="Engagement Report"
          description="User activity and engagement metrics"
          icon="📊"
          color="from-purple-500 to-purple-600"
        />
        <ReportCard
          title="Traffic Report"
          description="Website traffic and performance"
          icon="🌐"
          color="from-pink-500 to-red-500"
        />
      </div>
    </div>
  );

  // Moderation Tab
  const ModerationTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Content Moderation</h2>
        <p className="text-gray-600">Monitor and moderate user content</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Flagged Content</h3>
        <div className="space-y-4">
          <ModerationItem
            user="John Doe"
            issue="Inappropriate profile image"
            status="pending"
            severity="high"
          />
          <ModerationItem
            user="Jane Smith"
            issue="Suspicious activity"
            status="under_review"
            severity="medium"
          />
          <ModerationItem
            user="Mike Johnson"
            issue="Spam messages"
            status="resolved"
            severity="low"
          />
        </div>
      </div>
    </div>
  );

  // System Tab
  const SystemTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">System Management</h2>
        <p className="text-gray-600">Database, backups, and system settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SystemCard
          title="Database Status"
          status="healthy"
          lastCheck="Just now"
          actions={['🔄 Backup', '📊 Optimize', '⚙️ Settings']}
        />
        <SystemCard
          title="API Performance"
          status="optimal"
          lastCheck="2 minutes ago"
          actions={['📈 Logs', '🔍 Monitor', '⚙️ Config']}
        />
        <SystemCard
          title="Storage Usage"
          status="warning"
          lastCheck="5 minutes ago"
          actions={['🗑️ Cleanup', '📊 Analysis', '⚙️ Limits']}
        />
        <SystemCard
          title="Email Service"
          status="healthy"
          lastCheck="1 minute ago"
          actions={['📧 Test', '📊 Logs', '⚙️ Settings']}
        />
      </div>
    </div>
  );

  // Analytics Tab
  const AnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Advanced Analytics</h2>
        <p className="text-gray-600">Detailed platform analytics and insights</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">User Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 mb-2">Gender Distribution</p>
            <div className="flex gap-2">
              <div className="h-12 bg-blue-500 rounded flex-1 flex items-center justify-center text-white font-bold">52%</div>
              <div className="h-12 bg-pink-500 rounded flex-1 flex items-center justify-center text-white font-bold">48%</div>
            </div>
            <p className="text-xs text-gray-600 mt-2">Male / Female</p>
          </div>
          <div>
            <p className="text-gray-600 mb-2">Age Groups</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>18-25</span>
                <span className="font-bold">35%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-full bg-blue-500 rounded" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-xs text-gray-600">Platform Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl">🔔</span>
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin text-4xl">⏳</div>
              </div>
            ) : (
              <>
                {adminTab === 'overview' && <OverviewTab />}
                {adminTab === 'users' && <UsersTab />}
                {adminTab === 'reports' && <ReportsTab />}
                {adminTab === 'moderation' && <ModerationTab />}
                {adminTab === 'system' && <SystemTab />}
                {adminTab === 'analytics' && <AnalyticsTab />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, title, value, subtitle, color }) => (
  <div className={`${color} rounded-xl p-6 text-white shadow-lg`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-4xl">{icon}</span>
      <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">Updated now</span>
    </div>
    <h3 className="text-sm opacity-90">{title}</h3>
    <p className="text-3xl font-bold">{value}</p>
    <p className="text-xs opacity-75 mt-1">{subtitle}</p>
  </div>
);

const ActivityItem = ({ icon, message, time }) => (
  <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all">
    <span className="text-2xl">{icon}</span>
    <div className="flex-1">
      <p className="text-gray-900 font-medium">{message}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  </div>
);

const ReportCard = ({ title, description, icon, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all`}>
    <span className="text-4xl block mb-3">{icon}</span>
    <h3 className="text-lg font-bold mb-1">{title}</h3>
    <p className="text-sm opacity-90 mb-4">{description}</p>
    <button className="text-sm font-semibold bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all">
      View Report →
    </button>
  </div>
);

const ModerationItem = ({ user, issue, status, severity }) => (
  <div className="border-l-4 border-yellow-500 pl-4 py-3 hover:bg-gray-50 rounded transition-all">
    <div className="flex justify-between items-start">
      <div>
        <p className="font-bold text-gray-900">{user}</p>
        <p className="text-sm text-gray-600">{issue}</p>
      </div>
      <div className="flex gap-2">
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
          severity === 'high' ? 'bg-red-100 text-red-700' :
          severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {severity.toUpperCase()}
        </span>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
          status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          status === 'under_review' ? 'bg-blue-100 text-blue-700' :
          'bg-green-100 text-green-700'
        }`}>
          {status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
    </div>
  </div>
);

const SystemCard = ({ title, status, lastCheck, actions }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
        status === 'healthy' ? 'bg-green-100 text-green-700' :
        status === 'optimal' ? 'bg-blue-100 text-blue-700' :
        'bg-yellow-100 text-yellow-700'
      }`}>
        {status.toUpperCase()}
      </span>
    </div>
    <p className="text-xs text-gray-600 mb-4">Last checked: {lastCheck}</p>
    <div className="flex gap-2">
      {actions.map((action, idx) => (
        <button
          key={idx}
          className="text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
        >
          {action}
        </button>
      ))}
    </div>
  </div>
);

export default AdminDashboard;
