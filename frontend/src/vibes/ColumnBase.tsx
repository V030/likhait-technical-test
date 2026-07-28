/**
 * Base column component for tables
 */

import React from "react";
import { COLORS } from "../constants/colors";

interface ColumnBaseProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  isHeader?: boolean;
}

export function ColumnBase({
  children,
  align = "left",
  width,
  isHeader = false,
}: ColumnBaseProps) {
  const style: React.CSSProperties = {
    padding: "0.75rem",
    textAlign: align,
    width,
    fontWeight: isHeader ? 600 : 400,
    color: isHeader ? COLORS.text.primary : COLORS.text.primary,
    backgroundColor: isHeader ? COLORS.background.card : "transparent",
    borderBottom: `1px solid ${COLORS.border}`,
  };

  const Tag = isHeader ? "th" : "td";

  return <Tag style={style}>{children}</Tag>;
}
