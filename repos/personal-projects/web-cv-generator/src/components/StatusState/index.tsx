import { Link } from 'react-router-dom'
import styles from './StatusState.module.css'

type StatusStateProps = {
  title: string
  body: string
  tone: 'info' | 'error'
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

type StatusActionProps = {
  action: NonNullable<StatusStateProps['action']>
}

function StatusAction({ action }: StatusActionProps) {
  if (action.href !== undefined) {
    return (
      <Link className={styles.action} to={action.href}>
        {action.label}
      </Link>
    )
  }

  if (action.onClick !== undefined) {
    return (
      <button type='button' className={styles.action} onClick={action.onClick}>
        {action.label}
      </button>
    )
  }

  return null
}

export function StatusState({ title, body, tone, action }: StatusStateProps) {
  const role = tone === 'error' ? 'alert' : 'status'

  return (
    <div className={styles.panel} data-tone={tone} role={role}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.body}>{body}</p>
      {action !== undefined ? <StatusAction action={action} /> : null}
    </div>
  )
}
