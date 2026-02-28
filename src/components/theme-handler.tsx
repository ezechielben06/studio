'use client';

import { useEffect } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Composant invisible qui gère l'application du thème (clair/sombre/système)
 * en fonction des préférences de l'utilisateur stockées dans Firestore.
 */
export function ThemeHandler() {
  const { firestore, user } = useFirebase();

  // Récupération des paramètres utilisateur
  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid, "settings", "general");
  }, [firestore, user]);

  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    const root = window.document.documentElement;
    const themePreference = settings?.theme || 'system';

    const applyTheme = (theme: string) => {
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme(themePreference);

    // Écouteur pour le changement de thème système si "system" est sélectionné
    if (themePreference === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings?.theme]);

  return null;
}
