interface ControlsProps {
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onSkip: (seconds: number) => void;
  onBookmark: () => void;
  onSpeedChange: () => void;
}

export function Controls({
  isPlaying,
  speed,
  onTogglePlay,
  onSkip,
  onBookmark,
  onSpeedChange,
}: ControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 my-4">
      <button
        className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
        onClick={() => onSkip(-15)}
      >
        ⏮ 15
      </button>
      <button
        className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
        onClick={onBookmark}
      >
        🔖
      </button>
      <button
        className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg"
        onClick={onTogglePlay}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button
        className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
        onClick={() => onSkip(30)}
      >
        30 ⏭
      </button>
      <button
        className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-mono"
        onClick={onSpeedChange}
      >
        {speed}x
      </button>
    </div>
  );
}
