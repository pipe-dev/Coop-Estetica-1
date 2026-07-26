import { Link, useLocation } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaTiktok, FaWhatsapp } from 'react-icons/fa6';
import styles from './Footer.module.css';

/**
 * Footer con 4 columnas: About, Links, Horario, Contacto.
 * Para la ruta /tienda muestra un diseño minimalista.
 */
const Footer = () => {
  const location = useLocation();
  const isShop = location.pathname === '/tienda';
  const isHome = location.pathname === '/';

  if (isHome) {
    return (
      <footer className={styles.footer} style={{ paddingBottom: 0, minHeight: 0 }}>
        {/* Línea decorativa dorada */}
        <div className={styles.topLine} />
      </footer>
    );
  }

  const quickLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/tienda', label: 'Tienda' },
    { to: '/servicios', label: 'Servicios' },
    { to: '/nosotros', label: 'Nosotros' },
    { to: '/contacto', label: 'Contacto' },
    { to: '/reservar', label: 'Reservar Cita' },
  ];

  const schedule = [
    { day: 'Lunes – Viernes', hours: '9:00 – 20:00' },
    { day: 'Sábados', hours: '10:00 – 18:00' },
    { day: 'Domingos', hours: '10:00 – 14:00' },
  ];

  const isServices = location.pathname === '/servicios';
  const isContact = location.pathname === '/contacto';
  const isAbout = location.pathname === '/nosotros';

  if (isShop || isServices || isContact || isAbout) {
    const footerTitle = isShop
      ? 'TIENDA'
      : isServices
      ? 'SERVICIOS'
      : isContact
      ? 'PATROCINADOR'
      : 'NOSOTROS';
    return (
      <footer className={styles.shopFooter}>
        {/* Línea decorativa dorada */}
        <div className={styles.topLine} />
        <div className={`${styles.shopFooterContainer} ${isContact ? styles.sponsorFooterContainer : ''}`}>
          <h2 className={`${styles.shopFooterTitle} ${isContact ? styles.sponsorFooterTitle : ''}`}>
            {footerTitle}
          </h2>
        </div>
      </footer>
    );
  }

  return (
    <footer className={styles.footer}>
      {/* Línea decorativa dorada */}
      <div className={styles.topLine} />

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Columna 1: About */}
          <div className={styles.column}>
            {/* Cambiar nombre cuando se defina */}
            <h3 className={styles.logo}>CATHERYNE RÍOS ESTÉTICA</h3>
            <p className={styles.aboutText}>
              Un santuario de bienestar donde la elegancia se encuentra con la
              serenidad. Experimenta tratamientos exclusivos diseñados para
              renovar cuerpo, mente y espíritu.
            </p>
            <div className={styles.socials}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Instagram"
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Facebook"
              >
                <FaFacebookF size={18} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="TikTok"
              >
                <FaTiktok size={18} />
              </a>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={18} />
              </a>
            </div>
          </div>

          {/* Columna 2: Links rápidos */}
          <div className={styles.column}>
            <h4 className={styles.heading}>Links Rápidos</h4>
            <ul className={styles.linkList}>
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Horario */}
          <div className={styles.column}>
            <h4 className={styles.heading}>Horario</h4>
            <ul className={styles.scheduleList}>
              {schedule.map((item) => (
                <li key={item.day} className={styles.scheduleItem}>
                  <span className={styles.day}>{item.day}</span>
                  <span className={styles.hours}>{item.hours}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div className={styles.column}>
            <h4 className={styles.heading}>Contacto</h4>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>📍</span>
                <span>Calle Ejemplo 123, Ciudad, País</span>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>📞</span>
                <a href="tel:+0000000000" className={styles.link}>
                  +00 000 000 000
                </a>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>✉️</span>
                <a href="mailto:info@catheryneriosestetica.com" className={styles.link}>
                  info@catheryneriosestetica.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className={styles.bottomBar}>
        <div className={styles.container}>
          {/* Cambiar nombre cuando se defina */}
          <p className={styles.copyright}>
            © 2026 Catheryne Ríos Estética. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
