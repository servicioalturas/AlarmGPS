import React, { useState, useCallback } from 'react';
import { AppStatus, Coordinates } from '../types';
import { searchLocation } from '../services/geminiService';
import { Loader2, Search, MapPin, Bell, BellOff } from 'lucide-react';

interface ControlPanelProps {
  status: AppStatus;
  targetLocation: Coordinates | null;
  radius: number;
  distance: number | null;
  onSetTarget: (coords: Coordinates) => void;
  onSetRadius: (radius: number) => void;
  onToggleTracking: () => void;
  onStopAlarm: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  targetLocation,
  radius,
  distance,
  onSetTarget,
  onSetRadius,
  onToggleTracking,
  onStopAlarm
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    
    const result = await searchLocation(searchQuery);
    
    setIsSearching(false);
    
    if (result) {
      onSetTarget(result.coords);
    } else {
      setSearchError('No se encontró la ubicación. Intenta ser más específico.');
    }
  }, [searchQuery, onSetTarget]);

  const isAlarmRinging = status === AppStatus.ALARM_RINGING;
  const isTracking = status === AppStatus.TRACKING;

  return (
    <div className="bg-gray-800 p-4 rounded-t-3xl shadow-2xl w-full max-w-md mx-auto border-t border-gray-700 z-20">
      
      {/* Header / Status Indicator */}
      <div className="flex justify-between items-center mb-4">
        <div>
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <MapPin className="text-blue-400" />
             ViajeroAlert
           </h2>
           <p className="text-gray-400 text-xs">Alarma GPS Inteligente</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          isTracking ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-gray-700 border-gray-600 text-gray-400'
        }`}>
          {isTracking ? 'RASTREANDO' : 'INACTIVO'}
        </div>
      </div>

      {/* Search Form */}
      {!isTracking && !isAlarmRinging && (
        <form onSubmit={handleSearch} className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar destino (ej. Terminal Norte)"
            className="w-full bg-gray-900 border border-gray-700 text-white p-3 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500 transition-all"
          />
          <Search className="absolute left-3 top-3.5 text-gray-500 w-4 h-4" />
          <button 
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span className="text-xs font-bold text-white">Ir</span>}
          </button>
        </form>
      )}

      {searchError && (
        <p className="text-red-400 text-xs mb-3">{searchError}</p>
      )}

      {/* Active Tracking Display */}
      {(isTracking || isAlarmRinging) && distance !== null && (
        <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-700 text-center">
          <p className="text-gray-400 text-sm mb-1">Distancia al destino</p>
          <div className="text-4xl font-mono font-bold text-white tracking-tighter">
            {distance < 1000 ? distance.toFixed(0) : (distance / 1000).toFixed(2)}
            <span className="text-lg text-gray-500 ml-1">{distance < 1000 ? 'm' : 'km'}</span>
          </div>
          {isAlarmRinging && (
             <div className="mt-2 animate-pulse text-red-500 font-bold text-lg flex justify-center items-center gap-2">
               <Bell className="fill-current" /> ¡LLEGANDO AL DESTINO!
             </div>
          )}
        </div>
      )}

      {/* Configuration (Only when Idle) */}
      {!isTracking && !isAlarmRinging && targetLocation && (
        <div className="mb-6 space-y-3">
           <div className="flex justify-between items-center">
             <label className="text-gray-300 text-sm">Radio de Alarma</label>
             <span className="text-blue-400 font-bold text-sm">{radius} metros</span>
           </div>
           <input
             type="range"
             min="100"
             max="2000"
             step="100"
             value={radius}
             onChange={(e) => onSetRadius(Number(e.target.value))}
             className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
           />
           <div className="flex justify-between text-xs text-gray-500 px-1">
             <span>100m</span>
             <span>2km</span>
           </div>
        </div>
      )}

      {/* Main Action Button */}
      {isAlarmRinging ? (
        <button
          onClick={onStopAlarm}
          className="w-full py-4 bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl text-white font-bold text-lg shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 transition-all animate-bounce"
        >
          <BellOff /> DETENER ALARMA
        </button>
      ) : (
        <button
          onClick={onToggleTracking}
          disabled={!targetLocation}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
            !targetLocation 
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
              : isTracking
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-500/20'
          }`}
        >
          {isTracking ? 'Cancelar Viaje' : 'Iniciar Alarma'}
        </button>
      )}

      {!targetLocation && !isTracking && (
        <p className="text-center text-gray-500 text-xs mt-2">
          Selecciona un destino en el mapa o búscalo para comenzar.
        </p>
      )}
    </div>
  );
};
