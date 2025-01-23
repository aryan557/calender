import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';

function App() {
  const [events, setEvents] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!credentialResponse.credential) {
        throw new Error('No credential received');
      }

      const response = await axios.post('http://localhost:3000/api/calendar', {
        token: credentialResponse.credential
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      setIsLoggedIn(true);
      setEvents(response.data);
      setFilteredEvents(response.data);
    } catch (err) {
      console.error('Error details:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch calendar events. Please try again.');
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (error) => {
    console.error('Login Error:', error);
    setError('Login Failed. Please try again.');
    setIsLoggedIn(false);
  };

  useEffect(() => {
    if (startDate || endDate) {
      const filtered = events.filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date);
        if (startDate && endDate) {
          return eventDate >= startDate && eventDate <= endDate;
        } else if (startDate) {
          return eventDate >= startDate;
        } else if (endDate) {
          return eventDate <= endDate;
        }
        return true;
      });
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events);
    }
  }, [startDate, endDate, events]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-6">Welcome to Calendar Events</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              useOneTap={false}
              flow="implicit"
              scope="https://www.googleapis.com/auth/calendar.readonly"
            />
          </GoogleOAuthProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Calendar Events</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Loading events...</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  className="p-2 border rounded"
                  placeholderText="Select start date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  className="p-2 border rounded"
                  placeholderText="Select end date"
                />
              </div>
            </div>
            
            {error ? (
              <div className="text-red-500 mb-4">{error}</div>
            ) : filteredEvents.length === 0 ? (
              <p className="text-center py-4">No events found for the selected date range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEvents.map(event => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{event.summary}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(new Date(event.start.dateTime || event.start.date), 'PPp')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(new Date(event.end.dateTime || event.end.date), 'PPp')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;