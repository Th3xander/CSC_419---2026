import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface BookmarkListProps {
  bookId: Id<'books'>;
  chapter: number;
  onSeek: (seconds: number) => void;
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function BookmarkList({ bookId, chapter, onSeek }: BookmarkListProps) {
  const bookmarks = useQuery(api.bookmarks.listByChapter, { bookId, chapter });

  const removeBookmark = useMutation(api.bookmarks.remove).withOptimisticUpdate(
    (localStore, { id }) => {
      const current = localStore.getQuery(api.bookmarks.listByChapter, {
        bookId,
        chapter,
      });
      if (current !== undefined) {
        localStore.setQuery(
          api.bookmarks.listByChapter,
          { bookId, chapter },
          current.filter((b) => b._id !== id)
        );
      }
    }
  );

  if (bookmarks === undefined) return <p className="text-gray-400 text-sm">Loading bookmarks…</p>;

  return (
    <section className="mt-4">
      <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">
        Bookmarks ({bookmarks.length} / 10)
      </h3>
      {bookmarks.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No bookmarks yet. Press 🔖 to add one.</p>
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((b) => (
            <li
              key={b._id}
              className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2"
            >
              <button
                className="text-purple-400 hover:text-purple-300 font-mono text-sm font-bold"
                onClick={() => onSeek(b.time)}
              >
                ▶ {formatTime(b.time)}
              </button>
              <span className="flex-1 text-sm text-gray-300 truncate">
                {b.note ? `"${b.note}"` : <em className="text-gray-500">(no note)</em>}
              </span>
              <button
                className="text-gray-500 hover:text-red-400 text-sm"
                onClick={() => removeBookmark({ id: b._id })}
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
