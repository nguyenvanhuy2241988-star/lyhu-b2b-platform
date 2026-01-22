"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface HRLayoutContextProps {
    posters: (string | null)[];
    setPosters: (urls: (string | null)[]) => void;
    themeColor: string;
    setThemeColor: (color: string) => void;
}

const HRLayoutContext = createContext<HRLayoutContextProps | undefined>(undefined);

export const HRLayoutProvider = ({ children }: { children: ReactNode }) => {
    const [posters, setPosters] = useState<(string | null)[]>([null, null, null]);
    const [themeColor, setThemeColor] = useState<string>("#0d9488"); // Default Teal

    return (
        <HRLayoutContext.Provider value={{ posters, setPosters, themeColor, setThemeColor }}>
            {children}
        </HRLayoutContext.Provider>
    );
};

export const useHRLayout = () => {
    const context = useContext(HRLayoutContext);
    if (!context) {
        throw new Error("useHRLayout must be used within a HRLayoutProvider");
    }
    return context;
};
