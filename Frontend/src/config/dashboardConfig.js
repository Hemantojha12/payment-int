// Import Organizer components
import Overview from '../Pages/Landing/Organizer/Overview';
import CreateEvent from '../Pages/Landing/Organizer/CreateEvent';
import MyEvents from '../Pages/Landing/Organizer/MyEvents';

// Import Admin components
import AdminOverview from '../Pages/Landing/Admin/Overview';
import EventsManagement from '../Pages/Landing/Admin/EventsManagement';
import UsersManagement from '../Pages/Landing/Admin/UsersManagement';
import PermissionsManagement from '../Pages/Landing/Admin/PermissionsManagement';
import CategoriesManagement from '../Pages/Landing/Admin/CategoriesManagement';
import Settings from '../Pages/Landing/Admin/Settings';

// Import icons
import { 
  BarChart3, 
  Plus, 
  List, 
  Settings as SettingsIcon,
  Users,
  Calendar,
  Shield,
  FolderTree,
  Lock
} from 'lucide-react';

export const organizerDashboardConfig = {
  basePath: '/orgdb',
  defaultTab: 'overview',
  tabs: {
    overview: {
      title: 'Overview',
      description: 'View your event management statistics and insights',
      component: Overview,
      permissions: ['VIEW_DASHBOARD'],
      icon: BarChart3
    },
    'create-event': {
      title: 'Create Event',
      description: 'Create and configure new events',
      component: CreateEvent,
      permissions: ['CREATE_EVENT'],
      icon: Plus
    },
    'my-events': {
      title: 'My Events',
      description: 'Manage your existing events',
      component: MyEvents,
      permissions: ['VIEW_EVENTS'],
      icon: List
    }
  }
};

export const adminDashboardConfig = {
  basePath: '/admindb',
  defaultTab: 'overview',
  tabs: {
    overview: {
      title: 'Dashboard Overview',
      description: 'System-wide statistics and insights',
      component: AdminOverview,
      permissions: ['ADMIN_VIEW_DASHBOARD'],
      icon: BarChart3
    },
    events: {
      title: 'Events Management',
      description: 'Manage all events in the system',
      component: EventsManagement,
      permissions: ['MANAGE_EVENTS'],
      icon: Calendar
    },
    users: {
      title: 'Users Management',
      description: 'Manage system users',
      component: UsersManagement,
      permissions: ['MANAGE_USERS'],
      icon: Users
    },
    permissions: {
      title: 'Permissions Management',
      description: 'Manage user roles and permissions',
      component: PermissionsManagement,
      permissions: ['MANAGE_PERMISSIONS'],
      icon: Lock
    },
    categories: {
      title: 'Categories Management',
      description: 'Manage event categories',
      component: CategoriesManagement,
      permissions: ['MANAGE_CATEGORIES'],
      icon: FolderTree
    },
    settings: {
      title: 'Settings',
      description: 'Configure system-wide settings',
      component: Settings,
      permissions: ['MANAGE_SETTINGS'],
      icon: SettingsIcon
    }
  }
};

// Helper function to get tab data
export const getTabData = (config, tabKey) => {
  return config.tabs[tabKey] || config.tabs[config.defaultTab];
};