import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import ePub from 'epubjs'

async function parseEpub(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result
      try {
        const book = ePub(arrayBuffer)
        let title = file.name.replace(/\.epub$/i, '')
        let coverUrl = null

        try {
          const meta = await Promise.race([
            book.loaded.metadata,
            new Promise(r => setTimeout(r, 5000)),
          ])
          if (meta?.title) title = meta.title
        } catch (_) {}

        try {
          coverUrl = await Promise.race([
            book.coverUrl(),
            new Promise(r => setTimeout(r, 5000)),
          ])
        } catch (_) {}

        // book.opened resolves after replacements() completes — race with a timeout
        // so malformed EPUBs don't stall the whole batch
        await Promise.race([book.opened.catch(() => {}), new Promise(r => setTimeout(r, 8000))])
        book.destroy()

        resolve({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          title,
          coverUrl,
          arrayBuffer,
        })
      } catch (err) {
        reject(new Error(`${file.name}: ${err.message || 'formato non valido'}`))
      }
    }
    reader.onerror = () => reject(new Error(`Impossibile leggere ${file.name}`))
    reader.readAsArrayBuffer(file)
  })
}

const FileDropZone = forwardRef(function FileDropZone({ onBooksAdded, onError, onLoadingChange }, ref) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  useImperativeHandle(ref, () => ({
    open: () => inputRef.current?.click(),
  }))

  async function handleFiles(files) {
    const epubFiles = Array.from(files).filter(f =>
      f.name.toLowerCase().endsWith('.epub')
    )
    if (!epubFiles.length) return

    onLoadingChange?.(true)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    const settled = await Promise.allSettled(epubFiles.map(parseEpub))
    onLoadingChange?.(false)
    const results = settled.filter(r => r.status === 'fulfilled').map(r => r.value)
    const errors = settled.filter(r => r.status === 'rejected').map(r => r.reason.message)
    if (results.length) onBooksAdded(results)
    if (errors.length) onError(errors.join('\n'))
  }

  function onDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function onInputChange(e) {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{ position: 'fixed', inset: 0, pointerEvents: dragging ? 'auto' : 'none', zIndex: 50 }}
    >
      {dragging && (
        <div className="drop-zone-overlay">
          <span>Rilascia i file EPUB qui</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".epub"
        multiple
        style={{ display: 'none' }}
        onChange={onInputChange}
      />
    </div>
  )
})

export default FileDropZone
