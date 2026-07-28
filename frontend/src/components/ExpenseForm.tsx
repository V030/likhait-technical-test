/**
 * Form component for adding/editing expenses
 */

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExpenseFormData, Category } from "../types";
import { TextField, Button } from "../vibes";
import { COLORS } from "../constants/colors";
import { createCategory, fetchCategories } from "../services/api";
import { useExpenseForm } from "../hooks/useExpenseForm";
import { getCategoryIconComponent } from "../constants/categoryIcons";

interface ExpenseFormProps {
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ExpenseForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Add Expense",
}: ExpenseFormProps) {
  const { formData, errors, isSubmitting, handleChange, handleSubmit } =
    useExpenseForm({
      initialData,
      onSubmit,
    });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const categoryButtonRef = useRef<HTMLButtonElement | null>(null);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories: ", err);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node) &&
        !categoryMenuRef.current?.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
        setIsCreatingCategory(false);
        setCategoryError(null);
        setNewCategoryName("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCategory = categories.find(
    (category) => category.name === formData.category,
  );
  const selectedCategoryLabel = selectedCategory?.name || "Select category";
  const SelectedCategoryIcon = getCategoryIconComponent(
    selectedCategory?.icon,
    selectedCategory?.name,
  );

  const openCategoryMenu = () => {
    const rect = categoryButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setDropdownRect({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsCategoryOpen((open) => !open);
    setCategoryError(null);
  };

  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    try {
      setIsSavingCategory(true);
      setCategoryError(null);
      const createdCategory = await createCategory(trimmedName, "Package");
      setCategories((currentCategories) => [...currentCategories, createdCategory]);
      handleChange("category", createdCategory.name);
      setNewCategoryName("");
      setIsCreatingCategory(false);
      setIsCategoryOpen(false);
    } catch {
      setCategoryError("Failed to create category.");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const categoryDropdownStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  };

  const categoryButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    fontSize: "1rem",
    border: `1px solid ${errors.category ? COLORS.danger : COLORS.border}`,
    borderRadius: "0.375rem",
    outline: "none",
    backgroundColor: COLORS.background.main,
    color: formData.category ? COLORS.text.primary : COLORS.text.light,
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
  };

  const categoryIconStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    color: COLORS.primary.p05,
    flexShrink: 0,
  };

  const categoryMenuStyle: React.CSSProperties = {
    position: "fixed",
    top: dropdownRect ? dropdownRect.top : 0,
    left: dropdownRect ? dropdownRect.left : 0,
    width: dropdownRect ? dropdownRect.width : "18rem",
    zIndex: 1205,
    backgroundColor: COLORS.background.main,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "0.5rem",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.16)",
    overflow: "hidden",
  };

  const categoryListStyle: React.CSSProperties = {
    maxHeight: "14rem",
    overflowY: "auto",
  };

  const categoryScrollClass = "expense-form-category-scroll";

  const categoryItemStyle: React.CSSProperties = {
    width: "100%",
    border: "none",
    background: "transparent",
    textAlign: "left",
    padding: "0.7rem 0.8rem",
    cursor: "pointer",
    color: COLORS.text.primary,
  };

  const categoryItemHoverStyle: React.CSSProperties = {
    backgroundColor: COLORS.background.hover,
  };

  const newCategoryRowStyle: React.CSSProperties = {
    borderTop: `1px solid ${COLORS.border}`,
    padding: "0.6rem 0.8rem",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "0.6rem",
    minHeight: "3rem",
  };

  const newCategoryButtonStyle: React.CSSProperties = {
    ...categoryItemStyle,
    borderTop: `1px solid ${COLORS.border}`,
    color: COLORS.primary.p05,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.95rem 0.8rem",
  };

  const smallActionRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "flex-end",
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <TextField
        label="Amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        value={formData.amount}
        onChange={(e) => handleChange("amount", e.target.value)}
        error={errors.amount}
        fullWidth
        required
      />

      <TextField
        label="Description"
        type="text"
        placeholder="Enter description"
        value={formData.description}
        onChange={(e) => handleChange("description", e.target.value)}
        error={errors.description}
        fullWidth
        required
      />

      <div style={categoryDropdownStyle} ref={categoryDropdownRef}>
        <label style={{ fontSize: "0.875rem", fontWeight: 600, color: COLORS.text.primary }}>
          Category
        </label>
        <button
          ref={categoryButtonRef}
          type="button"
          style={categoryButtonStyle}
          onClick={openCategoryMenu}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
            <span style={categoryIconStyle}>
              <SelectedCategoryIcon size={18} weight="fill" />
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedCategoryLabel}
            </span>
          </span>
          <span style={{ color: COLORS.text.light }}>▾</span>
        </button>
        {errors.category && (
          <span style={{ fontSize: "0.75rem", color: COLORS.danger, marginTop: "-0.25rem" }}>
            {errors.category}
          </span>
        )}
        {isCategoryOpen && (
          createPortal(
            <div ref={categoryMenuRef} style={categoryMenuStyle}>
              <style>{`
                .${categoryScrollClass}::-webkit-scrollbar { width: 4px; }
                .${categoryScrollClass}::-webkit-scrollbar-track { background: transparent; }
                .${categoryScrollClass}::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }
                .${categoryScrollClass} { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.12) transparent; }
              `}</style>
              <div className={categoryScrollClass} style={categoryListStyle}>
                {categories.length > 0 ? (
                  categories.map((category) => {
                    const isSelected = category.name === formData.category;
                    const CategoryIcon = getCategoryIconComponent(category.icon, category.name);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        style={{
                          ...categoryItemStyle,
                          ...(isSelected ? categoryItemHoverStyle : {}),
                          fontWeight: isSelected ? 600 : 400,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                        }}
                        onClick={() => {
                          handleChange("category", category.name);
                          setIsCategoryOpen(false);
                          setIsCreatingCategory(false);
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = COLORS.background.hover;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                      >
                        <span style={categoryIconStyle}>
                          <CategoryIcon size={18} weight="fill" />
                        </span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {category.name}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div style={{ padding: "0.8rem", color: COLORS.text.light, fontSize: "0.875rem" }}>
                    No categories yet.
                  </div>
                )}
              </div>

              {isCreatingCategory ? (
                <div style={newCategoryRowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TextField
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      autoFocus
                      fullWidth
                      variant="underline"
                    />
                  </div>
                  {categoryError && (
                    <span style={{ fontSize: "0.75rem", color: COLORS.danger }}>
                      {categoryError}
                    </span>
                  )}
                  <div style={smallActionRowStyle}>
                    <Button
                      type="button"
                      variant="primary"
                      size="small"
                      loading={isSavingCategory}
                      loadingText="Saving..."
                      onClick={handleCreateCategory}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setNewCategoryName("");
                        setCategoryError(null);
                      }}
                      disabled={isSavingCategory}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  style={newCategoryButtonStyle}
                  onClick={() => setIsCreatingCategory(true)}
                >
                  + Add category
                </button>
              )}
            </div>,
            document.body,
          )
        )}
      </div>

      <TextField
        label="Date"
        type="date"
        value={formData.date}
        onChange={(e) => handleChange("date", e.target.value)}
        error={errors.date}
        fullWidth
        required
      />

      <div style={buttonGroupStyle}>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
