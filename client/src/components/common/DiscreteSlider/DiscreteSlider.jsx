import React, { useState, useEffect } from 'react';
import styles from './DiscreteSlider.module.css';

/**
 * A discrete slider component with a center-origin fill.
 * Assumes 3 items where index 1 is the 'neutral' center.
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of 3 option objects { value, label }
 * @param {string} props.value - Current selected value
 * @param {Function} props.onChange - Callback function(newValue)
 */
const DiscreteSlider = ({ options, value, onChange }) => {
    const [currentIndex, setCurrentIndex] = useState(1); // Default to center

    useEffect(() => {
        const index = options.findIndex(opt => opt.value === value);
        if (index !== -1) {
            setCurrentIndex(index);
        }
    }, [value, options]);

    const handleSelect = (index) => {
        setCurrentIndex(index);
        if (onChange) {
            onChange(options[index].value);
        }
    };

    if (!options || options.length !== 3) {
        return null; // Designed specifically for 3-state center logic for now
    }

    // Visual calculations for Center-Out logic
    // Index 0: Left (0%)
    // Index 1: Center (50%) -> Origin
    // Index 2: Right (100%)

    // Thumb Position
    const thumbLeft = (currentIndex === 0) ? '0%' : (currentIndex === 1) ? '50%' : '100%';

    // Progress Bar Logic
    let progressLeft = '50%';
    let progressWidth = '0%';

    if (currentIndex === 0) {
        // Fill from center to left
        progressLeft = '0%';
        progressWidth = '50%';
    } else if (currentIndex === 2) {
        // Fill from center to right
        progressLeft = '50%';
        progressWidth = '50%';
    } else {
        // Center - no fill
        progressLeft = '50%';
        progressWidth = '0%';
    }

    return (
        <div className={styles.container}>
            {/* Track Background */}
            <div className={styles.track}>
                {/* Progress Bar (Colored fill from center) */}
                <div
                    className={styles.progress}
                    style={{
                        left: progressLeft,
                        width: progressWidth
                    }}
                />

                {/* Stops (Dots) */}
                {options.map((_, index) => {
                    // Positions: 0%, 50%, 100%
                    const leftPos = (index === 0) ? '0%' : (index === 1) ? '50%' : '100%';
                    const isCenter = index === 1;

                    // Active state determines color.
                    // Center is active if current is center.
                    // Left is active if current is left.
                    // Right is active if current is right.
                    // Simple logic: stop is active if it equals current index.

                    return (
                        <div
                            key={index}
                            className={`${styles.stop} ${index === currentIndex ? styles.active : ''} ${isCenter ? styles.center : ''}`}
                            style={{ left: leftPos }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(index);
                            }}
                        />
                    );
                })}

                {/* Draggable Thumb */}
                <div
                    className={styles.thumb}
                    style={{ left: thumbLeft }}
                />
            </div>

            {/* Labels */}
            <div className={styles.labelsContainer}>
                {options.map((option, index) => {
                    const leftPos = (index === 0) ? '0%' : (index === 1) ? '50%' : '100%';
                    // Only show label if active or hover? No, always show to know options.
                    // Maybe dim non-active ones.

                    return (
                        <div
                            key={option.value}
                            className={`${styles.label} ${index === currentIndex ? styles.active : ''}`}
                            style={{ left: leftPos }}
                            onClick={() => handleSelect(index)}
                        >
                            {option.label}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DiscreteSlider;
