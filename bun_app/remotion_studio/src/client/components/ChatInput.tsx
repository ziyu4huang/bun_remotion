import { Button } from "./Button";
import type { Theme } from "../theme";
import type { useI18n } from "../i18n";

export interface ChatInputState {
  input: string;
  selected: string;
  streaming: boolean;
  attachedFiles: Array<{ path: string; name: string; content: string }>;
}

export interface ChatInputActions {
  setInput: (v: string) => void;
  handleSend: () => void;
  handleAbort: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  openFilePicker: () => void;
  removeAttachment: (path: string) => void;
}

export function ChatInput({ state, actions, theme, t }: {
  state: ChatInputState;
  actions: ChatInputActions;
  theme: Theme;
  t: ReturnType<typeof useI18n>["t"];
}) {
  return (
    <div style={{ borderTop: `1px solid ${theme.colors.border.default}`, paddingTop: theme.spacing.sm }}>
      {/* Attachment chips */}
      {state.attachedFiles.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: theme.spacing.sm }}>
          {state.attachedFiles.map((f) => (
            <span key={f.path} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: theme.radii.md,
              background: theme.colors.primaryLight,
              fontSize: 12,
              color: theme.colors.primaryDark,
            }}>
              <span style={{ fontSize: 11 }}>📎</span>
              {f.name.length > 30 ? f.name.slice(0, 30) + "..." : f.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.removeAttachment(f.path)}
                style={{ fontSize: 14, padding: "0 2px", lineHeight: 1 }}
                title="Remove attachment"
              >
                ×
              </Button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: theme.spacing.sm }}>
        {/* Attach button */}
        {!state.streaming && state.selected && (
          <Button
            variant="outline"
            size="sm"
            onClick={actions.openFilePicker}
            style={{ fontSize: 18, lineHeight: 1 }}
            title="Attach file from project"
          >
            📎
          </Button>
        )}

        <textarea
          value={state.input}
          onChange={(e) => actions.setInput(e.target.value)}
          onKeyDown={actions.handleKeyDown}
          placeholder={state.selected ? t.agentChat.placeholder(state.selected) : t.agentChat.noAgentPlaceholder}
          disabled={!state.selected || state.streaming}
          rows={2}
          style={{
            flex: 1,
            padding: `10px ${theme.spacing.md}px`,
            fontSize: theme.font.sizes.md,
            borderRadius: theme.radii.xl,
            border: `1px solid ${theme.colors.border.medium}`,
            resize: "none",
            fontFamily: "inherit",
          }}
        />
        {state.streaming ? (
          <Button variant="danger" onClick={actions.handleAbort} style={{ alignSelf: "flex-end" }}>{t.agentChat.stop}</Button>
        ) : (
          <Button variant="primary" onClick={actions.handleSend} disabled={!state.selected || !state.input.trim()} style={{ alignSelf: "flex-end" }}>
            {t.agentChat.send}
          </Button>
        )}
      </div>
    </div>
  );
}

export interface FilePickerState {
  showFilePicker: boolean;
  fileSeriesId: string;
  fileSeriesList: Array<{ id: string }>;
  fileList: Array<{ path: string; name: string; episode?: string; size: number }>;
  filePickerLoading: boolean;
  attachedFiles: Array<{ path: string; name: string; content: string }>;
}

export interface FilePickerActions {
  closeFilePicker: () => void;
  selectFileSeries: (id: string) => void;
  attachFile: (path: string, name: string) => void;
}

export function FilePickerModal({ state, actions, theme }: {
  state: FilePickerState;
  actions: FilePickerActions;
  theme: Theme;
}) {
  if (!state.showFilePicker) return null;

  return (
    <div
      onClick={actions.closeFilePicker}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.colors.bg.page,
          borderRadius: theme.radii.xl,
          padding: theme.spacing.xl,
          width: "min(520px, 90vw)",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: theme.shadows.lg,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
          <h3 style={{ margin: 0, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>
            Attach Files
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={actions.closeFilePicker}
            style={{ fontSize: 20 }}
          >
            ×
          </Button>
        </div>

        {/* Series selector */}
        <div style={{ marginBottom: theme.spacing.sm }}>
          <select
            value={state.fileSeriesId}
            onChange={(e) => actions.selectFileSeries(e.target.value)}
            style={{
              width: "100%",
              padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
              fontSize: theme.font.sizes.base,
              borderRadius: theme.radii.lg,
              border: `1px solid ${theme.colors.border.medium}`,
            }}
          >
            <option value="">-- Select a series --</option>
            {state.fileSeriesList.map((s) => (
              <option key={s.id} value={s.id}>{s.id}</option>
            ))}
          </select>
        </div>

        {/* File list */}
        <div style={{ overflowY: "auto", flex: 1, minHeight: 200 }}>
          {state.filePickerLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: theme.colors.text.muted }}>Loading...</div>
          ) : !state.fileSeriesId ? (
            <div style={{ textAlign: "center", padding: 40, color: theme.colors.text.muted }}>
              Select a series above to browse files
            </div>
          ) : state.fileList.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: theme.colors.text.muted }}>
              No files found
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {state.fileList.map((f) => {
                  const isAttached = state.attachedFiles.some((a) => a.path === f.path);
                  return (
                    <tr key={f.path} style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
                      <td style={{ padding: "4px 0" }}>
                        <span style={{ fontSize: 11, color: theme.colors.text.muted }}>
                          {f.episode ? `${f.episode}/` : ""}
                        </span>
                        <span style={{ color: theme.colors.text.primary }}>
                          {f.name.replace(f.episode ? `${f.episode}/` : "", "")}
                        </span>
                      </td>
                      <td style={{ padding: "4px 0", textAlign: "right", fontSize: 11, color: theme.colors.text.muted, whiteSpace: "nowrap" }}>
                        {(f.size / 1024).toFixed(1)}KB
                      </td>
                      <td style={{ padding: "4px 0", textAlign: "right", width: 80 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => actions.attachFile(f.path, f.name)}
                          disabled={isAttached}
                          style={{ fontSize: 12 }}
                        >
                          {isAttached ? "Added" : "Attach"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
