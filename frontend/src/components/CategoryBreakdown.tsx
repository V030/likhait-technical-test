import React from "react";
import { getCategoryIconComponent } from "../constants/categoryIcons";
import { COLORS } from "../constants/colors";

interface CategoryData {
  category: string;
  category_icon?: string | null;
  amount: number;
  count: number;
}

interface CategoryBreakdownProps {
  categories: CategoryData[];
  total: number;
  totalCount: number;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  total,
  totalCount,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const containerStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  };

  const totalStyle: React.CSSProperties = {
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: `1px solid ${COLORS.secondary.s04}`,
    background: COLORS.secondary.s01,
    cursor: "pointer",
  };

  const totalLabelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: COLORS.secondary.s08,
    letterSpacing: "0.05em",
  };

  const totalAmountStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: 700,
    color: COLORS.secondary.s10,
  };

  const totalCountStyle: React.CSSProperties = {
    fontSize: "14px",
    color: COLORS.secondary.s07,
    marginLeft: "auto",
  };

  const toggleButtonStyle: React.CSSProperties = {
    width: "32px",
    height: "32px",
    background: COLORS.secondary.s03,
    border: "none",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: COLORS.secondary.s08,
    transition: "all 0.2s",
    flexShrink: 0,
  };

  const listStyle: React.CSSProperties = {
    padding: "8px",
  };

  const itemStyle: React.CSSProperties = {
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: COLORS.secondary.s01,
    borderRadius: "8px",
    marginBottom: "8px",
    transition: "all 0.2s",
  };

  const itemInfoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  };

  const itemIconStyle: React.CSSProperties = {
    fontSize: "32px",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "white",
    borderRadius: "10px",
    color: COLORS.primary.p05,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  };

  const itemDetailsStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const itemNameStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    color: COLORS.secondary.s10,
  };

  const itemCountStyle: React.CSSProperties = {
    fontSize: "14px",
    color: COLORS.secondary.s07,
  };

  const itemAmountStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 700,
    color: COLORS.secondary.s10,
  };

  return (
    <div style={containerStyle}>
      <div
        style={totalStyle}
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }
        }}
      >
        <span style={totalLabelStyle}>TOTAL:</span>
        <span style={totalAmountStyle}>{formatAmount(total)}</span>
        <span style={totalCountStyle}>({totalCount} transactions)</span>
        <button
          style={toggleButtonStyle}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLORS.secondary.s04;
            e.currentTarget.style.color = COLORS.secondary.s10;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = COLORS.secondary.s03;
            e.currentTarget.style.color = COLORS.secondary.s08;
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <path d="M8 11l-5-5h10z" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div style={listStyle}>
          {categories.map((category) => (
            <div
              key={category.category}
              style={itemStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.secondary.s02;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.secondary.s01;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={itemInfoStyle}>
                <span style={itemIconStyle}>
                  {React.createElement(getCategoryIconComponent(category.category_icon, category.category), { size: 32, weight: "fill" })}
                </span>
                <div style={itemDetailsStyle}>
                  <div style={itemNameStyle}>{category.category}</div>
                  <div style={itemCountStyle}>
                    {category.count} transaction
                    {category.count !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <div style={itemAmountStyle}>{formatAmount(category.amount)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryBreakdown;
