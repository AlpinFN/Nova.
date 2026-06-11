import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export function Impressum({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="w-full h-full flex flex-col items-center bg-zinc-950 overflow-y-auto p-4 md:p-12 text-zinc-100">
      <button 
        onClick={onBack}
        className="self-start mb-8 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-lime-400 transition-colors bg-zinc-900 px-6 py-3 rounded-full shadow-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('Return')}
      </button>

      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-4 mb-8 text-lime-400">
          <Shield className="w-10 h-10" />
          <h1 className="font-display font-bold text-4xl tracking-tighter">Impressum</h1>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400 opacity-5 blur-[80px] group-hover:opacity-10 transition-opacity"></div>
          
          <div className="space-y-6 relative z-10 text-zinc-300">
            <h2 className="text-xl font-bold text-white mb-2 font-display">Angaben gemäß § 5 TMG</h2>
            
            <div>
              <p className="font-bold text-lg text-white">Marcel Koukoui</p>
              <p>Rummelsberg 31 C</p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-1">Kontakt</h3>
              <p>E-Mail: <a href="mailto:fremdespti@gmail.com" className="text-lime-400 hover:underline">fremdespti@gmail.com</a></p>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-800 text-sm text-zinc-500">
             <p>Diese Applikation ist ein unregulierter, grenzenloser Videoplayer. Alle generierten Inhalte basieren auf KI-Algorithmen und spiegeln nicht zwangsläufig echte Entitäten wider.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
