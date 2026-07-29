import React, { useState, useEffect, useRef, useCallback } from "react";
import { Category } from "../types";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/api";
import { Modal, Button, TextField } from "../vibes";
import { COLORS } from "../constants/colors";
import {
  getCategoryIconComponent,
  ICON_OPTIONS,
} from "../constants/categoryIcons";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onCategoriesUpdated?: () => void;
  onClose: () => void;
}

export function ManageCategoriesModal({
  isOpen,
  onCategoriesUpdated,
  onClose,
}: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>("Package");
  const [pickerFor, setPickerFor] = useState<"new" | number | null>(null);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const iconBtnRefs = useRef<Map<number | string, HTMLButtonElement>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"create" | "update" | "delete" | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCategories();
      setCategories(data);
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      resetState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!pickerFor) return;
    const close = () => {
      setPickerFor(null);
      setPickerPos(null);
    };
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-icon-picker]")) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("scroll", close, true);
    };
  }, [pickerFor]);

  const resetState = () => {
    setEditingId(null);
    setEditName("");
    setEditIcon("");
    setDeletingId(null);
    setIsCreating(false);
    setNewCategoryName("");
    setNewCategoryIcon("Package");
    setPickerFor(null);
    setPickerPos(null);
    setError(null);
    setPendingAction(null);
  };

  const startEditing = (category: Category) => {
    setIsCreating(false);
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon || "Package");
    setDeletingId(null);
    setPickerFor(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditIcon("");
    setPickerFor(null);
  };

  const startCreating = () => {
    setEditingId(null);
    setEditName("");
    setEditIcon("");
    setDeletingId(null);
    setIsCreating(true);
    setPickerFor(null);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewCategoryName("");
    setNewCategoryIcon("Package");
    setPickerFor(null);
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    try {
      setError(null);
      setPendingAction("update");
      const updatedCategory = await updateCategory(id, editName.trim(), editIcon);
      setCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category,
        ),
      );
      cancelEditing();
      onCategoriesUpdated?.();
    } catch {
      setError("Failed to rename category.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError(null);
      setPendingAction("delete");
      await deleteCategory(id);
      setDeletingId(null);
      await loadCategories();
    } catch {
      setError("Failed to delete category.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setError(null);
      setPendingAction("create");
      const createdCategory = await createCategory(
        newCategoryName.trim(),
        newCategoryIcon,
      );
      setCategories((currentCategories) => [...currentCategories, createdCategory]);
      setNewCategoryName("");
      setNewCategoryIcon("Package");
      setIsCreating(false);
      setPickerFor(null);
    } catch {
      setError("Failed to create category. It may already exist.");
    } finally {
      setPendingAction(null);
    }
  };

  const sorted = [
    ...categories.filter((c) => c.is_default),
    ...categories.filter((c) => !c.is_default),
  ];

  const togglePicker = useCallback(
    (key: "new" | number) => {
      if (pickerFor === key) {
        setPickerFor(null);
        setPickerPos(null);
        return;
      }
      const btn = iconBtnRefs.current.get(key);
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setPickerPos({ top: rect.bottom + 4, left: rect.left });
      }
      setPickerFor(key);
    },
    [pickerFor],
  );

  // ---- styles ---------------------------------------------------------

  const listStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    padding: "0.875rem 0.25rem",
    borderBottom: `0.5px solid ${COLORS.border}`,
  };

  const deletingRowStyle: React.CSSProperties = {
    ...rowStyle,
    backgroundColor: COLORS.background.hover,
  };

  const iconContainerStyle: React.CSSProperties = {
    flexShrink: 0,
    width: "2.25rem",
    height: "2.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: COLORS.primary.p05,
    background: "transparent",
    border: "none",
    padding: 0,
    transition: "opacity 0.15s",
  };

  const nameStyle: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0,
    fontSize: "0.9375rem",
    color: COLORS.text.primary,
  };

  const deletePromptStyle: React.CSSProperties = {
    ...nameStyle,
    color: COLORS.text.secondary,
    fontWeight: 500,
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: "0.6875rem",
    padding: "0.125rem 0.5rem",
    borderRadius: "0.25rem",
    color: COLORS.text.secondary,
    border: `0.5px solid ${COLORS.border}`,
    fontWeight: 500,
    flexShrink: 0,
    letterSpacing: "0.01em",
  };

  const iconBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.375rem",
    borderRadius: "0.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: COLORS.text.secondary,
    flexShrink: 0,
    transition: "all 0.15s",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "0.8125rem",
    color: COLORS.danger,
    padding: "0.5rem 0.75rem",
    backgroundColor: COLORS.red.re02,
    borderRadius: "0.375rem",
    marginBottom: "0.75rem",
  };

  const loadingStyle: React.CSSProperties = {
    padding: "1rem",
    textAlign: "center",
    color: COLORS.text.secondary,
  };

  const addRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.7rem 0.8rem",
    marginTop: "0.5rem",
    fontSize: "0.875rem",
    color: COLORS.primary.p05,
    background: COLORS.background.main,
    border: "none",
    cursor: "pointer",
    borderRadius: "0.375rem",
    fontWeight: 600,
  };

  const pickerGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "0.25rem",
    padding: "0.75rem",
    position: "fixed",
    zIndex: 1100,
    backgroundColor: COLORS.background.main,
    borderRadius: "0.625rem",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)",
    minWidth: "14rem",
  };

  const pickerLabelStyle: React.CSSProperties = {
    gridColumn: "1 / -1",
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: COLORS.text.light,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    paddingBottom: "0.25rem",
  };

  const pickerItemStyle: React.CSSProperties = {
    width: "2.125rem",
    height: "2.125rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0.5rem",
    cursor: "pointer",
    border: "none",
    background: "none",
    color: COLORS.text.secondary,
    transition: "all 0.12s",
  };

  const editIconBtnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.opacity = "0.7";
  };
  const editIconBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.opacity = "1";
  };
  const deleteIconBtnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.opacity = "0.7";
  };

  // ---- icon picker ----------------------------------------------------

  const renderIconPicker = (
    selectedIcon: string,
    onSelect: (icon: string) => void,
  ) => (
    <>
      <span style={pickerLabelStyle}>Select an icon</span>
      {ICON_OPTIONS.map((name) => {
        const Icon = getCategoryIconComponent(name);
        const isSelected = name === selectedIcon;
        return (
          <button
            key={name}
            style={{
              ...pickerItemStyle,
              backgroundColor: isSelected
                ? COLORS.primary.p01
                : "transparent",
              color: isSelected ? COLORS.primary.p05 : COLORS.text.secondary,
            }}
            title={name}
            onClick={() => {
              onSelect(name);
              setPickerFor(null);
              setPickerPos(null);
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = COLORS.primary.p01;
                e.currentTarget.style.color = COLORS.primary.p05;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = COLORS.text.secondary;
              }
            }}
          >
            <Icon size={18} weight="fill" />
          </button>
        );
      })}
    </>
  );

  // ---- row rendering ----------------------------------------------------

  const renderCategoryRow = (category: Category) => {
    const CategoryIcon = getCategoryIconComponent(category.icon, category.name);

    if (deletingId === category.id) {
      return (
        <div key={category.id} style={deletingRowStyle}>
          <div
            style={{
              ...iconContainerStyle,
              cursor: "default",
              color: category.icon ? COLORS.primary.p05 : COLORS.text.secondary,
              pointerEvents: "none",
            }}
          >
            <CategoryIcon size={20} weight="fill" />
          </div>
          <span style={deletePromptStyle}>Delete "{category.name}"?</span>
          <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
            <Button
              variant="danger"
              size="small"
              loading={pendingAction === "delete"}
              loadingText="Deleting..."
              onClick={() => handleDelete(category.id)}
            >
              Yes
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setDeletingId(null)}
              disabled={pendingAction === "delete"}
            >
              No
            </Button>
          </div>
        </div>
      );
    }

    const isEditing = editingId === category.id;
    const IconComponent = getCategoryIconComponent(
      isEditing ? editIcon : category.icon,
      category.name,
    );

    return (
      <div key={category.id}>
        <div style={rowStyle}>
          <button
            ref={(el) => { if (el) iconBtnRefs.current.set(category.id, el); }}
            style={iconContainerStyle}
            title="Change icon"
            onClick={() => {
              if (isEditing) {
                togglePicker(category.id);
              }
            }}
            onMouseEnter={editIconBtnHover}
            onMouseLeave={editIconBtnLeave}
          >
            <IconComponent size={20} weight="fill" />
          </button>

          {isEditing ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              <TextField
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(category.id);
                  if (e.key === "Escape") cancelEditing();
                }}
                autoFocus
                fullWidth
                variant="underline"
              />
            </div>
          ) : (
            <span style={nameStyle}>{category.name}</span>
          )}

          {category.is_default && !isEditing && (
            <span style={badgeStyle}>Default</span>
          )}

          {!category.is_default && (
            <div style={{ display: "flex", gap: "0.125rem", flexShrink: 0 }}>
              {isEditing ? (
                <>
                  <Button
                    variant="primary"
                    size="small"
                    loading={pendingAction === "update"}
                    loadingText="Saving..."
                    onClick={() => handleRename(category.id)}
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={cancelEditing}
                    disabled={pendingAction === "update"}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <button
                    style={iconBtnStyle}
                    title="Rename category"
                    onClick={() => startEditing(category)}
                    onMouseEnter={editIconBtnHover}
                    onMouseLeave={editIconBtnLeave}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
                    </svg>
                  </button>

                  <button
                    style={iconBtnStyle}
                    title="Delete category"
                    onClick={() => setDeletingId(category.id)}
                    onMouseEnter={deleteIconBtnHover}
                    onMouseLeave={editIconBtnLeave}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 4h12" />
                      <path d="M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4" />
                      <path d="M12.667 4v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4" />
                      <path d="M6.667 7.333v4" />
                      <path d="M9.333 7.333v4" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {isEditing && pickerFor === category.id && pickerPos && (
          <div data-icon-picker style={{ ...pickerGridStyle, top: pickerPos.top, left: pickerPos.left }}>
            {renderIconPicker(editIcon, (icon) => setEditIcon(icon))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Categories"
      maxWidth="560px"
      maxHeight="78vh"
      footer={
        !loading ? (
          <button
            style={addRowStyle}
            onClick={startCreating}
          >
            + Add category
          </button>
        ) : undefined
      }
    >
      <style>{`
        .modal-scroll::-webkit-scrollbar { width: 4px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }
        .modal-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.12) transparent; }
      `}</style>
      {error && <div style={errorStyle}>{error}</div>}

      {loading ? (
        <div style={loadingStyle}>Loading...</div>
      ) : (
        <div style={listStyle}>
          {sorted.map((category) => renderCategoryRow(category))}

          {sorted.length === 0 && !isCreating && (
            <div
              style={{
                textAlign: "center",
                padding: "1rem",
                color: COLORS.text.light,
                fontSize: "0.875rem",
              }}
            >
              No categories yet.
            </div>
          )}

          {isCreating && (
            <div>
              <div style={rowStyle}>
                <button
                  ref={(el) => { if (el) iconBtnRefs.current.set("new", el); }}
                  style={iconContainerStyle}
                  title="Change icon"
                  onClick={() => togglePicker("new")}
                  onMouseEnter={editIconBtnHover}
                  onMouseLeave={editIconBtnLeave}
                >
                  {getCategoryIconComponent(newCategoryIcon) &&
                    React.createElement(
                      getCategoryIconComponent(newCategoryIcon),
                      { size: 20, weight: "fill" },
                    )}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") cancelCreating();
                    }}
                    placeholder="Category name"
                    autoFocus
                    fullWidth
                    variant="underline"
                  />
                </div>
                <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                  <Button
                    variant="primary"
                    size="small"
                    loading={pendingAction === "create"}
                    loadingText="Saving..."
                    onClick={handleCreate}
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={cancelCreating}
                    disabled={pendingAction === "create"}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              {pickerFor === "new" && pickerPos && (
                <div data-icon-picker style={{ ...pickerGridStyle, top: pickerPos.top, left: pickerPos.left }}>
                  {renderIconPicker(newCategoryIcon, (icon) =>
                    setNewCategoryIcon(icon),
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
