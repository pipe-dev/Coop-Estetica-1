import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './TestimonialCarousel.module.css';

/**
 * Carrusel de testimonios con rotación automática, controles manuales
 * y transiciones suaves.
 *
 * @param {{ testimonials: Array<{ name: string, role?: string, text: string, rating: number, image?: string }> }} props
 */
const TestimonialCarousel = ({ testimonials = [] }) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const total = testimonials.length;

  const goTo = useCallback(
    (index) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-rotación cada 6 segundos
  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, total]);

  if (!total) return null;

  const testimonial = testimonials[current];

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  /** Renderizar estrellas doradas */
  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < rating ? styles.starFilled : styles.starEmpty}
      >
        ★
      </span>
    ));

  return (
    <div className={styles.carousel}>
      {/* Comilla decorativa */}
      <span className={styles.quoteOpen}>"</span>

      <div className={styles.slideArea}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            className={styles.slide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
            {/* Estrellas */}
            <div className={styles.stars}>{renderStars(testimonial.rating)}</div>

            {/* Texto */}
            <blockquote className={styles.text}>
              {testimonial.text}
            </blockquote>

            {/* Autor */}
            <div className={styles.author}>
              {testimonial.image && (
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className={styles.avatar}
                />
              )}
              <div>
                <p className={styles.name}>{testimonial.name}</p>
                {testimonial.role && (
                  <p className={styles.role}>{testimonial.role}</p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <span className={styles.quoteClose}>"</span>

      {/* Controles */}
      <div className={styles.controls}>
        <button
          className={styles.arrow}
          onClick={prev}
          aria-label="Testimonio anterior"
        >
          ‹
        </button>

        <div className={styles.dots}>
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Ir al testimonio ${i + 1}`}
            />
          ))}
        </div>

        <button
          className={styles.arrow}
          onClick={next}
          aria-label="Siguiente testimonio"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default TestimonialCarousel;
