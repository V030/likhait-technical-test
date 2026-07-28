/**
 * Quick add button component
 */

import React from "react";
import { COLORS } from "../constants/colors";

interface QuickAddButtonProps {
  onClick: () => void;
}

export function QuickAddButton({ onClick }: QuickAddButtonProps) {
  const buttonStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: COLORS.accent.a01,
    color: "white",
    border: "none",
    fontSize: "2rem",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    zIndex: 100,
  };

  return (
    <button
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      aria-label="Add expense"
    >
      +
    </button>
  );
}
