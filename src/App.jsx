import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import ReaderScreen from './screens/ReaderScreen'
import './styles/global.css'

export default function App() {
  const [view, setView] = useState('home')
  const [books, setBooks] = useState([])
  const [activeBook, setActiveBook] = useState(null)

  function handleBooksAdded(newBooks) {
    setBooks(prev => {
      const existingNames = new Set(prev.map(b => b.name))
      const unique = newBooks.filter(b => !existingNames.has(b.name))
      return [...prev, ...unique]
    })
  }

  function handleOpen(book) {
    setActiveBook(book)
    setView('reader')
  }

  function handleBack() {
    setView('home')
    setActiveBook(null)
  }

  if (view === 'reader' && activeBook) {
    return <ReaderScreen book={activeBook} onBack={handleBack} />
  }

  return (
    <HomeScreen
      books={books}
      onBooksAdded={handleBooksAdded}
      onOpen={handleOpen}
    />
  )
}
