'use client'

import { useState, type DragEvent } from 'react'
import { classifyDocumentStub } from '@/lib/market-movement/claude-signal-stub'
import type { BrazilSignal } from '@/lib/market-movement/types'
import styles from './document-dropzone.module.css'

export interface DocumentDropzoneProps {
  focusedAccountId: string | null
  onSignalCreated: (signal: BrazilSignal) => void
}

export function DocumentDropzone({ focusedAccountId, onSignalCreated }: DocumentDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleFiles(files: FileList) {
    const file = files[0]
    if (!file) return
    setIsProcessing(true)
    try {
      const text = await file.text().catch(() => file.name)
      // TODO: replace with AWS Bedrock call via FastAPI backend
      const signal = await classifyDocumentStub({ text, relatedAccountId: focusedAccountId ?? undefined })
      onSignalCreated(signal)
    } finally {
      setIsProcessing(false)
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      className={`${styles.zone} ${isDragOver ? styles.zoneActive : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        id="mm-doc-upload"
        type="file"
        className={styles.hiddenInput}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {isProcessing ? (
        <span className={styles.label}>Classifying document…</span>
      ) : (
        <label htmlFor="mm-doc-upload" className={styles.label}>
          Drag a document here or <span className={styles.link}>browse</span>
        </label>
      )}
    </div>
  )
}
