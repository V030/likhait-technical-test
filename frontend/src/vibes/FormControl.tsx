/**
 * Reusable FormControl component for consistent form field styling
 */

import React from "react";
import { COLORS } from "../constants/colors";

interface FormControlProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function FormControl({
  label,
  error,
  required,
  children,
  fullWidth = false,
}: FormControlProps) {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    width: fullWidth ? "100%" : "auto",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: COLORS.text.primary,
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    color: COLORS.danger,
    marginTop: "-0.25rem",
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={{ color: COLORS.danger }}>*</span>}
        </label>
      )}
      {children}
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}
