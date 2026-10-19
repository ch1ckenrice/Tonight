import { getPosterUrl, type TmdbMovie } from '../services/tmdb'
type SwipeMovieCardProps = {
    movie: TmdbMovie
    showOverview?: boolean
}

export function SwipeMovieCard({ movie, showOverview = false}: SwipeMovieCardProps) {

    return (
        <article className="swipe-movie-card">
            {movie.poster_path ? (
            <img  className="swipe-movie-card-image"
                  src={getPosterUrl(movie.poster_path)}
                  alt={`Постер фільму ${movie.title}`}
                  draggable={false}/>
            ) :  (
                    <div className="swipe-movie-card-placeholder">No poster</div>
                )}
            <div className="swipe-movie-card-overlay">
                <h2>{movie.title}</h2>
                <p className="swipe-movie-card-meta">
                    {movie.release_date.slice(0, 4) || '—'} · ★{' '}
                    {movie.vote_average.toFixed(1)}
                </p>
                {showOverview && (
                    <div className="swipe-movie-card-overview">
                        <p>{movie.overview || 'No description available.'}</p>
                    </div>
                )}
            </div>
        </article>
    )
}
