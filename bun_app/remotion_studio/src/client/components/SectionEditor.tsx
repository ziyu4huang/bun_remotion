import React, { useState, useCallback } from "react";
import { useTheme } from "../theme";
import {
  parseMarkdownTable,
  serializeMarkdownTable,
  isMarkdownTable,
  replaceSectionInMarkdown,
  type TableRow,
} from "../utils/markdown-table";

interface SectionEditorProps {
  sections: { key: string; title: string; body: string }[];
  fullMarkdown: string;
  onSectionChange: (newFullMarkdown: string) => void;
}

export function SectionEditor({ sections, fullMarkdown, onSectionChange }: SectionEditorProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div style={{ display: "grid", gap: theme.spacing.lg }}>
      {sections.map((section) => {
        const isTable = isMarkdownTable(section.body);
        const isOpen = expanded[section.key] !== false;

        return (
          <div
            key={section.key}
            style={{
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: theme.radii.xl,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => toggle(section.key)}
              style={{
                width: "100%",
                padding: `10px ${theme.spacing.xl}px`,
                background: theme.colors.bg.surface,
                border: "none",
                borderBottom: isOpen ? `1px solid ${theme.colors.border.default}` : "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: theme.font.sizes.md,
                fontWeight: theme.font.weights.semibold,
              }}
            >
              <span>{section.title}</span>
              <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.tertiary }}>
                {isTable ? "Table" : "Text"}
              </span>
            </button>

            {isOpen &&
              (isTable ? (
                <TableSectionEditor
                  sectionKey={section.key}
                  sectionTitle={section.title}
                  body={section.body}
                  fullMarkdown={fullMarkdown}
                  onChange={onSectionChange}
                />
              ) : (
                <TextSectionEditor
                  sectionKey={section.key}
                  sectionTitle={section.title}
                  body={section.body}
                  fullMarkdown={fullMarkdown}
                  onChange={onSectionChange}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}

function TableSectionEditor({
  sectionKey,
  sectionTitle,
  body,
  fullMarkdown,
  onChange,
}: {
  sectionKey: string;
  sectionTitle: string;
  body: string;
  fullMarkdown: string;
  onChange: (md: string) => void;
}) {
  const theme = useTheme();
  const [table, setTable] = useState(() => parseMarkdownTable(body));

  const updateTable = useCallback(
    (newTable: { headers: string[]; rows: TableRow[] }) => {
      setTable(newTable);
      const newBody = serializeMarkdownTable(newTable.headers, newTable.rows);
      const newMd = replaceSectionInMarkdown(fullMarkdown, sectionTitle, newBody);
      onChange(newMd);
    },
    [fullMarkdown, sectionTitle, onChange]
  );

  const updateCell = (rowIdx: number, header: string, value: string) => {
    const rows = table.rows.map((r, i) => (i === rowIdx ? { ...r, [header]: value } : r));
    updateTable({ headers: table.headers, rows });
  };

  const addRow = () => {
    const emptyRow: TableRow = {};
    table.headers.forEach((h) => (emptyRow[h] = ""));
    updateTable({ headers: table.headers, rows: [...table.rows, emptyRow] });
  };

  const deleteRow = (idx: number) => {
    updateTable({ headers: table.headers, rows: table.rows.filter((_, i) => i !== idx) });
  };

  if (table.headers.length === 0) {
    return (
      <div style={{ padding: theme.spacing.xl, color: theme.colors.text.muted, fontSize: theme.font.sizes.sm }}>
        No table data found. Switch to Raw mode to edit this section.
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing.xl, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.base }}>
        <thead>
          <tr>
            {table.headers.map((h) => (
              <th key={h} style={thStyle(theme)}>
                {h}
              </th>
            ))}
            <th style={{ ...thStyle(theme), width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {table.headers.map((h) => (
                <td key={h} style={tdStyle(theme)}>
                  <input
                    value={row[h] ?? ""}
                    onChange={(e) => updateCell(ri, h, e.target.value)}
                    style={{
                      width: "100%",
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.radii.md,
                      padding: `4px 8px`,
                      fontSize: theme.font.sizes.base,
                      background: "transparent",
                      color: theme.colors.text.primary,
                    }}
                  />
                </td>
              ))}
              <td style={tdStyle(theme)}>
                <button
                  onClick={() => deleteRow(ri)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: theme.colors.danger,
                    cursor: "pointer",
                    fontSize: theme.font.sizes.lg,
                    padding: "2px 6px",
                  }}
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={addRow}
        style={{
          marginTop: theme.spacing.md,
          padding: `6px ${theme.spacing.xl}px`,
          borderRadius: theme.radii.lg,
          border: `1px solid ${theme.colors.primary}`,
          background: "transparent",
          color: theme.colors.primary,
          cursor: "pointer",
          fontSize: theme.font.sizes.base,
        }}
      >
        + Add Row
      </button>
    </div>
  );
}

function TextSectionEditor({
  sectionTitle,
  body,
  fullMarkdown,
  onChange,
}: {
  sectionKey: string;
  sectionTitle: string;
  body: string;
  fullMarkdown: string;
  onChange: (md: string) => void;
}) {
  const theme = useTheme();

  const handleChange = (value: string) => {
    const newMd = replaceSectionInMarkdown(fullMarkdown, sectionTitle, value);
    onChange(newMd);
  };

  return (
    <div style={{ padding: theme.spacing.xl }}>
      <textarea
        value={body}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          width: "100%",
          minHeight: 120,
          fontFamily: theme.font.mono,
          fontSize: theme.font.sizes.base,
          padding: theme.spacing.md,
          border: `1px solid ${theme.colors.border.medium}`,
          borderRadius: theme.radii.lg,
          resize: "vertical",
          lineHeight: 1.6,
          background: "transparent",
          color: theme.colors.text.primary,
        }}
        spellCheck={false}
      />
    </div>
  );
}

function thStyle(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    textAlign: "left",
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    borderBottom: `2px solid ${theme.colors.border.default}`,
    fontWeight: theme.font.weights.semibold,
    fontSize: theme.font.sizes.base,
    whiteSpace: "nowrap",
  };
}

function tdStyle(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    padding: `6px ${theme.spacing.md}px`,
    borderBottom: `1px solid ${theme.colors.border.light}`,
    fontSize: theme.font.sizes.base,
  };
}
