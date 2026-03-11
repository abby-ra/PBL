import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Load saved theme from localStorage, default to 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sap-theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', systemDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }

    // Persist across page reloads
    localStorage.setItem('sap-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Use this hook in any component to read or change theme
export function useTheme() {
  return useContext(ThemeContext);
}