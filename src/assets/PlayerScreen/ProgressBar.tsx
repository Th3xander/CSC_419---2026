interface ProgressBarProps {
  position: number;
  total: number;
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function ProgressBar({ position, total }: ProgressBarProps) {
  const remaining = total - position;
  const percent = total > 0 ? (position / total) * 100 : 0;

  return (
    <div className="my-4">
      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-purple-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-400 mt-1">
        <span>{formatTime(position)}</span>
        <span>{formatTime(total)}</span>
        <span>-{formatTime(remaining)}</span>
      </div>
    </div>
  );
}
