import { Link } from 'react-router-dom'

type PageStateProps = {
    eyebrow?: string
    title: string
    message?: string
    actionLabel?: string
    actionTo?: string
    isLoading?: boolean
}

export function PageState({
    eyebrow,
    title,
    message,
    actionLabel,
    actionTo = '/',
    isLoading = false,
}: PageStateProps) {
    return (
        <main className="app">
            <section className="page-state" aria-live="polite">
                <div className="page-state-content">
                    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                    {isLoading && <span className="page-state-spinner" role="status" aria-label="Loading" />}
                    <h1>{title}</h1>
                    {message && <p className="hero-copy">{message}</p>}

                    {actionLabel && (
                        <Link className="primary-button" to={actionTo}>
                            {actionLabel}
                            <span aria-hidden="true">→</span>
                        </Link>
                    )}
                </div>
            </section>
        </main>
    )
}
