"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Lead } from "../../components/LeadScraper";

interface CraftMessagesContextType {
  isOpen: boolean;
  selectedLead: Lead | null;
  openCraftMessages: (lead?: Lead | null) => void;
  closeCraftMessages: () => void;
}

const CraftMessagesContext = createContext<CraftMessagesContextType | undefined>(undefined);

export function CraftMessagesProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const openCraftMessages = (lead: Lead | null = null) => {
    setSelectedLead(lead);
    setIsOpen(true);
  };

  const closeCraftMessages = () => {
    setIsOpen(false);
    setSelectedLead(null);
  };

  return (
    <CraftMessagesContext.Provider value={{ isOpen, selectedLead, openCraftMessages, closeCraftMessages }}>
      {children}
    </CraftMessagesContext.Provider>
  );
}

export function useCraftMessages() {
  const context = useContext(CraftMessagesContext);
  if (context === undefined) {
    throw new Error('useCraftMessages must be used within a CraftMessagesProvider');
  }
  return context;
}
