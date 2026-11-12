import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { TrackInfo } from './TrackInfo';
import { ProgressBar } from './ProgressBar';
import { Controls } from './Controls';
import { BookmarkList } from './BookmarkList';

// ─── Root: picks the first book from Convex ───────────────────────────────────
export function PlayerScreen() {
  const books = useQuery(api.books.list);

  if (books === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white gap-4 p-8">
        <p className="text-xl font-bold">No books found</p>
        <p className="text-gray-400 text-sm text-center">
          Seed the database by running this in a terminal:
        </p>
        <code className="bg-gray-800 px-4 py-2 rounded text-purple-300 text-sm">
          npx convex run books:seed
        </code>
      </div>
    );
  }

  return <Player bookId={books[0]._id} />;
}

// ─── Playback speeds to cycle through ─────────────────────────────────────────
const SPEEDS = [1.0, 1.25, 1.5, 2.0];

// ─── Player: owns all playback state (lifting state up) ───────────────────────
function Player({ bookId }: { bookId: Id<'books'> }) {
  const book = useQuery(api.books.get, { id: bookId });
  const savedProgress = useQuery(api.progress.get, { bookId });
  const saveProgress = useMutation(api.progress.save);
  const addBookmarkMutation = useMutation(api.bookmarks.add);

  // ── State ──────────────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);      // seconds
  const [speedIndex, setSpeedIndex] = useState(0);
  const speed = SPEEDS[speedIndex];

  // Only initialise position once from saved progress (when it first loads)
  const initialized = useRef(false);
  useEffect(() => {
    if (savedProgress !== undefined && !initialized.current) {
      initialized.current = true;
      if (savedProgress) {
        setPosition(savedProgress.position);
        const idx = SPEEDS.indexOf(savedProgress.speed);
        if (idx !== -1) setSpeedIndex(idx);
      }
    }
  }, [savedProgress]);

  // ── Playback timer (useEffect + setInterval = section 7 from the PDF) ─────
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setPosition((p) => p + 1);
    }, 1000);
    return () => clearInterval(id);   // cleanup runs before next effect or unmount
  }, [isPlaying]);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (book === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p className="text-gray-400">Loading book…</p>
      </div>
    );
  }
  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p className="text-red-400">Book not found</p>
      </div>
    );
  }

  // ── Derived values (section 8: don't store what you can compute) ──────────
  const clampedPosition = Math.min(position, book.durationSeconds);

  // Which chapter is the playhead currently in?
  const currentChapter = book.chapters.reduce(
    (acc, ch, i) => (clampedPosition >= ch.startTime ? i : acc),
    0
  );

  // ── Event handlers ─────────────────────────────────────────────────────────
  const handleTogglePlay = () => {
    if (isPlaying) {
      // Save progress when user pauses
      saveProgress({ bookId, position: clampedPosition, speed }).catch(() => {});
    }
    setIsPlaying((p) => !p);
  };

  const handleSkip = (seconds: number) => {
    setPosition((p) =>
      Math.max(0, Math.min(p + seconds, book.durationSeconds))
    );
  };

  const handleBookmark = () => {
    addBookmarkMutation({
      bookId,
      chapter: currentChapter,
      time: clampedPosition,
    }).catch((err: Error) => alert(err.message));
  };

  const handleSpeedChange = () => {
    setSpeedIndex((i) => (i + 1) % SPEEDS.length);
  };

  const handleChapterChange = (idx: number) => {
    setPosition(book.chapters[idx].startTime);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-4">
      <main className="w-full max-w-sm bg-gray-900 rounded-2xl shadow-2xl p-6 text-white">

        {/* Header: book info + chapter picker */}
        <header className="mb-4 text-center">
          {book.isUnabridged && (
            <span className="inline-block text-xs font-bold tracking-widest text-purple-400 border border-purple-700 rounded px-2 py-0.5 mb-2">
              UNABRIDGED
            </span>
          )}
          <TrackInfo
            title={book.title}
            author={book.author}
            narrator={book.narrator}
          />
          <select
            className="mt-3 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
            value={currentChapter}
            onChange={(e) => handleChapterChange(Number(e.target.value))}
          >
            {book.chapters.map((c, i) => (
              <option key={i} value={i}>
                {c.title}
              </option>
            ))}
          </select>
        </header>

        {/* Progress bar: position / total / remaining */}
        <ProgressBar position={clampedPosition} total={book.durationSeconds} />

        {/* Controls: ⏮15  🔖  ▶/⏸  30⏭  speed */}
        <Controls
          isPlaying={isPlaying}
          speed={speed}
          onTogglePlay={handleTogglePlay}
          onSkip={handleSkip}
          onBookmark={handleBookmark}
          onSpeedChange={handleSpeedChange}
        />

        {/* Bookmark list (live-synced from Convex) */}
        <BookmarkList
          bookId={bookId}
          chapter={currentChapter}
          onSeek={setPosition}
        />
      </main>
    </div>
  );
}
