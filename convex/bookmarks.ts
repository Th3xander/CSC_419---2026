import { query, mutation } from './_generated/server';
import { v, ConvexError } from 'convex/values';

const MAX_PER_CHAPTER = 10;
const MAX_NOTE_LENGTH = 80;

export const listByChapter = query({
  args: { bookId: v.id('books'), chapter: v.number() },
  handler: async (ctx, { bookId, chapter }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.tokenIdentifier ?? 'demo-user';
    return await ctx.db
      .query('bookmarks')
      .withIndex('by_user_book_chapter_time', (q) =>
        q.eq('userId', userId).eq('bookId', bookId).eq('chapter', chapter)
      )
      .take(MAX_PER_CHAPTER);
  },
});

export const add = mutation({
  args: {
    bookId: v.id('books'),
    chapter: v.number(),
    time: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.tokenIdentifier ?? 'demo-user';

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new ConvexError('Book not found');

    const existing = await ctx.db
      .query('bookmarks')
      .withIndex('by_user_book_chapter_time', (q) =>
        q.eq('userId', userId).eq('bookId', args.bookId).eq('chapter', args.chapter)
      )
      .take(MAX_PER_CHAPTER + 1);

    if (existing.length >= MAX_PER_CHAPTER) {
      throw new ConvexError('Max 10 bookmarks per chapter');
    }

    return await ctx.db.insert('bookmarks', {
      userId,
      bookId: args.bookId,
      chapter: args.chapter,
      time: args.time,
      note: args.note?.slice(0, MAX_NOTE_LENGTH),
    });
  },
});

export const remove = mutation({
  args: { id: v.id('bookmarks') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.tokenIdentifier ?? 'demo-user';

    const bookmark = await ctx.db.get(id);
    if (!bookmark || bookmark.userId !== userId) {
      throw new ConvexError('Not found');
    }
    await ctx.db.delete(id);
  },
});
