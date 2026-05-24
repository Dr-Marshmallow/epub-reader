import { useRef, useState } from 'react'
import BookCard from '../components/BookCard'
import FileDropZone from '../components/FileDropZone'
import '../styles/home.css'

export default function HomeScreen({ books, onBooksAdded, onOpen }) {
  const dropZoneRef = useRef(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleBooksAdded(newBooks) {
    setError(null)
    onBooksAdded(newBooks)
  }

  function handleError(msg) {
    setError(msg)
  }

  return (
    <div className="home">
      <FileDropZone
        ref={dropZoneRef}
        onBooksAdded={handleBooksAdded}
        onError={handleError}
        onLoadingChange={setLoading}
      />

      {loading && <div className="loading-bar" />}

      <header className="home-header">
        <h1>Kindle Check</h1>
        <button className="btn-add" onClick={() => dropZoneRef.current?.open()}>
          + Aggiungi EPUB
        </button>
      </header>

      <main className="home-content">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {books.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>Nessun file caricato</p>
            <small>Trascina i file EPUB qui oppure usa il pulsante "Aggiungi EPUB"</small>
          </div>
        ) : (
          <div className="book-grid">
            {books.map(book => (
              <BookCard key={book.id} book={book} onOpen={onOpen} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
