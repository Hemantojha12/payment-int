import React from 'react';
import { Calendar, Users, CreditCard, Tag, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const OverviewDashboard = ({ isDarkMode }) => {
  const componentClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  
  const chartData = [
    { name: 'Jan', events: 40, users: 24 },
    { name: 'Feb', events: 30, users: 35 },
    { name: 'Mar', events: 45, users: 42 },
    { name: 'Apr', events: 50, users: 48 },
    { name: 'May', events: 35, users: 38 },
    { name: 'Jun', events: 60, users: 52 }
  ];

  const renderStatsGrid = () => (
    <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
      {[
        { title: 'Total Events', value: '2,543', change: '+12.5%', icon: Calendar, color: 'indigo' },
        { title: 'Active Users', value: '45.2k', change: '+5.1%', icon: Users, color: 'green' },
        { title: 'Total Revenue', value: '$87.5k', change: '+8.3%', icon: CreditCard, color: 'purple' },
        { title: 'New Categories', value: '29', change: '+2.5%', icon: Tag, color: 'blue' }
      ].map(({ title, value, change, icon: Icon, color }) => (
        <div key={title} className={`${componentClass} border rounded-xl p-6 transition-transform duration-300 hover:scale-105`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-60">{title}</p>
              <h3 className="mt-1 text-2xl font-bold">{value}</h3>
              <span className={`text-sm text-${color}-500 bg-${color}-500/10 px-2 py-0.5 rounded-full mt-2 inline-block`}>
                {change}
              </span>
            </div>
            <div className={`p-3 rounded-lg bg-${color}-500/10`}>
              <Icon className={`w-6 h-6 text-${color}-500`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalyticsChart = () => (
    <div className={`${componentClass} border rounded-xl mb-8`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold">Events Analytics</h3>
            <p className="text-sm opacity-60">Monthly event and user growth</p>
          </div>
          <button className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <Filter className="w-4 h-4" />
          </button>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
              <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
              <Tooltip contentStyle={{ 
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                borderColor: isDarkMode ? '#334155' : '#e2e8f0'
              }} />
              <Line type="monotone" dataKey="events" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="users" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderStatsGrid()}
      {renderAnalyticsChart()}
    </div>
  );
};

export default OverviewDashboard;