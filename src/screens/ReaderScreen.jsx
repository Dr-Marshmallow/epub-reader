import { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'
import '../styles/reader.css'

export default function ReaderScreen({ book, onBack }) {
  const viewerRef = useRef(null)
  const renditionRef = useRef(null)

  const [toc, setToc] = useState([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const el = viewerRef.current
    if (!el) return

    // epub.js requires integer pixel dimensions — '100%' becomes '100%px' internally
    // which is invalid. Measure the container before renderTo.
    const { width, height } = el.getBoundingClientRect()

    let epubBook
    try {
      epubBook = ePub(book.arrayBuffer)
    } catch (err) {
      setError(`Impossibile aprire il file: ${err.message}`)
      setLoading(false)
      return
    }

    const rendition = epubBook.renderTo(el, {
      width: Math.floor(width) || 800,
      height: Math.floor(height) || 600,
      spread: 'none',
      minSpreadWidth: 9999, // prevent epub.js from ever switching to two-page layout
      flow: 'paginated',
    })
    renditionRef.current = rendition

    // Inject styles per-page via hooks to avoid replaceCss race condition
    rendition.hooks.content.register((contents) => {
      try {
        const style = contents.document.createElement('style')
        style.textContent = `
          body { background: #f5f0e8 !important; color: #1a1210 !important;
            font-family: Georgia, "Times New Roman", serif !important;
            font-size: 1.05em !important; line-height: 1.7 !important; }
          p { margin-bottom: 0.8em !important; text-indent: 1.5em !important; }
        `
        contents.document.head.appendChild(style)
      } catch (_) {}
    })

    // percentage only works after locations are generated; update once ready
    rendition.on('relocated', (location) => {
      if (location?.start?.percentage != null) {
        setProgress(Math.round(location.start.percentage * 100))
      }
    })

    rendition.display()
      .then(() => {
        setLoading(false)
        // generate CFI locations in background; refresh percentage once done
        epubBook.locations.generate(1024).then(() => {
          const loc = rendition.currentLocation()
          if (loc?.start?.percentage != null) {
            setProgress(Math.round(loc.start.percentage * 100))
          }
        }).catch(() => {})
      })
      .catch(err => {
        setError(`Errore durante la lettura: ${err.message}`)
        setLoading(false)
      })

    Promise.resolve(epubBook.loaded?.navigation)
      .then(nav => { if (nav?.toc) setToc(nav.toc) })
      .catch(() => {})

    // keep rendition sized to the container on window resize
    function handleResize() {
      const { width, height } = el.getBoundingClientRect()
      renditionRef.current?.resize(Math.floor(width), Math.floor(height))
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
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
        {/* viewer is the sole flex item so epub.js always measures the full width */}
        <div ref={viewerRef} className="epub-viewer" />

        {/* overlays — position: absolute so they don't affect viewer's flex dimensions */}
        {loading && !error && <div className="reader-loading">Caricamento...</div>}
        {error && (
          <div className="reader-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              Il file potrebbe essere corrotto o in un formato non supportato.
            </p>
          </div>
        )}

        {!error && (
          <>
            <div className="click-zone prev" onClick={() => renditionRef.current?.prev()} />
            <div className="click-zone next" onClick={() => renditionRef.current?.next()} />
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
