import { getPosterUrl, type TmdbMovie } from '../services/tmdb'

type MovieCardProps = {
    movie: TmdbMovie
    showOverview?: boolean
    className?: string
}

export function MovieCard({ movie, showOverview = false,  className = ''}: MovieCardProps) {
    return (
        <article className={`movie-card ${className}`} >
            {movie.poster_path ? (
                <img
                    className="movie-poster"
                    src={getPosterUrl(movie.poster_path)}
                    alt={`Постер фільму ${movie.title}`}
                    draggable={false}
                />
            ) : (
                <div className="movie-poster-placeholder">No poster</div>
            )}

            <div className="movie-card-content">
                <h3>{movie.title}</h3>

                <p>
                    {movie.release_date.slice(0, 4) || '—'} · ★{' '}
                    {movie.vote_average.toFixed(1)}
                </p>
            </div>
            {showOverview && (
                <div className="movie-overview">
                    <p>{movie.overview}</p>


                    {!showOverview &&(

                <p>No description available.</p>
                    )}
                </div>
            )}
        </article>
    )
}