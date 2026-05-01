import { useState, useCallback } from "react";
import { api } from "../api";

export interface AttachedFile {
  path: string;
  name: string;
  content: string;
}

export interface FileEntry {
  path: string;
  name: string;
  size: number;
  episode?: string;
}

export function useFilePicker() {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [fileSeriesId, setFileSeriesId] = useState<string>("");
  const [fileList, setFileList] = useState<FileEntry[]>([]);
  const [fileSeriesList, setFileSeriesList] = useState<Array<{ id: string }>>([]);
  const [filePickerLoading, setFilePickerLoading] = useState(false);

  const openFilePicker = useCallback(async () => {
    setShowFilePicker(true);
    setFilePickerLoading(true);
    try {
      const res = await api.agent.listFiles();
      if (res.ok && res.data?.series) {
        setFileSeriesList(res.data.series);
      }
    } catch { /* ignore */ }
    setFilePickerLoading(false);
  }, []);

  const selectFileSeries = useCallback(async (seriesId: string) => {
    setFileSeriesId(seriesId);
    setFilePickerLoading(true);
    try {
      const res = await api.agent.listFiles(seriesId);
      if (res.ok && res.data?.files) {
        setFileList(res.data.files);
      }
    } catch { /* ignore */ }
    setFilePickerLoading(false);
  }, []);

  const attachFile = useCallback(async (filePath: string, fileName: string) => {
    if (attachedFiles.some((f) => f.path === filePath)) return;
    try {
      const res = await api.agent.readFile(filePath);
      if (res.ok && res.data) {
        setAttachedFiles((prev) => [...prev, { path: filePath, name: fileName, content: res.data!.content }]);
      }
    } catch { /* ignore */ }
  }, [attachedFiles]);

  const removeAttachment = useCallback((filePath: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.path !== filePath));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachedFiles([]);
  }, []);

  const closeFilePicker = useCallback(() => {
    setShowFilePicker(false);
  }, []);

  return {
    attachedFiles,
    showFilePicker,
    fileSeriesId,
    fileList,
    fileSeriesList,
    filePickerLoading,
    openFilePicker,
    selectFileSeries,
    attachFile,
    removeAttachment,
    clearAttachments,
    closeFilePicker,
  };
}
