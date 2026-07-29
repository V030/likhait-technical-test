/**
 * Reusable Modal component
 */

import React, { useEffect } from "react";
import { COLORS } from "../constants/colors";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "500px",
  maxHeight = "90vh",
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: COLORS.background.main,
    borderRadius: "0.5rem",
    padding: "1.5rem",
    maxWidth,
    width: "90%",
    maxHeight,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: COLORS.text.primary,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: COLORS.text.secondary,
    padding: "0.25rem",
    lineHeight: 1,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div style={headerStyle}>
            <h2 style={titleStyle}>{title}</h2>
            <button style={closeButtonStyle} onClick={onClose}>
              ×
            </button>
          </div>
        )}
        <div style={{ borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }} />
        <div className="modal-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {children}
        </div>
        {footer && (
          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
