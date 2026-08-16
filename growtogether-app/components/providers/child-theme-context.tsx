"use client";

import { createContext, ReactNode, useContext } from "react";

export type ChildTheme = "original" | "neon-quest" | "woodland" | "farm";

type ChildThemeContextValue = {
  childTheme: ChildTheme;
  isNeonQuest: boolean;
  isWoodland: boolean;
  isFarm: boolean;
};

const ChildThemeContext = createContext<ChildThemeContextValue>({
  childTheme: "original",
  isNeonQuest: false,
  isWoodland: false,
  isFarm: false,
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
        isFarm: childTheme === "farm",
      }}
    >
      {children}
    </ChildThemeContext.Provider>
  );
}

export function useChildTheme() {
  return useContext(ChildThemeContext);
}
