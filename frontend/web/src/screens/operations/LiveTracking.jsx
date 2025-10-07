import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Wifi, WifiOff, Zap, AlertTriangle } from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';

const LiveTracking = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [liveData, setLiveData] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const navigate = useNavigate();

  // Sample live tracking data - focused on real-time monitoring
  const [devices] = useState([
    {
      id: 'TRK-001',
      type: 'GPS Collar',
      animalId: 'E-012',
      animalName: 'Elena (Matriarch)',
      species: 'African Elephant',
      status: 'Active',
      lastPing: new Date(Date.now() - 45000),
      battery: 87,
      signalStrength: 95,
      coordinates: [34.8532, -2.0891],
      speed: 2.3,
      heading: 'NE',
      altitude: 1247,
      temperature: 28.5,
      heartRate: 42,
      location: 'Tsavo East NP'
    },
    {
      id: 'TRK-002', 
      type: 'Satellite Tag',
      animalId: 'L-005',
      animalName: 'Simba (M)',
      species: 'African Lion',
      status: 'Active',
      lastPing: new Date(Date.now() - 120000),
      battery: 72,
      signalStrength: 88,
      coordinates: [34.7721, -2.1345],
      speed: 0,
      heading: 'Stationary',
      altitude: 1156,
      temperature: 31.2,
      heartRate: 38,
      location: 'Maasai Mara Reserve'
    },
    {
      id: 'TRK-003',
      type: 'Radio Collar',
      animalId: 'R-008',
      animalName: 'Black Thunder',
      species: 'Black Rhino',
      status: 'Critical',
      lastPing: new Date(Date.now() - 900000),
      battery: 23,
      signalStrength: 34,
      coordinates: [34.8901, -2.0672],
      speed: 4.1,
      heading: 'SW',
      altitude: 1089,
      temperature: 29.8,
      heartRate: 48,
      location: 'Danger Zone'
    },
    {
      id: 'TRK-004',
      type: 'GPS Collar',
      animalId: 'G-017',
      animalName: 'Tower',
      species: 'Giraffe',
      status: 'Active',
      lastPing: new Date(Date.now() - 60000),
      battery: 91,
      signalStrength: 92,
      coordinates: [34.8234, -2.1089],
      speed: 0.8,
      heading: 'N',
      altitude: 1298,
      temperature: 27.9,
      heartRate: 35,
      location: 'Acacia Grove'
    },
    {
      id: 'TRK-005',
      type: 'Satellite Tag',
      animalId: 'P-002',
      animalName: 'Armored One',
      species: 'Pangolin',
      status: 'Offline',
      lastPing: new Date(Date.now() - 3600000),
      battery: 8,
      signalStrength: 0,
      coordinates: [34.7456, -2.0834],
      speed: 0,
      heading: 'Unknown',
      altitude: 1134,
      temperature: null,
      heartRate: null,
      location: 'Last Known: Rock Outcrop'
    }
  ]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => {
        return devices.map(device => {
          if (device.status === 'Active') {
            return {
              ...device,
              lastPing: new Date(),
              battery: Math.max(0, device.battery - Math.random() * 0.1),
              signalStrength: Math.min(100, Math.max(0, device.signalStrength + (Math.random() - 0.5) * 5)),
              speed: Math.max(0, device.speed + (Math.random() - 0.5) * 1),
              heartRate: device.heartRate + Math.floor((Math.random() - 0.5) * 6)
            };
          }
          return device;
        });
      });
    }, 2000);

    setLiveData(devices);
    return () => clearInterval(interval);
  }, [devices]);



  const formatTimeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex h-screen bg-brand-1-50 overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Live Device Tracking</h1>
              <p className="text-sm text-gray-600 mt-1">Real-time monitoring and device status</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last sync: {new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Connected
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Status Overview Cards */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Active Signals Card */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Signals</p>
                  <p className="text-3xl font-semibold text-gray-900">{liveData.filter(d => d.status === 'Active').length}/{liveData.length}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Wifi className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Low Power Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Power</p>
                  <p className="text-3xl font-semibold text-gray-900">{liveData.filter(d => d.battery < 30).length}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>

            {/* Weak Signals Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Weak Signals</p>
                  <p className="text-3xl font-semibold text-gray-900">{liveData.filter(d => d.signalStrength < 40).length}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Offline Devices Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Offline</p>
                  <p className="text-3xl font-semibold text-gray-900">{liveData.filter(d => d.status === 'Offline').length}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <WifiOff className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Device List */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden" style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>
            <div className="px-6 py-3 border-b bg-brand-1-50">
              <h3 className="text-sm font-medium text-gray-900">Active Devices ({liveData.length})</h3>
            </div>
            <div className="divide-y">
              {liveData.map((device) => (
                <div 
                  key={device.id} 
                  className="p-4 hover:bg-brand-1-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedDevice(device)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          device.status === 'Active' ? 'dot-brand-1' :
                          device.status === 'Critical' ? 'dot-brand-2' : 'bg-brand-2-50'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{device.animalName}</div>
                          <div className="text-xs text-gray-500">{device.id} • {device.species}</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600 min-w-32 hidden sm:block">
                        {device.location}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-xs">
                      <div className="text-center">
                        <div className="text-gray-500 mb-1">Battery</div>
                        <div className={`font-medium text-brand-2`}>{Math.round(device.battery)}%</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-gray-500 mb-1">Signal</div>
                        <div className={`font-medium text-brand-2`}>{device.signalStrength}%</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-gray-500 mb-1">Last Seen</div>
                        <div className="font-medium text-gray-900">{formatTimeSince(device.lastPing)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                  <p className="text-sm text-gray-500">{selectedDevice.id} • {selectedDevice.species}</p>
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
                  <p className={`font-medium text-brand-2`}>{selectedDevice.status}</p>
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
                <p className="font-mono text-sm">{selectedDevice.coordinates[0]}, {selectedDevice.coordinates[1]}</p>
              </div>
              
              <div className="pt-2">
                <span className="text-gray-500 text-sm">Location</span>
                <p className="font-medium">{selectedDevice.location}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default LiveTracking;