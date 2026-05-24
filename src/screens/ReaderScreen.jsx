import { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'
import '../styles/reader.css'

export default function ReaderScreen({ book, onBack }) {
  const viewerRef = useRef(null)
  const renditionRef = useRef(null)
  const bookRef = useRef(null)

  const [toc, setToc] = useState([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!viewerRef.current) return

    let epubBook
    try {
      epubBook = ePub(book.arrayBuffer)
      bookRef.current = epubBook
    } catch (err) {
      setError(`Impossibile aprire il file: ${err.message}`)
      setLoading(false)
      return
    }

    const rendition = epubBook.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated',
    })
    renditionRef.current = rendition

    // Inject styles after each page renders to avoid replaceCss race condition
    rendition.hooks.content.register((contents) => {
      try {
        const doc = contents.document
        const style = doc.createElement('style')
        style.textContent = `
          body { background: #f5f0e8 !important; color: #1a1210 !important;
            font-family: Georgia, "Times New Roman", serif !important;
            font-size: 1.05em !important; line-height: 1.7 !important; }
          p { margin-bottom: 0.8em !important; text-indent: 1.5em !important; }
        `
        doc.head.appendChild(style)
      } catch (_) {}
    })

    rendition.on('relocated', (location) => {
      const pct = Math.round((location.start.percentage || 0) * 100)
      setProgress(pct)
    })

    rendition.display()
      .then(() => setLoading(false))
      .catch(err => {
        setError(`Errore durante la lettura: ${err.message}`)
        setLoading(false)
      })

    Promise.resolve(epubBook.loaded?.navigation)
      .then(nav => { if (nav?.toc) setToc(nav.toc) })
      .catch(() => {})

    return () => {
      rendition.destroy()
      epubBook.destroy()
    }
  }, [book])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') renditionRef.current?.next()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') renditionRef.current?.prev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function onTocChange(e) {
    if (e.target.value) renditionRef.current?.display(e.target.value)
  }

  return (
    <div className="reader">
      <div className="reader-topbar">
        <button className="btn-back" onClick={onBack}>← Libreria</button>
        <span className="reader-title">{book.title || book.name}</span>
        {toc.length > 0 && (
          <select className="toc-select" defaultValue="" onChange={onTocChange}>
            <option value="" disabled>Capitoli</option>
            {toc.map((item, i) => (
              <option key={i} value={item.href}>{item.label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="reader-body">
        {error ? (
          <div className="reader-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              Il file potrebbe essere corrotto o in un formato non supportato.
            </p>
          </div>
        ) : (
          <>
            {loading && <div className="reader-loading">Caricamento...</div>}
            <div
              className="click-zone prev"
              onClick={() => renditionRef.current?.prev()}
            />
            <div ref={viewerRef} className="epub-viewer" style={{ visibility: loading ? 'hidden' : 'visible' }} />
            <div
              className="click-zone next"
              onClick={() => renditionRef.current?.next()}
            />
          </>
        )}
      </div>

      {!error && (
        <div className="reader-bottombar">
          <div className="page-controls">
            <button className="btn-nav" onClick={() => renditionRef.current?.prev()} title="Pagina precedente">‹</button>
            <span className="progress-text">{progress}%</span>
            <button className="btn-nav" onClick={() => renditionRef.current?.next()} title="Pagina successiva">›</button>
          </div>
        </div>
      )}
    </div>
  )
}
