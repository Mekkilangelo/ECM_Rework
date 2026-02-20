import React, { useRef, useEffect, useState } from 'react';
import styles from './TriStateToggle.module.css';

/**
 * A modern 3-state toggle component.
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of 3 option objects { value, label }
 * @param {string} props.value - Current selected value
 * @param {Function} props.onChange - Callback function(newValue)
 */
const TriStateToggle = ({ options, value, onChange }) => {
    const [activeIndex, setActiveIndex] = useState(1); // Default to middle (neutral)
    const containerRef = useRef(null);

    useEffect(() => {
        const index = options.findIndex(opt => opt.value === value);
        if (index !== -1) {
            setActiveIndex(index);
        }
    }, [value, options]);

    const handleSelect = (index, newValue) => {
        setActiveIndex(index);
        if (onChange) {
            onChange(newValue);
        }
    };

    if (!options || options.length !== 3) {
        console.warn('TriStateToggle requires exactly 3 options.');
        return null;
    }

    // Calculate slider position based on index (0, 1, or 2)
    // Each segment is roughly 33.33% width.
    // We use CSS transform for performance.
    // The logic is handled via the style prop on the slider element or dynamic class, 
    // but since width is percentage based, we can just use 100% * index.
    // However, container has padding, so we might need a slightly more precise approach if we want pixel perfection.
    // The CSS implementation uses `left: 4px` and width calculation, so `transform: translateX(...)` is best.

    const sliderStyle = {
        transform: `translateX(${activeIndex * 100}%)`,
    };

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.slider} style={sliderStyle} />
            {options.map((option, index) => (
                <div
                    key={option.value}
                    className={`${styles.option} ${activeIndex === index ? styles.active : ''}`}
                    onClick={() => handleSelect(index, option.value)}
                >
                    {option.label}
                </div>
            ))}
        </div>
    );
};

export default TriStateToggle;
