# Kindle Check

Un reader EPUB leggero per verificare che i file `.epub` non siano corrotti prima di trasferirli su Kindle.

Apri uno o più EPUB nel browser, sfogliali come su un e-reader, e se la visualizzazione va a buon fine il file è integro. Nessun dato viene salvato: tutto resta in memoria per la durata della sessione.

---

## Funzionalità

- **Caricamento multiplo** — trascina i file nella finestra o usa il pulsante "Aggiungi EPUB"
- **Griglia libreria** — copertine estratte automaticamente dal file EPUB
- **Reader stile Kindle** — sfondo carta, font serif, paginazione
- **Navigazione** — frecce, click sulle zone laterali, dropdown capitoli (TOC)
- **Layout a due pagine** — pulsante in topbar per affiancare due pagine come su un libro fisico
- **Rilevamento corruzione** — se epub.js non riesce ad aprire il file, viene mostrato un banner di errore
- **Zero persistenza** — nessun localStorage, nessun file scritto; ricaricare la pagina azzera tutto

---

## Avvio rapido

### Con Docker (consigliato)

```bash
docker compose up --build
```

L'app sarà disponibile su [http://localhost:3002](http://localhost:3002).

Per fermarla:

```bash
docker compose down
```

---

### Senza Docker

Richiede [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm run dev
```

App disponibile su [http://localhost:5173](http://localhost:5173).

**Build di produzione:**

```bash
npm run build
npm run preview
```

---

## Struttura

```
epub-reader/
├── src/
│   ├── App.jsx                  # state machine: home ↔ reader
│   ├── screens/
│   │   ├── HomeScreen.jsx       # griglia libri + caricamento file
│   │   └── ReaderScreen.jsx     # render epub.js + controlli
│   ├── components/
│   │   ├── BookCard.jsx         # card con copertina e titolo
│   │   └── FileDropZone.jsx     # drag-drop e file picker
│   └── styles/
├── Dockerfile                   # build multi-stage: Node → nginx
├── docker-compose.yml
└── nginx.conf
```

---

## Stack

| Componente | Versione |
|---|---|
| React | 19 |
| epub.js | 0.3 |
| Vite | 8 |
| nginx | stable-alpine |

---

## Note tecniche

- I file EPUB vengono letti come `ArrayBuffer` tramite la File API del browser; non transitano mai su un server
- epub.js apre l'archivio direttamente in memoria e genera blob URL per le risorse interne
- La build Docker è multi-stage: il layer di produzione contiene solo i file statici compilati (~nginx:alpine, ~25 MB)
