import React from "react";
import { COLORS } from "../constants/colors";

interface SidebarProps {
  onNavigate?: (page: string) => void;
  currentPage?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onNavigate,
  currentPage = "history",
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const sidebarStyle: React.CSSProperties = {
    width: isCollapsed ? "80px" : "360px",
    height: "100vh",
    background: `linear-gradient(180deg, ${COLORS.primary.p01} 0%, ${COLORS.primary.p02} 100%)`,
    display: "flex",
    flexDirection: "column",
    borderRight: `1px solid ${COLORS.secondary.s04}`,
    position: "fixed",
    left: 0,
    top: 0,
    transition: "width 0.1s ease",
  };

  const headerStyle: React.CSSProperties = {
    padding: "24px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1px solid ${COLORS.secondary.s04}`,
  };

  const logoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  };

  const logoIconStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    background: COLORS.primary.p07,
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "bold",
    color: "white",
  };

  const logoTextStyle: React.CSSProperties = {
    display: isCollapsed ? "none" : "flex",
    flexDirection: "column",
  };

  const logoTitleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 700,
    color: COLORS.primary.p09,
    lineHeight: 1.2,
  };

  const toggleButtonStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",

    transition: "background 0.2s",
    marginLeft: "16px",
  };

  const navStyle: React.CSSProperties = {
    flex: 1,
    padding: "16px 0",
  };

  const navItemStyle: React.CSSProperties = {
    width: "100%",
    padding: isCollapsed ? "16px" : "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: isCollapsed ? "center" : "flex-start",
    gap: "16px",
    background: currentPage === "history" ? COLORS.primary.p03 : "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: 500,
    color: COLORS.primary.p09,
    textAlign: "left",
    transition: "background 0.2s",
  };

  const navTextStyle: React.CSSProperties = {
    display: isCollapsed ? "none" : "inline",
  };

  return (
    <aside style={sidebarStyle}>
      <div style={headerStyle}>
        <div style={logoStyle}>
          <span style={logoIconStyle}>$</span>
          <div style={logoTextStyle}>
            <div style={logoTitleStyle}>Expense Tracker</div>
          </div>
        </div>
        <button
          style={toggleButtonStyle}
          aria-label="Toggle sidebar"
          onClick={onToggleCollapse}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#464343"
            strokeWidth="2"
            style={{
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <nav style={navStyle}>
        <button
          style={navItemStyle}
          onClick={() => onNavigate?.("history")}
          onMouseEnter={(e) => {
            if (currentPage !== "history") {
              e.currentTarget.style.background = COLORS.primary.p02;
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== "history") {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={navTextStyle}>History</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
