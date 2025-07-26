"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  color?: "green" | "blue";
}

export const Button = ({ children, onClick, color = "green" }: ButtonProps) => {
  const colorClasses = {
    green: "bg-green-600 hover:bg-green-700",
    blue: "bg-blue-600 hover:bg-blue-700",
  };

  const className = `px-6 py-3 text-white text-lg font-semibold rounded-lg shadow-md transition ${colorClasses[color]}`;

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
};
