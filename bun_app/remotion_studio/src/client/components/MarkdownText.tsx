import { useTheme } from "../theme";

// Lightweight inline markdown: **bold**, *italic*, `code`, - lists, numbered lists
export function MarkdownText({ content }: { content: string }) {
  const theme = useTheme();
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code block ```...```
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={key++} style={{
          margin: "8px 0",
          padding: "10px 12px",
          background: theme.colors.code.bg,
          color: theme.colors.code.text,
          borderRadius: theme.radii.lg,
          fontSize: 13,
          overflow: "auto",
          whiteSpace: "pre-wrap",
        }}>
          {lang && <div style={{ color: theme.colors.code.lang, marginBottom: 4, fontSize: 11 }}>{lang}</div>}
          {codeLines.join("\n")}
        </pre>
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={key++} style={{ margin: "4px 0", paddingLeft: 20 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 14, lineHeight: 1.5 }}>{renderInline(item, theme)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} style={{ margin: "4px 0", paddingLeft: 20 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 14, lineHeight: 1.5 }}>{renderInline(item, theme)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={key++} style={{ border: "none", borderTop: `1px solid ${theme.colors.border.default}`, margin: "12px 0" }} />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: 8 }} />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(<p key={key++} style={{ margin: "4px 0", lineHeight: 1.5 }}>{renderInline(line, theme)}</p>);
    i++;
  }

  return <>{elements}</>;
}

function renderInline(text: string, theme: ReturnType<typeof import("../theme").useTheme>): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code key={key++} style={{
          background: theme.colors.bg.muted,
          padding: "1px 5px",
          borderRadius: theme.radii.sm,
          fontSize: 13,
          fontFamily: theme.font.mono,
        }}>
          {match[4]}
        </code>
      );
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return parts;
}
