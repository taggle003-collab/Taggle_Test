'use client';

import { useState, useRef, useEffect } from 'react';

interface ExportMenuProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  showPDF?: boolean;
}

export function ExportMenu({ onExportCSV, onExportPDF, showPDF = false }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    onExportCSV();
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    onExportPDF();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#2a2a2a] hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm border border-gray-600 transition-colors flex items-center gap-1"
      >
        Export
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={handleExportCSV}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
            >
              📊 Export CSV
            </button>
            {showPDF && (
              <button
                onClick={handleExportPDF}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                📄 Export PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}