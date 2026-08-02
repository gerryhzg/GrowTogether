"use client";

import { createContext, ReactNode, useContext } from "react";

export type ChildTheme = "original" | "neon-quest" | "woodland";

type ChildThemeContextValue = {
  childTheme: ChildTheme;
  isNeonQuest: boolean;
  isWoodland: boolean;
};

const ChildThemeContext = createContext<ChildThemeContextValue>({
  childTheme: "original",
  isNeonQuest: false,
  isWoodland: false,
});

export function ChildThemeProvider({
  children,
  childTheme,
}: {
  children: ReactNode;
  childTheme: ChildTheme;
}) {
  return (
    <ChildThemeContext.Provider
      value={{
        childTheme,
        isNeonQuest: childTheme === "neon-quest",
        isWoodland: childTheme === "woodland",
      }}
    >
      {children}
    </ChildThemeContext.Provider>
  );
}

export function useChildTheme() {
  return useContext(ChildThemeContext);
}
