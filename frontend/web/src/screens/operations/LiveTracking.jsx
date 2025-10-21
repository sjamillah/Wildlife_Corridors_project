import React, { useState, useEffect } from 'react';
import { Eye, Wifi, Battery, MapPin, Signal, Play, Square, Route, Bell } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { LiveTrackingHeader } from '../../components/shared/HeaderVariants';
import auth from '../../services/auth';

const LiveTracking = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [devices, setDevices] = useState([]);
  const [trackingMode, setTrackingMode] = useState({}); // Track which devices are being actively tracked

  const handleLogout = () => {
    auth.logout();
  };

  const handleStartTracking = (deviceId) => {
    setTrackingMode(prev => ({ ...prev, [deviceId]: true }));
    // In a real app, this would start live GPS tracking
    console.log(`Started live tracking for device: ${deviceId}`);
  };

  const handleStopTracking = (deviceId) => {
    setTrackingMode(prev => ({ ...prev, [deviceId]: false }));
    // In a real app, this would stop live GPS tracking
    console.log(`Stopped live tracking for device: ${deviceId}`);
  };

  const handleViewOnMap = (device) => {
    // In a real app, this would open the map view
    alert(`📍 Opening map view for ${device.animalName}\nLocation: ${device.location}\nCoordinates: ${device.coordinates[0].toFixed(4)}, ${device.coordinates[1].toFixed(4)}`);
  };

  const handleViewRoute = (device) => {
    // In a real app, this would show historical route
    alert(`🛤️ Viewing route history for ${device.animalName}\nLast 24 hours of movement data would be displayed here.`);
  };

  const handleSetAlert = (device) => {
    // In a real app, this would set up geo-fence alerts
    alert(`🔔 Setting up alerts for ${device.animalName}\nYou can configure:\n• Geo-fence boundaries\n• Speed alerts\n• Battery low warnings\n• Signal loss notifications`);
  };

  useEffect(() => {
    // Mock data for live tracking devices
    const mockDevices = [
      {
        id: 'WC-001',
        animalName: 'Luna',
        speciesName: 'Gray Wolf',
        type: 'GPS Collar',
        status: 'Active',
        battery: 78,
        signalStrength: 85,
        coordinates: [40.7128, -74.0060],
        location: 'Northern Reserve, Zone A',
        lastPing: Date.now() - 300000, // 5 minutes ago
        speed: 4.2,
        heading: 'Northeast',
        altitude: 1205,
        temperature: 8
      },
      {
        id: 'WC-002',
        animalName: 'Atlas',
        speciesName: 'Mountain Lion',
        type: 'Satellite Collar',
        status: 'Active',
        battery: 92,
        signalStrength: 72,
        coordinates: [40.7580, -73.9855],
        location: 'Eastern Ridge Trail',
        lastPing: Date.now() - 120000, // 2 minutes ago
        speed: 0,
        heading: 'Stationary',
        altitude: 1450,
        temperature: 12
      },
      {
        id: 'WC-003',
        animalName: 'Nova',
        speciesName: 'Black Bear',
        type: 'GPS Collar',
        status: 'Critical',
        battery: 23,
        signalStrength: 41,
        coordinates: [40.7831, -73.9712],
        location: 'Southern Valley',
        lastPing: Date.now() - 900000, // 15 minutes ago
        speed: 1.8,
        heading: 'Southwest',
        altitude: 980,
        temperature: 6
      },
      {
        id: 'WC-004',
        animalName: 'Echo',
        speciesName: 'Lynx',
        type: 'Light Collar',
        status: 'Low Battery',
        battery: 15,
        signalStrength: 38,
        coordinates: [40.7489, -73.9680],
        location: 'Western Forest Edge',
        lastPing: Date.now() - 1800000, // 30 minutes ago
        speed: 0.5,
        heading: 'North',
        altitude: 1100,
        temperature: 4
      }
    ];

    setDevices(mockDevices);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setDevices(prevDevices => 
        prevDevices.map(device => {
          // Simulate small changes in data
          const batteryDelta = Math.random() * 2 - 1; // -1 to +1
          const signalDelta = Math.random() * 10 - 5; // -5 to +5
          
          return {
            ...device,
            battery: Math.max(0, Math.min(100, device.battery + batteryDelta)),
            signalStrength: Math.max(0, Math.min(100, device.signalStrength + signalDelta)),
            lastPing: Math.random() > 0.7 ? Date.now() : device.lastPing // 30% chance of new ping
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeSince = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  // Calculate stats
  const activeDevices = devices.filter(d => d.status === 'Active').length;
  const lowBatteryDevices = devices.filter(d => d.battery < 30).length;
  const weakSignalDevices = devices.filter(d => d.signalStrength < 50).length;
  const offlineDevices = devices.filter(d => d.status === 'Offline').length;

  return (
    <>
      <div className="flex h-screen bg-brand-bg overflow-hidden">
        <Sidebar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <LiveTrackingHeader 
            devices={devices} 
            lastSync={new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
          />

          <div className="flex-1 overflow-y-auto">
            {/* Status Cards Section */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-highlight px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Active Signals Card */}
                <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand-text-secondary">Active Signals</p>
                      <p className="text-2xl sm:text-3xl font-bold text-brand-text">{activeDevices}</p>
                    </div>
                    <div className="p-3 bg-brand-primary/10 rounded-xl">
                      <Signal className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                    </div>
                  </div>
                </div>

                {/* Low Power Card */}
                <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand-text-secondary">Low Power</p>
                      <p className="text-2xl sm:text-3xl font-bold text-brand-text">{lowBatteryDevices}</p>
                    </div>
                    <div className="p-3 bg-status-warning/10 rounded-xl">
                      <Battery className="w-5 h-5 sm:w-6 sm:h-6 text-status-warning" />
                    </div>
                  </div>
                </div>

                {/* Weak Signals Card */}
                <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand-text-secondary">Weak Signals</p>
                      <p className="text-2xl sm:text-3xl font-bold text-brand-text">{weakSignalDevices}</p>
                    </div>
                    <div className="p-3 bg-status-error/10 rounded-xl">
                      <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-status-error" />
                    </div>
                  </div>
                </div>

                {/* Offline Card */}
                <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand-text-secondary">Offline</p>
                      <p className="text-2xl sm:text-3xl font-bold text-brand-text">{offlineDevices}</p>
                    </div>
                    <div className="p-3 bg-brand-accent/20 rounded-xl">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Device List */}
            <div className="p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-brand-text mb-4 sm:mb-6 animate-slide-up">Device Status</h2>
              <div className="bg-brand-surface rounded-xl border border-brand-border shadow-lg overflow-hidden animate-fade-in" style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>
                <div className="px-6 py-3 border-b bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700">Connected Devices ({devices.length})</h3>
                </div>
                <div className="divide-y">
                  {devices.map((device) => (
                    <div 
                      key={device.id} 
                      className="px-6 py-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${
                              device.status === 'Active' ? 'bg-brand-primary' :
                              device.status === 'Critical' ? 'bg-brand-earth' : 'bg-brand-accent'
                            }`}></div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{device.animalName}</div>
                              <div className="text-xs text-gray-500">{device.id} • {device.speciesName}</div>
                            </div>
                          </div>

                          <div className="text-xs text-gray-600 min-w-32 hidden sm:block">
                            {device.location}
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-xs">
                          <div className="text-center">
                            <div className="text-gray-500 mb-1">Battery</div>
                            <div className={`font-medium ${
                              device.battery > 50 ? 'text-brand-primary' :
                              device.battery > 20 ? 'text-brand-earth' : 'text-brand-accent'
                            }`}>{Math.round(device.battery)}%</div>
                          </div>

                          <div className="text-center">
                            <div className="text-gray-500 mb-1">Signal</div>
                            <div className={`font-medium ${
                              device.signalStrength > 70 ? 'text-brand-primary' :
                              device.signalStrength > 40 ? 'text-brand-earth' : 'text-brand-accent'
                            }`}>{device.signalStrength}%</div>
                          </div>

                          <div className="text-center">
                            <div className="text-gray-500 mb-1">Last Seen</div>
                            <div className="font-medium text-gray-900">{formatTimeSince(device.lastPing)}</div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          {trackingMode[device.id] ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStopTracking(device.id);
                              }}
                              className="px-3 py-1.5 bg-brand-accent text-brand-primary text-xs font-medium rounded-lg hover:bg-brand-secondary transition-colors flex items-center gap-1"
                            >
                              <Square className="w-3 h-3" />
                              Stop
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartTracking(device.id);
                              }}
                              className="px-3 py-1.5 bg-brand-primary/20 text-brand-primary text-xs font-medium rounded-lg hover:bg-brand-primary/30 transition-colors flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              Track Live
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDevice(device);
                            }}
                            className="p-1.5 text-gray-400 hover:text-brand-primary transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50" onClick={() => setSelectedDevice(null)}>
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl" style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedDevice.animalName}</h3>
                  <p className="text-sm text-gray-500">{selectedDevice.id} • {selectedDevice.speciesName}</p>
                </div>
                <button 
                  onClick={() => setSelectedDevice(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Device Type</span>
                  <p className="font-medium">{selectedDevice.type}</p>
                </div>
                <div>
                  <span className="text-gray-500">Current Status</span>
                  <p className={`font-medium ${
                    selectedDevice.status === 'Active' ? 'text-brand-primary' :
                    selectedDevice.status === 'Critical' ? 'text-red-600' : 'text-gray-600'
                  }`}>{selectedDevice.status}</p>
                </div>
                <div>
                  <span className="text-gray-500">Speed</span>
                  <p className="font-medium">{selectedDevice.speed} km/h</p>
                </div>
                <div>
                  <span className="text-gray-500">Heading</span>
                  <p className="font-medium">{selectedDevice.heading}</p>
                </div>
                <div>
                  <span className="text-gray-500">Altitude</span>
                  <p className="font-medium">{selectedDevice.altitude}m</p>
                </div>
                {selectedDevice.temperature && (
                  <div>
                    <span className="text-gray-500">Temperature</span>
                    <p className="font-medium">{selectedDevice.temperature}°C</p>
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t">
                <span className="text-gray-500 text-sm">GPS Coordinates</span>
                <p className="font-mono text-sm">{selectedDevice.coordinates[0].toFixed(4)}, {selectedDevice.coordinates[1].toFixed(4)}</p>
              </div>
              
              <div className="pt-2">
                <span className="text-gray-500 text-sm">Location</span>
                <p className="font-medium">{selectedDevice.location}</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Tracking Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleViewOnMap(selectedDevice)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary/20 transition-colors text-sm font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Map
                  </button>
                  <button
                    onClick={() => handleViewRoute(selectedDevice)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Route className="w-4 h-4" />
                    View Route
                  </button>
                  <button
                    onClick={() => handleSetAlert(selectedDevice)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                  >
                    <Bell className="w-4 h-4" />
                    Set Alerts
                  </button>
                  {trackingMode[selectedDevice.id] ? (
                    <button
                      onClick={() => handleStopTracking(selectedDevice.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <Square className="w-4 h-4" />
                      Stop Tracking
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTracking(selectedDevice.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary/20 transition-colors text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Start Tracking
                    </button>
                  )}
                </div>
              </div>

              {/* Live Status Indicator */}
              {trackingMode[selectedDevice.id] && (
                <div className="pt-3 border-t bg-brand-primary/10 -mx-6 px-6 py-3 mt-4">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live tracking active</span>
                  </div>
                  <p className="text-xs text-brand-primary mt-1">Receiving real-time location updates</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LiveTracking;