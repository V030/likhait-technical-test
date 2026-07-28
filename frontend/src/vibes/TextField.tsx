/**
 * Reusable TextField component
 */

import React from "react";
import { COLORS } from "../constants/colors";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  variant?: "default" | "underline";
}

export function TextField({
  label,
  error,
  fullWidth = false,
  variant = "default",
  type,
  ...props
}: TextFieldProps) {
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
  };

  const inputStyle: React.CSSProperties = {
    padding: variant === "underline" ? 0 : "0.5rem 0.75rem",
    fontSize: "1rem",
    border:
      variant === "underline"
        ? "none"
        : `1px solid ${error ? COLORS.danger : COLORS.border}`,
    borderBottom:
      variant === "underline"
        ? `1px solid ${error ? COLORS.danger : COLORS.border}`
        : undefined,
    borderRadius: variant === "underline" ? 0 : "0.375rem",
    outline: "none",
    transition: "border-color 0.2s",
    boxShadow: "none",
    appearance: type === "date" ? "none" : undefined,
    WebkitAppearance: type === "date" ? "none" : undefined,
    backgroundColor:
      variant === "underline" ? "transparent" : COLORS.background.main,
    color: COLORS.text.primary,
    margin: 0,
    width: "100%",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    color: COLORS.danger,
    marginTop: "-0.25rem",
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <input type={type} style={inputStyle} {...props} />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}
