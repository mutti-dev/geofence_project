import React, { createContext, useState, useEffect } from "react";
import { Appearance } from "react-native";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const colorScheme = Appearance.getColorScheme();
  const [currentTheme, setCurrentTheme] = useState(colorScheme || "light");

  const toggleTheme = (theme) => {
    if (theme === "system") {
      const systemTheme = Appearance.getColorScheme();
      setCurrentTheme(systemTheme);
    } else {
      setCurrentTheme(theme);
    }
  };

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      if (currentTheme === "system") setCurrentTheme(colorScheme);
    });
    return () => listener.remove();
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
