import React from 'react';
import { MapPin, Bell, Shield, Smartphone, Download } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  installPromptEvent: any;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, installPromptEvent }) => {
  
  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
  };

  return (
    <div className="h-screen w-full bg-gray-900 overflow-y-auto pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-gray-900 z-0"></div>
        <div className="relative z-10 px-6 pt-20 pb-10 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600/20 rounded-full mb-6 border border-blue-500/30 animate-bounce">
            <MapPin className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
            Viajero<span className="text-blue-500">Alert</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-md mx-auto leading-relaxed">
            La alarma GPS inteligente para viajeros de bus. Duerme tranquilo, nosotros te despertamos.
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="px-6 py-8 max-w-lg mx-auto grid gap-6">
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex items-start gap-4">
          <div className="bg-red-500/20 p-3 rounded-lg">
            <Bell className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Alarma Precisa</h3>
            <p className="text-gray-400 text-sm mt-1">Se activa automáticamente cuando entras en el radio de tu destino.</p>
          </div>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex items-start gap-4">
          <div className="bg-green-500/20 p-3 rounded-lg">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Viaje Seguro</h3>
            <p className="text-gray-400 text-sm mt-1">Funciona con la pantalla apagada y sin internet (con GPS).</p>
          </div>
        </div>
        
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex items-start gap-4">
          <div className="bg-purple-500/20 p-3 rounded-lg">
            <Smartphone className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Instalable</h3>
            <p className="text-gray-400 text-sm mt-1">Instálala como una App nativa en Android e iOS.</p>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent z-50 flex flex-col gap-3 max-w-lg mx-auto">
        {installPromptEvent && (
          <button 
            onClick={handleInstallClick}
            className="w-full py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-5 h-5" />
            Instalar App
          </button>
        )}
        
        <button 
          onClick={onStart}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-900/50 transition-all active:scale-95"
        >
          Comenzar Viaje
        </button>
        <p className="text-center text-gray-500 text-xs">Versión 1.0.0 Web & Mobile</p>
      </div>
    </div>
  );
};