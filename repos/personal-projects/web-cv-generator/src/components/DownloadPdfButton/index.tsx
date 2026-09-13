import styles from './DownloadPdfButton.module.css'

type DownloadPdfButtonProps = {
  onClick: () => void
  disabled: boolean
}

export function DownloadPdfButton({ onClick, disabled }: DownloadPdfButtonProps) {
  return (
    <button type='button' className={styles.button} onClick={onClick} disabled={disabled}>
      Download PDF
    </button>
  )
}
