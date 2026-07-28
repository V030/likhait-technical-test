/**
 * Reusable Pagination component
 */

import React from "react";
import { COLORS } from "../constants/colors";
import { Button } from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "1rem 0",
  };

  const pageInfoStyle: React.CSSProperties = {
    color: COLORS.text.secondary,
    fontSize: "0.875rem",
    margin: "0 1rem",
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div style={containerStyle}>
      <Button
        variant="secondary"
        size="small"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <span style={pageInfoStyle}>
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="small"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
}
