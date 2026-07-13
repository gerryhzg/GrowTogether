"use client";

import { createContext, ReactNode, useContext } from "react";

export type ChildTheme = "original" | "neon-quest";

type ChildThemeContextValue = {
  childTheme: ChildTheme;
  isNeonQuest: boolean;
};

const ChildThemeContext = createContext<ChildThemeContextValue>({
  childTheme: "original",
  isNeonQuest: false,
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
      value={{ childTheme, isNeonQuest: childTheme === "neon-quest" }}
    >
      {children}
    </ChildThemeContext.Provider>
  );
}

export function useChildTheme() {
  return useContext(ChildThemeContext);
}
