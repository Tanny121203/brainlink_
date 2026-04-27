import { Document, Page, pdfjs } from 'react-pdf'
import { useState } from 'react'
import { Icons } from './icons'
import type { TutorCredential } from '../state/session'
import { fetchServerTutorCredentialData } from '../state/serverApi'
import { toast } from './Toast'

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
  const [previewDataUrl, setPreviewDataUrl] = useState(cred.dataUrl || '')
  const [previewMimeType, setPreviewMimeType] = useState(cred.mimeType || '')
  const [loading, setLoading] = useState(false)

  const isImage = previewMimeType.startsWith('image/')
  const isPdf = previewMimeType === 'application/pdf'
  const hasPreview = Boolean(previewDataUrl)

  async function loadPreview() {
    if (previewDataUrl || loading) return
    setLoading(true)
    try {
      const result = await fetchServerTutorCredentialData(cred.id)
      setPreviewDataUrl(result.dataUrl)
      setPreviewMimeType(result.mimeType || cred.mimeType)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not load credential preview.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!hasPreview) {
    return (
      <button className="credential-card" type="button" onClick={loadPreview}>
        <div className="credential-preview-frame">
          <div className="credential-fallback">
            {Icons.CheckBook({ size: 22 })}
            <span>{loading ? 'Loading preview...' : 'Load preview'}</span>
          </div>
        </div>
        <div className="credential-meta">
          <div className="credential-name">{cred.fileName}</div>
          <div className="muted">
            {cred.mimeType}
            {cred.sizeBytes ? ` • ${prettySize(cred.sizeBytes)}` : ''}
          </div>
        </div>
      </button>
    )
  }

  return (
    <a
      className="credential-card"
      href={previewDataUrl}
      target="_blank"
      rel="noreferrer"
      title={cred.fileName}
    >
      <div className="credential-preview-frame">
        {isImage ? (
          <img
            src={previewDataUrl}
            alt={cred.fileName}
            className="credential-preview-image"
          />
        ) : isPdf ? (
          <Document file={previewDataUrl} loading={<div className="muted">Loading PDF...</div>}>
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

