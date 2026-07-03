'use client'

import styles from './back-to-global-button.module.css'

export interface BackToGlobalButtonProps {
  onClick: () => void
}

export function BackToGlobalButton({ onClick }: BackToGlobalButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      Back to global
    </button>
  )
}
