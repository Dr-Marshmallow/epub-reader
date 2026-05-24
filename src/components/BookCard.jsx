export default function BookCard({ book, onOpen }) {
  return (
    <div
      className="book-card"
      onClick={() => onOpen(book)}
      title={book.title || book.name}
    >
      <div className="book-cover">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title || book.name} />
        ) : (
          <div className="book-cover-placeholder">
            <span>📖</span>
          </div>
        )}
      </div>
      <div className="book-info">
        <p className="book-title">{book.title || book.name.replace(/\.epub$/i, '')}</p>
      </div>

      <style>{`
        .book-card {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          transition: transform 0.15s;
        }
        .book-card:hover {
          transform: translateY(-3px);
        }
        .book-cover {
          width: 100%;
          aspect-ratio: 2/3;
          background: #2a2a2a;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: 3px 4px 12px rgba(0,0,0,0.5);
        }
        .book-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .book-cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          opacity: 0.3;
        }
        .book-info {
          padding: 0 0.1rem;
        }
        .book-title {
          font-size: 0.82rem;
          color: var(--text);
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}
