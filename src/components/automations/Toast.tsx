"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastMessage = {
  type: "success" | "error" | "info";
  text: string;
};

interface ToastProps {
  message: ToastMessage | null;
  onClose: () => void;
}

const Toast = ({ message, onClose }: ToastProps) => {
  React.useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onClose(), 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const icon =
    message.type === "success" ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : message.type === "error" ? (
      <AlertCircle className="w-5 h-5 text-red-500" />
    ) : (
      <Info className="w-5 h-5 text-blue-400" />
    );

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="flex items-start gap-3 bg-black border border-[#FF6B35]/30 rounded-lg px-4 py-3 shadow-lg">
        {icon}
        <p className="text-sm text-gray-200 flex-1">{message.text}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
