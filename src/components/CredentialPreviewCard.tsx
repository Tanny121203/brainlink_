import { Document, Page, pdfjs } from 'react-pdf'
import { Icons } from './icons'
import type { TutorCredential } from '../state/session'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

function prettySize(bytes: number) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(2)} MB`
  const kb = bytes / 1024
  return `${kb.toFixed(0)} KB`
}

export function CredentialPreviewCard({ cred }: { cred: TutorCredential }) {
  const isImage = cred.mimeType.startsWith('image/')
  const isPdf = cred.mimeType === 'application/pdf'
  return (
    <a
      className="credential-card"
      href={cred.dataUrl}
      target="_blank"
      rel="noreferrer"
      title={cred.fileName}
    >
      <div className="credential-preview-frame">
        {isImage ? (
          <img
            src={cred.dataUrl}
            alt={cred.fileName}
            className="credential-preview-image"
          />
        ) : isPdf ? (
          <Document file={cred.dataUrl} loading={<div className="muted">Loading PDF...</div>}>
            <Page
              pageNumber={1}
              width={220}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        ) : (
          <div className="credential-fallback">
            {Icons.CheckBook({ size: 22 })}
            <span>Preview unavailable</span>
          </div>
        )}
      </div>
      <div className="credential-meta">
        <div className="credential-name">{cred.fileName}</div>
        <div className="muted">
          {cred.mimeType}
          {cred.sizeBytes ? ` • ${prettySize(cred.sizeBytes)}` : ''}
        </div>
      </div>
    </a>
  )
}

