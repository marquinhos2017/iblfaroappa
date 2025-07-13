'use client';
import { useState, useEffect } from 'react';
import styles from './Carousel.module.css';

export default function SavedSongsCarousel({ savedSongs }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (savedSongs.length > 0) {
            const timer = setInterval(() => {
                setCurrentIndex((prevIndex) =>
                    prevIndex === savedSongs.length - 1 ? 0 : prevIndex + 1
                );
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [savedSongs.length]);

    if (savedSongs.length === 0) {
        return <div className={styles.noSongs}>Nenhuma música salva ainda</div>;
    }

    return (
        <div className={styles.carousel}>
            <h2>Músicas Salvas</h2>
            <div className={styles.carouselContent}>
                <img
                    src={savedSongs[currentIndex].cover}
                    alt="Album cover"
                    className={styles.carouselImage}
                />
                <div className={styles.carouselInfo}>
                    <h3>{savedSongs[currentIndex].title}</h3>
                    <p>{savedSongs[currentIndex].artist}</p>
                </div>
            </div>
            <div className={styles.carouselDots}>
                {savedSongs.map((_, index) => (
                    <button
                        key={index}
                        className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
}