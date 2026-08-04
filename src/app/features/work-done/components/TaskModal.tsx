import React, { useState } from 'react';
import { formatTime, formatDuration } from '../lib/gridUtils';
import { X } from 'lucide-react';

interface TaskModalProps {
  initialMinute: number;
  onClose: () => void;
  onCreate: (title: string, duration: number, color: string) => void;
}

const COLORS = [
  { name: 'blue', label: 'Blue' },
  { name: 'green', label: 'Green' },
  { name: 'purple', label: 'Purple' },
  { name: 'pink', label: 'Pink' },
  { name: 'red', label: 'Red' },
  { name: 'orange', label: 'Orange' }
];

const COLOR_BG: { [key: string]: string } = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
};

export const TaskModal: React.FC<TaskModalProps> = ({
  initialMinute,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [color, setColor] = useState('blue');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title, duration, color);
      setTitle('');
      setDuration(60);
      setColor('blue');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">New Task</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Team Meeting"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">
              {formatTime(initialMinute)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration: {formatDuration(duration)}
            </label>
            <input
              type="range"
              min="15"
              max="480"
              step="15"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>15m</span>
              <span>480m</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`w-10 h-10 rounded-lg transition-all ${COLOR_BG[c.name]} ${color === c.name ? 'ring-2 ring-offset-2 ring-gray-400' : 'hover:opacity-90'}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
