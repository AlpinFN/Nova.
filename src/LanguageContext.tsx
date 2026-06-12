import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'de' | 'es' | 'fr';

interface LangContext {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'Explore': 'Explore',
    'Trending': 'Trending',
    'Shorts Feed': 'Shorts Feed',
    'Tag Search': 'Tag Search',
    'Community': 'Community',
    'Comms': 'Comms',
    'Playlists': 'Playlists',
    'History': 'History',
    'My Channel': 'My Channel',
    'Go Live': 'Go Live',
    'New Post': 'New Post',
    'Upload Video': 'Upload Video',
    'SEARCH ARCHIVES...': 'SEARCH ARCHIVES...',
    'Global Feed': 'Global Feed',
    'Return': 'Return',
    'No new notifications': 'No new notifications',
    'Arcade': 'Arcade',
    'Time Machine': 'Time Machine',
    'All': 'All',
    'Gaming': 'Gaming',
    'Music': 'Music',
    'Tech': 'Tech',
    'Education': 'Education',
    'Entertainment': 'Entertainment',
    'Vlogs': 'Vlogs',
    'Settings': 'Settings',
    'Studio': 'KynxTV Studio',
    'No Media Selected': 'No Media Selected',
    'Import Media': 'Import Media',
    'Or Drag & Drop': 'Or Drag & Drop'
  },
  de: {
    'Explore': 'Entdecken',
    'Trending': 'Trends',
    'Shorts Feed': 'Shorts Feed',
    'Tag Search': 'Hashtag Suche',
    'Community': 'Community',
    'Comms': 'Nachrichten',
    'Playlists': 'Wiedergabelisten',
    'History': 'Verlauf',
    'My Channel': 'Mein Kanal',
    'Go Live': 'Live gehen',
    'New Post': 'Neuer Beitrag',
    'Upload Video': 'Video hochladen',
    'SEARCH ARCHIVES...': 'ARCHIVE DURCHSUCHEN...',
    'Global Feed': 'Globaler Feed',
    'Return': 'Zurück',
    'No new notifications': 'Keine neuen Benachrichtigungen',
    'Arcade': 'Arcade',
    'Time Machine': 'Zeitmaschine',
    'All': 'Alle',
    'Gaming': 'Gaming',
    'Music': 'Musik',
    'Tech': 'Tech',
    'Education': 'Bildung',
    'Entertainment': 'Unterhaltung',
    'Vlogs': 'Vlogs',
    'Settings': 'Einstellungen',
    'Studio': 'KynxTV Studio',
    'No Media Selected': 'Keine Medien ausgewählt',
    'Import Media': 'Medien Importieren',
    'Or Drag & Drop': 'Oder Drag & Drop',
    'Empty Signal': 'Leeres Signal',
    'No transmissions found. Initiate a local upload to populate your frequency.': 'Keine Übertragungen gefunden. Starte einen lokalen Upload.',
    'Initiate Upload': 'Upload Starten',
    'Search Results': 'Suchergebnisse',
    'Channels': 'Kanäle',
    'Videos': 'Videos',
    'Resonances': 'Resonanzen',
    'Channels & Profiles': 'Kanäle & Profile',
  },
  es: {
    'Explore': 'Explorar',
    'Trending': 'Tendencias',
    'Shorts Feed': 'Feed de Shorts',
    'Tag Search': 'Buscar Tags',
    'Community': 'Comunidad',
    'Comms': 'Comunicaciones',
    'Playlists': 'Listas de resproducción',
    'History': 'Historial',
    'My Channel': 'Mi Canal',
    'Go Live': 'Transmitir',
    'New Post': 'Nueva Publicación',
    'Upload Video': 'Subir Video',
    'SEARCH ARCHIVES...': 'BUSCAR ARCHIVOS...',
    'Global Feed': 'Feed Global',
    'Return': 'Volver',
    'No new notifications': 'No hay nuevas notificaciones',
    'Arcade': 'Arcade',
    'Time Machine': 'Máquina del Tiempo',
    'All': 'Todos',
    'Gaming': 'Juegos',
    'Music': 'Música',
    'Tech': 'Tecnología',
    'Education': 'Educación',
    'Entertainment': 'Entretenimiento',
    'Vlogs': 'Vlogs',
    'Settings': 'Ajustes',
    'Studio': 'Estudio KynxTV',
    'No Media Selected': 'Ningún medio seleccionado',
    'Import Media': 'Importar Medios',
    'Or Drag & Drop': 'O arrastra y suelta',
    'Empty Signal': 'Señal Vacía',
    'No transmissions found. Initiate a local upload to populate your frequency.': 'No se encontraron vídeos. Sube algo.',
    'Initiate Upload': 'Subir',
    'Search Results': 'Resultados',
    'Channels': 'Canales',
    'Videos': 'Vídeos',
    'Resonances': 'Resonancias',
    'Channels & Profiles': 'Canales y perfiles',
  },
  fr: {
    'Explore': 'Explorer',
    'Trending': 'Tendances',
    'Shorts Feed': 'Vidéos Courtes',
    'Tag Search': 'Recherche Tags',
    'Community': 'Communauté',
    'Comms': 'Messages',
    'Playlists': 'Listes de lecture',
    'History': 'Historique',
    'My Channel': 'Ma Chaîne',
    'Go Live': 'Diffuser en direct',
    'New Post': 'Nouveau Post',
    'Upload Video': 'Mettre en ligne',
    'SEARCH ARCHIVES...': 'RECHERCHER...',
    'Global Feed': 'Flux Global',
    'Return': 'Retour',
    'No new notifications': 'Aucune nouvelle notification',
    'Arcade': 'Arcade',
    'Time Machine': 'Machine à Voyager',
    'All': 'Tous',
    'Gaming': 'Jeux',
    'Music': 'Musique',
    'Tech': 'Tech',
    'Education': 'Éducation',
    'Entertainment': 'Divertissement',
    'Vlogs': 'Vlogs',
    'Settings': 'Paramètres',
    'Studio': 'KynxTV Studio',
    'No Media Selected': 'Aucun média sélectionné',
    'Import Media': 'Importer des Médias',
    'Or Drag & Drop': 'Ou glisser et déposer',
    'Empty Signal': 'Signal Vidé',
    'No transmissions found. Initiate a local upload to populate your frequency.': 'Aucun rapport. Uploader une vidéo.',
    'Initiate Upload': 'Uploader',
    'Search Results': 'Résultats',
    'Channels': 'Chaînes',
    'Videos': 'Vidéos',
    'Resonances': 'Résonances',
    'Channels & Profiles': 'Chaînes et profils',
  }
};

const LanguageContext = createContext<LangContext>({} as LangContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('nova_lang') as Language;
    if (saved && translations[saved]) {
      setLangState(saved);
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('nova_lang', l);
  };

  const t = (key: string) => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
