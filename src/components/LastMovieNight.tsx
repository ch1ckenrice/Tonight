import type { RecentRound } from '../types/round'
import { getPosterUrl } from '../services/tmdb'

type LastMovieNightProps = {
    recentRound: RecentRound
}

export function LastMovieNight({ recentRound }: LastMovieNightProps) {
    const watchLabel =
        recentRound.watchMode === 'group'
            ? `Group night · ${recentRound.participantCount} people`
            : 'Solo night'

    const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(recentRound.completedAt))

    return (
        <section className="recent-round">
            <p className="eyebrow">LAST MOVIE NIGHT</p>

            <div className="recent-round-card">
                <div className="recent-round-poster">
                    {recentRound.bestMovie.poster_path ? (
                        <img
                            className="recent-round-poster-image"
                            src={getPosterUrl(recentRound.bestMovie.poster_path)}
                            alt={`Poster for ${recentRound.bestMovie.title}`}
                            draggable={false}
                        />
                    ) : (
                        <div className="recent-round-poster-placeholder">No poster</div>
                    )}
                </div>

                <div className="recent-round-content">
                    <h2>{recentRound.bestMovie.title}</h2>
                    <p className="recent-round-meta">{watchLabel}</p>
                    <p className="recent-round-meta">
                        Mood: {recentRound.mood}
                    </p>
                    <p className="recent-round-date">Chosen {formattedDate}</p>
                </div>
            </div>
        </section>
    )
}