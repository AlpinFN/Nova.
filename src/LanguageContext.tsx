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
