import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapDisplay } from './components/MapDisplay';
import { ControlPanel } from './components/ControlPanel';
import { LandingPage } from './components/LandingPage';
import { AppStatus, Coordinates } from './types';
import { calculateDistance } from './utils/geoUtils';
import { Navigation } from 'lucide-react';

const generateAlarmSound = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.1); // A6
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2); // A5
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.3); // A6
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [targetLocation, setTargetLocation] = useState<Coordinates | null>(null);
  const [radius, setRadius] = useState<number>(500); // Default 500 meters
  const [distance, setDistance] = useState<number | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const watchIdRef = useRef<number | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Initialize Geolocation (Only after leaving landing page to save battery/permissions)
  useEffect(() => {
    if (showLanding) return;

    if (!navigator.geolocation) {
      setPermissionError("Tu navegador no soporta geolocalización.");
      return;
    }

    // Initial fetch
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        console.error(err);
        setPermissionError("Por favor permite el acceso a la ubicación para usar la alarma.");
      },
      { enableHighAccuracy: true }
    );

    // Continuous watch
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(newCoords);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [showLanding]);

  // Wake Lock Management
  useEffect(() => {
    const requestWakeLock = async () => {
      if (status === AppStatus.TRACKING && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          console.warn('Wake Lock error:', err.message);
        }
      }
    };

    if (status === AppStatus.TRACKING) {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [status]);

  const triggerAlarm = useCallback(() => {
    setStatus(AppStatus.ALARM_RINGING);
    
    // Ensure audio context is available
    let ctx = audioCtxRef.current;
    if (!ctx) {
       const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
       if (AudioContext) {
         ctx = new AudioContext();
         audioCtxRef.current = ctx;
       }
    }

    // Start loop sound
    if (ctx && !alarmIntervalRef.current) {
        // Play immediately
        generateAlarmSound(ctx);
        // Loop every 1000ms
        alarmIntervalRef.current = window.setInterval(() => {
            if (audioCtxRef.current) {
                generateAlarmSound(audioCtxRef.current);
            }
             // Vibrate if supported
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        }, 1000);
    }
  }, []);

  // Calculate Distance & Check Alarm
  useEffect(() => {
    if (userLocation && targetLocation) {
      const dist = calculateDistance(userLocation, targetLocation);
      setDistance(dist);

      if (status === AppStatus.TRACKING && dist <= radius) {
        triggerAlarm();
      }
    }
  }, [userLocation, targetLocation, radius, status, triggerAlarm]);

  const stopAlarm = useCallback(() => {
    setStatus(AppStatus.IDLE);
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const toggleTracking = useCallback(() => {
    if (status === AppStatus.IDLE) {
      // Check if we have locations
      if (!userLocation || !targetLocation) return;
      
      // Initialize/Resume Audio Context on User Gesture (Critical for browsers)
      if (!audioCtxRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
              audioCtxRef.current = new AudioContext();
          }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
      }

      setStatus(AppStatus.TRACKING);
      
      // Request Notification permission strictly for better background handling (optional)
      if ("Notification" in window && Notification.permission !== "granted") {
          Notification.requestPermission();
      }

    } else {
      setStatus(AppStatus.IDLE);
      setDistance(null);
    }
  }, [status, userLocation, targetLocation]);

  // Initial User Interaction to unlock AudioContext
  const handleStartApp = () => {
    setShowLanding(false);
    // Initialize audio context early on user interaction
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
    }
  };

  if (showLanding) {
    return <LandingPage onStart={handleStartApp} installPromptEvent={deferredPrompt} />;
  }

  return (
    <div className="relative h-screen w-screen flex flex-col bg-gray-900">
      
      {/* Error Toast */}
      {permissionError && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-red-900/90 text-red-200 p-4 rounded-lg border border-red-700 text-center text-sm">
          {permissionError}
        </div>
      )}

      {/* Map Layer (Background) */}
      <div className="flex-grow relative z-0">
        <MapDisplay 
            userLocation={userLocation}
            targetLocation={targetLocation}
            radius={radius}
            onMapClick={(coords) => {
                if (status === AppStatus.IDLE) {
                    setTargetLocation(coords);
                }
            }}
        />
      </div>

      {/* Controls Layer (Overlay) */}
      <div className="absolute bottom-0 w-full z-10 pointer-events-none">
        <div className="pointer-events-auto">
            <ControlPanel 
                status={status}
                targetLocation={targetLocation}
                radius={radius}
                distance={distance}
                onSetTarget={setTargetLocation}
                onSetRadius={setRadius}
                onToggleTracking={toggleTracking}
                onStopAlarm={stopAlarm}
            />
        </div>
      </div>

      {/* Loading Overlay for Initial Location */}
      {!userLocation && !permissionError && (
        <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center space-y-4">
            <Navigation className="w-16 h-16 text-blue-500 animate-pulse" />
            <p className="text-gray-400 font-mono animate-pulse">Obteniendo señal GPS...</p>
        </div>
      )}
    </div>
  );
}