import React, { useState } from 'react';

const DashboardPage = ({ currentUser, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-16 overflow-y-auto z-40">
      <div className="p-4">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{currentUser?.name || 'User'}</h3>
              <p className="text-sm text-gray-600">ID: {currentUser?.id?.substr(0, 8)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">Free</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Active</span>
          </div>
        </div>

        <nav className="space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'}`}>
            <span className="text-xl">🏠</span>
            <span className="font-medium">Dashboard</span>
          </button>
          <button onClick={() => onNavigate('ai-chat')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="text-xl">🤖</span>
            <span className="font-medium">AI Matchmaker</span>
          </button>
          <button onClick={() => onNavigate('discover')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="text-xl">🔍</span>
            <span className="font-medium">Discover</span>
          </button>
          <button onClick={() => onNavigate('my-profile')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="text-xl">👤</span>
            <span className="font-medium">My Profile</span>
          </button>
          <button onClick={() => onNavigate('my-interest')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="text-xl">❤️</span>
            <span className="font-medium">My Interest</span>
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
          </button>
          <button onClick={() => onNavigate('messaging')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="text-xl">💬</span>
            <span className="font-medium">Messages</span>
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">5</span>
          </button>
          <button onClick={() => onNavigate('gallery')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="text-xl">📸</span>
            <span className="font-medium">Gallery</span>
          </button>
          <button onClick={() => onNavigate('packages')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="text-xl">📦</span>
            <span className="font-medium">Upgrade</span>
          </button>
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <button onClick={() => onNavigate('settings')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100">
              <span className="text-xl">⚙️</span>
              <span className="font-medium">Settings</span>
            </button>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50">
              <span className="text-xl">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">❤️</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              MatrimonyAI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="font-semibold text-gray-900">{currentUser?.name}</div>
              <div className="text-sm text-gray-600">Free Plan</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">Welcome back, {currentUser?.name}! 👋</h1>
                <p className="text-gray-600">Here's your matrimony dashboard</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-4xl mb-2">❤️</div>
                  <h3 className="text-3xl font-bold">50</h3>
                  <p className="text-pink-100">Remaining Interest</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-4xl mb-2">👁️</div>
                  <h3 className="text-3xl font-bold">100</h3>
                  <p className="text-blue-100">Contact Views</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-4xl mb-2">👥</div>
                  <h3 className="text-3xl font-bold">127</h3>
                  <p className="text-purple-100">Profile Viewers</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-4xl mb-2">📸</div>
                  <h3 className="text-3xl font-bold">3/10</h3>
                  <p className="text-green-100">Gallery Images</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">👑</span>
                      <span className="font-semibold">FREE PLAN</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Upgrade to Premium</h3>
                    <p className="opacity-90 mb-4">Get unlimited access to all features</p>
                    <button onClick={() => onNavigate('packages')} className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:shadow-xl transition-all">
                      View Plans
                    </button>
                  </div>
                  <span className="text-6xl hidden md:block">👑</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => onNavigate('ai-chat')} className="p-4 border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition-all text-left">
                    <div className="text-4xl mb-2">🤖</div>
                    <div className="font-bold text-gray-900">Chat with AI</div>
                    <div className="text-sm text-gray-600">Get personalized matches</div>
                  </button>
                  <button onClick={() => onNavigate('my-profile')} className="p-4 border-2 border-pink-200 rounded-xl hover:bg-pink-50 transition-all text-left">
                    <div className="text-4xl mb-2">👤</div>
                    <div className="font-bold text-gray-900">Complete Profile</div>
                    <div className="text-sm text-gray-600">35% complete</div>
                  </button>
                  <button onClick={() => onNavigate('discover')} className="p-4 border-2 border-blue-200 rounded-xl hover:bg-blue-50 transition-all text-left">
                    <div className="text-4xl mb-2">🔍</div>
                    <div className="font-bold text-gray-900">Browse Matches</div>
                    <div className="text-sm text-gray-600">Find your perfect match</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
