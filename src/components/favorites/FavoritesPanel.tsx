import React, { useState } from 'react';
import {
  Film,
  PlaySquare,
  Sparkles,
  Tv,
  Music,
  Tv2,
  MonitorPlay,
  Gamepad2,
  Radio,
  Globe,
  Trophy,
  Cable,
  Gamepad,
  Zap,
  Plus,
  Trash2,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { FavoriteItem, RemoteCommand } from '../../types';

interface FavoritesPanelProps {
  favorites: FavoriteItem[];
  onSendCommand: (command: RemoteCommand) => void;
  onAddFavorite: (favorite: FavoriteItem) => void;
  onDeleteFavorite: (id: string) => void;
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  favorites,
  onSendCommand,
  onAddFavorite,
  onDeleteFavorite,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'app' | 'channel' | 'media' | 'macro'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New favorite form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'channel' | 'app' | 'media' | 'macro'>('app');
  const [brandColor, setBrandColor] = useState('#6366F1');
  const [value, setValue] = useState('');
  const [channelNumber, setChannelNumber] = useState('');

  const filtered = favorites.filter((item) => activeTab === 'all' || item.category === activeTab);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film':
        return <Film className="w-5 h-5" />;
      case 'PlaySquare':
        return <PlaySquare className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Tv':
        return <Tv className="w-5 h-5" />;
      case 'Music':
        return <Music className="w-5 h-5" />;
      case 'Tv2':
        return <Tv2 className="w-5 h-5" />;
      case 'MonitorPlay':
        return <MonitorPlay className="w-5 h-5" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5" />;
      case 'Radio':
        return <Radio className="w-5 h-5" />;
      case 'Globe':
        return <Globe className="w-5 h-5" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5" />;
      case 'Cable':
        return <Cable className="w-5 h-5" />;
      case 'Gamepad':
        return <Gamepad className="w-5 h-5" />;
      case 'Zap':
        return <Zap className="w-5 h-5" />;
      default:
        return <Tv className="w-5 h-5" />;
    }
  };

  const handleCreateFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    let action: RemoteCommand;
    if (category === 'app') {
      action = { type: 'LAUNCH_APP', value: value || title };
    } else if (category === 'channel') {
      action = { type: 'CH_SET', value: channelNumber || '1' };
    } else if (category === 'media') {
      action = { type: 'INPUT', value: value || 'HDMI 1' };
    } else {
      action = { type: 'MACRO_EXECUTE', value: value || 'custom' };
    }

    const newItem: FavoriteItem = {
      id: `fav-custom-${Date.now()}`,
      title,
      category,
      iconName: category === 'app' ? 'Film' : category === 'channel' ? 'Radio' : 'Cable',
      brandColor,
      action,
      channelNumber: channelNumber ? Number(channelNumber) : undefined,
      description: `Custom ${category}`,
    };

    onAddFavorite(newItem);
    setShowAddModal(false);
    setTitle('');
    setValue('');
    setChannelNumber('');
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-6 rounded-[36px] bg-[#111111] border border-white/10 shadow-2xl">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Favorites & Quick Launcher</span>
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'all', label: 'All' },
          { id: 'app', label: 'Apps' },
          { id: 'channel', label: 'Channels' },
          { id: 'media', label: 'Inputs' },
          { id: 'macro', label: 'Macros' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Favorites Grid */}
      <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
        {filtered.map((fav) => (
          <div
            key={fav.id}
            onClick={() => onSendCommand(fav.action)}
            className="group relative p-3.5 rounded-2xl bg-[#1a1a1a] border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-md active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div
                className="p-2.5 rounded-xl text-white shadow-md"
                style={{ backgroundColor: fav.brandColor || '#2563eb' }}
              >
                {renderIcon(fav.iconName)}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFavorite(fav.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
                title="Remove favorite"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white truncate">{fav.title}</h4>
              <p className="text-[10px] text-gray-400 truncate mt-0.5">{fav.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Favorite Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-[#111111] border border-white/10 rounded-3xl p-6 text-[#e0e0e0] flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">Add Custom Favorite</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFavorite} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Title Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ESPN Plus, Local TV 5"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="app">Streaming App</option>
                  <option value="channel">TV Channel</option>
                  <option value="media">Input Source</option>
                  <option value="macro">Custom Macro</option>
                </select>
              </div>

              {category === 'channel' ? (
                <div>
                  <label className="text-gray-400 block mb-1">Channel Number</label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    value={channelNumber}
                    onChange={(e) => setChannelNumber(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-gray-400 block mb-1">Target Value / Name</label>
                  <input
                    type="text"
                    placeholder="e.g. App Name or HDMI 3"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="text-gray-400 block mb-1">Color Theme</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="font-mono text-gray-300">{brandColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl font-semibold hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 shadow-md shadow-blue-600/30"
                >
                  Save Favorite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
