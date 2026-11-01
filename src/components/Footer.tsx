import { Link } from 'react-router-dom'

export function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-main">
                <div>
                    <Link className="brand footer-brand" to="/" aria-label="Tonight home">
                        tonight<span>•</span>
                    </Link>

                    <p className="footer-copy">Made for better movie nights.</p>
                </div>

                <nav className="footer-links" aria-label="Footer navigation">
                    <a
                        href="https://github.com/ch1ckenrice/Tonight"
                        target="_blank"
                        rel="noreferrer"
                    >
                        GitHub ↗
                    </a>
                    <a
                        href="https://www.themoviedb.org/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        TMDB ↗
                    </a>
                </nav>
            </div>

            <p className="footer-meta">
                © {new Date().getFullYear()} Tonight · Movie data from TMDB
            </p>
        </footer>
    )
}
