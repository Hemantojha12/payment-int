import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, Users, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../utils/api';
import { getToken } from '../../../utils/auth';
import { Card, CardHeader, CardTitle, CardContent } from '../../../Components/ui/card';

const Overview = ({ isDarkMode }) => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalAttendees: 0,
    totalRevenue: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) {
          throw new Error("No authentication token found");
        }

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (!decodedToken.user?.email) {
          throw new Error("Unable to verify user email");
        }

        // First get user data
        const userResponse = await api.get(`/users/email/${decodedToken.user.email}`);
        const userData = userResponse.data.user;
            
        if (!userData || !userData._id) {
          throw new Error("Unable to verify user credentials");
        }

        // Then fetch user events
        const eventsResponse = await api.get(`/events/user/${userData._id}`);
        const userEvents = eventsResponse.data;

        // Calculate stats
        const totalEvents = userEvents.length;
        const upcomingEvents = userEvents.filter(e => new Date(e.event_date) > new Date()).length;
        const totalAttendees = userEvents.reduce((sum, event) => sum + (event.attendees?.length || 0), 0);
        const totalRevenue = userEvents.reduce((sum, event) => 
          sum + (event.price * (event.attendees?.length || 0)), 0);

        setStats({
          totalEvents,
          upcomingEvents,
          totalAttendees,
          totalRevenue,
        });

        // Prepare chart data - sort by date and only include future events
        const chartData = userEvents
          .filter(event => new Date(event.event_date) >= new Date())
          .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
          .map(event => ({
            name: format(new Date(event.event_date), 'MMM d'),
            attendees: event.attendees?.length || 0,
            revenue: event.price * (event.attendees?.length || 0),
            capacity: event.totalSlots,
          }));

        setChartData(chartData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-sm text-gray-500">{stats.upcomingEvents} upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttendees}</div>
            <p className="text-sm text-gray-500">Across all events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-gray-500">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Event</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chartData.length > 0 ? chartData[0].name : "No events"}
            </div>
            <p className="text-sm text-gray-500">Upcoming event date</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendees" fill="#3b82f6" name="Attendees" />
                <Bar dataKey="capacity" fill="#93c5fd" name="Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  name="Revenue"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;