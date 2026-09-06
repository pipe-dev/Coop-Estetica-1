import { Link, useLocation } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaTiktok, FaWhatsapp } from 'react-icons/fa6';
import { useAdmin } from '../../context/AdminContext';
import styles from './Footer.module.css';

/**
 * Footer con 4 columnas: About, Links, Horario, Contacto.
 * Lee dinámicamente de la base de datos (businessConfig).
 */
const Footer = () => {
  const location = useLocation();
  const { businessConfig } = useAdmin();
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
          <h2 className={`${styles.shopFooterTitle} ${isContact ? styles.sponsorFooterTitle : ''} ${isAbout ? styles.aboutFooterTitle : ''}`}>
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
              {businessConfig?.instagramUrl && (
                <a
                  href={businessConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="Instagram"
                >
                  <FaInstagram size={18} />
                </a>
              )}
              {businessConfig?.facebookUrl && (
                <a
                  href={businessConfig.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="Facebook"
                >
                  <FaFacebookF size={18} />
                </a>
              )}
              {businessConfig?.tiktokUrl && (
                <a
                  href={businessConfig.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="TikTok"
                >
                  <FaTiktok size={18} />
                </a>
              )}
              {businessConfig?.whatsappNumber && (
                <a
                  href={`https://wa.me/57${businessConfig.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp size={18} />
                </a>
              )}
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
            {businessConfig?.openingHours && businessConfig.openingHours.trim() !== '' ? (
              <p style={{ color: 'var(--color-gray-400)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {businessConfig.openingHours}
              </p>
            ) : (
              <p style={{ color: 'var(--color-gray-500)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                Horarios por definir en el panel
              </p>
            )}
          </div>

          {/* Columna 4: Contacto */}
          <div className={styles.column}>
            <h4 className={styles.heading}>Contacto</h4>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>📍</span>
                <span>
                  {businessConfig?.address && businessConfig.address.trim() !== ''
                    ? businessConfig.address
                    : 'Dirección no registrada'}
                </span>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>📞</span>
                {businessConfig?.phone && businessConfig.phone.trim() !== '' ? (
                  <a href={`tel:${businessConfig.phone.replace(/\D/g, '')}`} className={styles.link}>
                    +57 {businessConfig.phone}
                  </a>
                ) : businessConfig?.whatsappNumber && businessConfig.whatsappNumber.trim() !== '' ? (
                  <a href={`https://wa.me/57${businessConfig.whatsappNumber.replace(/\D/g, '')}`} className={styles.link} target="_blank" rel="noreferrer">
                    +57 {businessConfig.whatsappNumber}
                  </a>
                ) : (
                  <span>Teléfono no registrado</span>
                )}
              </li>
              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>✉️</span>
                {businessConfig?.ownerEmail || businessConfig?.adminEmail ? (
                  <a href={`mailto:${businessConfig.ownerEmail || businessConfig.adminEmail}`} className={styles.link}>
                    {businessConfig.ownerEmail || businessConfig.adminEmail}
                  </a>
                ) : (
                  <span>Correo no registrado</span>
                )}
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
