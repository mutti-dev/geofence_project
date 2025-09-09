import React, { createContext, useState, useEffect } from "react";
import { Appearance } from "react-native";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const colorScheme = Appearance.getColorScheme();
  const [currentTheme, setCurrentTheme] = useState(colorScheme || "light");

  const palette = {
    primary: "#008080", // teal
    accent: "#ff7f50", // coral/orange
    backgroundLight: "#ffffff",
    backgroundDark: "#121212",
  };

  const colors = {
    primary: palette.primary,
    accent: palette.accent,
    background:
      currentTheme === "dark"
        ? palette.backgroundDark
        : palette.backgroundLight,
    text: currentTheme === "dark" ? "#fff" : "#222",
  };

  const toggleTheme = (theme) => {
    if (theme === "system") {
      const systemTheme = Appearance.getColorScheme();
      setCurrentTheme(systemTheme);
    } else {
      setCurrentTheme(theme === "dark" ? "dark" : "light");
    }
  };

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      if (currentTheme === "system") setCurrentTheme(colorScheme);
    });
    return () => listener.remove();
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
