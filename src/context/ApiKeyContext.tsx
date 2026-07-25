"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ApiKeyContextType {
  apiKey: string;
  keyPrefix: string;
  setApiKey: (key: string) => void;
  setKeyPrefix: (prefix: string) => void;
  setKeyDetails: (key: string, prefix: string) => void;
  clearKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ce_api_key") || "";
    }
    return "";
  });
  const [keyPrefix, setKeyPrefixState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ce_key_prefix") || "";
    }
    return "";
  });

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (typeof window !== "undefined") {
      if (key) localStorage.setItem("ce_api_key", key);
      else localStorage.removeItem("ce_api_key");
    }
  };

  const setKeyPrefix = (prefix: string) => {
    setKeyPrefixState(prefix);
    if (typeof window !== "undefined") {
      if (prefix) localStorage.setItem("ce_key_prefix", prefix);
      else localStorage.removeItem("ce_key_prefix");
    }
  };

  const setKeyDetails = (key: string, prefix: string) => {
    setApiKey(key);
    setKeyPrefix(prefix);
  };

  const clearKey = () => {
    setApiKey("");
    setKeyPrefix("");
  };

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        keyPrefix,
        setApiKey,
        setKeyPrefix,
        setKeyDetails,
        clearKey,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error("useApiKey must be used within an ApiKeyProvider");
  }
  return context;
}
