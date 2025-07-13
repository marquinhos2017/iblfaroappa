import { useEffect, useState, useRef } from 'react';

export const Badge = ({ count }) => {
    const [animate, setAnimate] = useState(false);
    const previousCount = useRef(count);

    useEffect(() => {
        if (previousCount.current !== count) {
            setAnimate(true);
            previousCount.current = count;

            const timer = setTimeout(() => {
                setAnimate(false);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [count]);

    return (
        <span className={`badge ${animate ? 'badge-animate' : ''}`}>
            {count}
        </span>
    );
};


export default Badge;