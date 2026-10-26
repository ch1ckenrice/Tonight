import { Link } from 'react-router-dom'
import {useEffect, useState} from "react";
import {
    getPopularMovies,
    type TmdbMovie,
} from '../services/tmdb'
import { MovieCard } from '../components/MovieCard'
import {getRecentRound} from "../services/roundStorage.ts";
import type {RecentRound} from "../types/round.ts";
import {LastMovieNight} from "../components/LastMovieNight.tsx";

function HomePage() {

    const [movies, setMovies] = useState<TmdbMovie[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [recentRound] = useState<RecentRound | null>(() => getRecentRound())

    useEffect(() => {
        async function loadMovies() {
          try{
              setIsLoading(true)
              setErrorMessage('')

              const popularMovies = await getPopularMovies()

              setMovies(popularMovies)
          } catch {
              setErrorMessage('Something went wrong')
          } finally {
              setIsLoading(false)
          }
        }
        loadMovies()
    }, [])
    return (
        <main className="app">
            <header className="top-bar">
                <a className="brand" href="/" aria-label="Tonight home">
                    tonight<span>•</span>
                </a>

                <span className="mode-label">pass-the-phone</span>
            </header>

            <section className="hero" aria-labelledby="hero-title">
                <p className="eyebrow">MOVIE NIGHT, SORTED</p>

                <h1 id="hero-title">Stop scrolling. Start watching.</h1>

                <p className="hero-copy">
                    Tell Tonight who is watching and what mood you are in. We will help
                    everyone find a movie they will actually enjoy.
                </p>

                <Link className="primary-button" to="/setup">
                    Start a movie night <span aria-hidden="true">→</span>
                </Link>

                <ul className="hero-points">
                    <li>1–4 people</li>
                    <li>Quick decisions</li>
                    <li>No account needed</li>
                </ul>
            </section>

            {recentRound && <LastMovieNight recentRound={recentRound} />}

            <section
                className="popular-section"
                aria-labelledby="popular-title"
            >
                <h2 id="popular-title">Popular tonight</h2>

                {isLoading && <p>Loading movies...</p>}

                {errorMessage && <p>{errorMessage}</p>}

                {!isLoading && !errorMessage && (
                   <div className="movie-grid">
                       {movies.slice(0,6).map((movie) =>(
                           <MovieCard key={movie.id} movie={movie} />
                       ))}
                   </div>
                )}
            </section>


            <section className="how-it-works" aria-labelledby="how-it-works-title">
                <p className="eyebrow">HOW IT WORKS</p>
                <h2 id="how-it-works-title">Your next movie in three small steps.</h2>

                <ol className="steps-list">
                    <li>
                        <span>01</span>
                        <div>
                            <h3>Set the mood</h3>
                            <p>Choose genres, time and the type of night you want.</p>
                        </div>
                    </li>

                    <li>
                        <span>02</span>
                        <div>
                            <h3>Pass the phone</h3>
                            <p>Everyone likes or skips movie cards in turn.</p>
                        </div>
                    </li>

                    <li>
                        <span>03</span>
                        <div>
                            <h3>Find your match</h3>
                            <p>See only films that everyone wants to watch.</p>
                        </div>
                    </li>
                </ol>
            </section>
        </main>
    )
}

export default HomePage;