import React, { useState, useEffect } from 'react';
import {
  FolderDown,
  Upload,
  Play,
  Trash2,
  X,
  FileVideo,
  FileAudio,
  HardDrive,
  Cast,
  CheckCircle2,
} from 'lucide-react';
import { OfflineMediaItem } from '../../types';
import {
  saveOfflineMedia,
  getAllOfflineMedia,
  deleteOfflineMedia,
} from '../../utils/indexedDb';

interface OfflineMediaVaultProps {
  isOpen: boolean;
  onClose: () => void;
  onCastMediaToTV: (item: OfflineMediaItem) => void;
}

export const OfflineMediaVault: React.FC<OfflineMediaVaultProps> = ({
  isOpen,
  onClose,
  onCastMediaToTV,
}) => {
  const [items, setItems] = useState<OfflineMediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<OfflineMediaItem | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  const loadMedia = async () => {
    const loaded = await getAllOfflineMedia();
    setItems(loaded);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const blobUrl = URL.createObjectURL(file);

      const newItem: OfflineMediaItem = {
        id: `media-${Date.now()}-${i}`,
        title: file.name,
        mimeType: file.type || 'video/mp4',
        size: file.size,
        url: blobUrl,
        addedAt: new Date().toISOString(),
      };

      await saveOfflineMedia(newItem);
    }
    await loadMedia();
    setIsUploading(false);
  };

  const handleDelete = async (id: string) => {
    await deleteOfflineMedia(id);
    if (selectedMedia?.id === id) setSelectedMedia(null);
    await loadMedia();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Offline Media Vault & Cast</h2>
              <p className="text-xs text-slate-400">IndexedDB local storage & TV casting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Drop Zone */}
        <label className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/60 transition-colors text-center">
          <Upload className="w-6 h-6 text-teal-400 animate-bounce" />
          <span className="text-xs font-bold text-slate-200">
            Import Offline Video/Audio Clips
          </span>
          <span className="text-[10px] text-slate-400">
            Saved securely to browser IndexedDB for offline access
          </span>
          <input
            type="file"
            accept="video/*,audio/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {/* Active Player Preview */}
        {selectedMedia && selectedMedia.url && (
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-teal-300">
              <span className="truncate max-w-[200px]">{selectedMedia.title}</span>
              <button
                onClick={() => onCastMediaToTV(selectedMedia)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 text-[11px]"
              >
                <Cast className="w-3.5 h-3.5" /> Cast to TV
              </button>
            </div>

            {selectedMedia.mimeType.startsWith('video') ? (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="w-full aspect-video rounded-xl bg-black"
              />
            ) : (
              <audio src={selectedMedia.url} controls autoPlay className="w-full mt-2" />
            )}
          </div>
        )}

        {/* Media List */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-teal-400" /> Stored Media ({items.length})
          </h4>

          {items.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No offline media imported yet. Click above to import clips or music.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-800 text-teal-400 shrink-0">
                    {item.mimeType.startsWith('video') ? (
                      <FileVideo className="w-4 h-4" />
                    ) : (
                      <FileAudio className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-200 truncate">{item.title}</h5>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {formatFileSize(item.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelectedMedia(item)}
                    className="p-2 rounded-lg bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 transition-colors"
                    title="Play local preview"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onCastMediaToTV(item)}
                    className="p-2 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors"
                    title="Cast to Smart TV"
                  >
                    <Cast className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
