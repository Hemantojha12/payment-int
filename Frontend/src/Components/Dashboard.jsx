import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { clearAuth } from '../utils/auth';
import { useSidebar } from '../context/SidebarContext';
import { ErrorBoundary } from '../Components/ErrorBoundary';
import { Spinner } from '../Components/ui/spinner';
import { Alert } from '../Components/ui/alert';
import { Card } from '../Components/ui/card';
import { adminDashboardConfig, organizerDashboardConfig } from '../config/dashboardConfig';
import NavBar from './NavBar';
import Sidebar from './Sidebar';

const Dashboard = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { isSidebarOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Select dashboard configuration based on user role
  const config = user?.role?.toLowerCase() === 'admin' 
    ? adminDashboardConfig 
    : organizerDashboardConfig;

  const handleLogout = () => {
    try {
      clearAuth();
      navigate('/loginsignup', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        const normalizedTab = tab?.toLowerCase() || config.defaultTab;

        if (!config.tabs[normalizedTab]) {
          navigate(`${config.basePath}/${config.defaultTab}`, { replace: true });
          return;
        }

        setActiveTab(normalizedTab);
        setError('');
      } catch (err) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [tab, navigate, config]);

  const renderContent = () => {
    if (loading) {
      return <Spinner className="flex justify-center p-8" />;
    }

    if (error) {
      return <Alert variant="destructive">{error}</Alert>;
    }

    const TabComponent = config.tabs[activeTab]?.component;
    if (!TabComponent) return null;

    return <TabComponent isDarkMode={isDarkMode} user={user} />;
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-background">
        <Sidebar
          user={user}
          onLogout={handleLogout}
        />
        
        <div className="flex flex-col flex-1">
          <NavBar />
          <main className={`
            flex-1 transition-all duration-300 pt-20
            ${isSidebarOpen ? 'ml-64' : 'ml-16'}
          `}>
            <div className="p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">
                  {config.tabs[activeTab]?.title}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {config.tabs[activeTab]?.description}
                </p>
              </div>
              <Card className="p-6">
                {renderContent()}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;