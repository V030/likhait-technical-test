/**
 * Reusable ItemTable component
 */

import React from "react";
import { COLORS } from "../constants/colors";

interface Column {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (item: any) => React.ReactNode;
}

interface ItemTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

export function ItemTable({
  columns,
  data,
  emptyMessage = "No data available",
}: ItemTableProps) {
  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: COLORS.background.main,
    borderRadius: "0.5rem",
    overflow: "hidden",
    border: `1px solid ${COLORS.border}`,
  };

  const theadStyle: React.CSSProperties = {
    backgroundColor: COLORS.background.card,
  };

  const thStyle: React.CSSProperties = {
    padding: "0.75rem",
    textAlign: "left",
    fontWeight: 600,
    color: COLORS.text.primary,
    borderBottom: `2px solid ${COLORS.border}`,
  };

  const tdStyle: React.CSSProperties = {
    padding: "0.75rem",
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.text.primary,
  };

  const emptyStyle: React.CSSProperties = {
    padding: "2rem",
    textAlign: "center",
    color: COLORS.text.secondary,
  };

  if (data.length === 0) {
    return (
      <div style={tableStyle}>
        <div style={emptyStyle}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <table style={tableStyle}>
      <thead style={theadStyle}>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              style={{
                ...thStyle,
                textAlign: column.align || "left",
                width: column.width,
              }}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td
                key={column.key}
                style={{
                  ...tdStyle,
                  textAlign: column.align || "left",
                }}
              >
                {column.render
                  ? column.render(item)
                  : (item[column.key] ?? "-")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
