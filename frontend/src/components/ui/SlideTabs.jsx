import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./SlideTabs.module.css";

// Beautiful SVG Icons for each tab
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const NailArtIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {/* Forearm / Wrist lines with a sketch-like broken gap */}
    <path d="M2 3.5c3.5 0 6.5 2 9.5 3" />
    <path d="M2 8.5c3 3 5 4.5 7.5 5" />
    <path d="M13.5 6.5c1 .5 2 1.5 2.5 2.5" />
    
    {/* Thumb (pointing left/down) */}
    <path d="M9.5 13.5c-1-.5-2.2 0-2.5 1.5s.5 2.5 1.5 3.5l2 2" />
    
    {/* Index finger */}
    <path d="M12.5 10.5c.8 1.5 1.8 3.8 2.8 6.5s.5 2-.5 2.5-1.8 0-2.5-1.5l-2.2-6" />
    
    {/* Middle finger */}
    <path d="M14.5 9.5c1 2 2.2 5 3.2 7.8.4 1 0 2-1 2s-1.8-.8-2.5-2.2L12 11" />
    
    {/* Ring finger */}
    <path d="M16.5 9c1 2 2.5 5 3.2 7.5.3.8-.2 1.8-1 1.8s-1.8-.8-2.2-2.2l-2-5.5" />
    
    {/* Pinky finger */}
    <path d="M18.5 9.5c.8 1.5 1.8 3.5 2.3 5.3.3.8-.2 1.5-.8 1.5s-1.2-.5-1.5-1.5l-1.5-3.8" />
    
    {/* Painted fingernails (match text color dynamically) */}
    <rect x="9.5" y="19.2" width="1.2" height="2.5" rx="0.6" transform="rotate(30 10.1 20.45)" fill="currentColor" />
    <rect x="12.5" y="18.2" width="1.2" height="2.5" rx="0.6" transform="rotate(25 13.1 19.45)" fill="currentColor" />
    <rect x="15.2" y="17.4" width="1.2" height="2.5" rx="0.6" transform="rotate(20 15.8 18.65)" fill="currentColor" />
    <rect x="17.7" y="16.4" width="1.2" height="2.5" rx="0.6" transform="rotate(15 18.3 17.65)" fill="currentColor" />
    <rect x="19.7" y="14.4" width="1.2" height="2.5" rx="0.6" transform="rotate(10 20.3 15.65)" fill="currentColor" />
    
    {/* Sparkles (Plus signs from sketch) */}
    <path d="M21.5 2v4M19.5 4h4" /> {/* Top Right Plus */}
    <path d="M6 8.5v3M4.5 10h3" />   {/* Wrist Plus */}
    <path d="M2 13.5v3M0.5 15h3" />   {/* Left Plus */}
    
    {/* Bubbles (Circles from sketch) */}
    <circle cx="16.5" cy="4.5" r="1.2" /> {/* Top bubble */}
    <circle cx="5" cy="16.5" r="1.2" />   {/* Left bubble */}
  </svg>
);

const TeamIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const GalleryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

const ContactIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 9.92z"/></svg>
);

const getTabIcon = (path, isActive, isHovered) => {
  switch (path) {
    case '/':
      return <HomeIcon />;
    case '/servicios':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          {/* Faceted luxury diamond outline */}
          <path d="M6 3h12l4 6-10 12L2 9z" />
          {/* Inner facets */}
          <path d="M12 3v18" />
          <path d="M2 9h20" />
          <path d="M6 3l6 6" />
          <path d="M18 3l-6 6" />
        </svg>
      );
    case '/equipo':
      return <TeamIcon />;
    case '/galeria':
      return <GalleryIcon />;
    case '/contacto':
      return <ContactIcon />;
    default:
      return <HomeIcon />;
  }
};

export const SlideTabs = ({ tabs = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Selected tab based on route
  const initialSelectedIndex = tabs.findIndex(tab => tab.path === location.pathname);
  const [selected, setSelected] = useState(initialSelectedIndex >= 0 ? initialSelectedIndex : 0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const idx = tabs.findIndex(tab => tab.path === location.pathname);
    if (idx >= 0) {
      setSelected(idx);
    }
  }, [location.pathname, tabs]);

  return (
    <ul
      onMouseLeave={() => setHoveredIndex(null)}
      className={styles.tabsContainer}
    >
      {tabs.map((tab, i) => {
        const isActive = selected === i;
        const icon = getTabIcon(tab.path, isActive, hoveredIndex === i);

        return (
          <Tab
            key={tab.name}
            icon={icon}
            isActive={isActive}
            isHovered={hoveredIndex === i}
            onMouseEnter={() => setHoveredIndex(i)}
            onClick={() => {
              setSelected(i);
              if (tab.path) navigate(tab.path);
              if (tab.onClick) tab.onClick();
            }}
          >
            {tab.name}
          </Tab>
        );
      })}
    </ul>
  );
};

const Tab = ({ children, icon, isActive, isHovered, onMouseEnter, onClick }) => {
  // Active text styling for color contrast (dark text on white pill, light text on glass)
  const textColor = isActive ? "var(--color-black)" : isHovered ? "var(--color-white)" : "rgba(255, 255, 255, 0.65)";

  return (
    <li
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={styles.tab}
      style={{ color: textColor }}
    >
      {/* Active Tab White Pill */}
      {isActive && (
        <motion.div
          layoutId="activeTabPill"
          className={styles.cursor}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      {/* Hover Tab Pill */}
      {isHovered && !isActive && (
        <motion.div
          layoutId="hoverTabPill"
          className={styles.hoverCursor}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      {/* Tab Inner Contents */}
      <span className={styles.tabContent}>
        {icon}
        <motion.span
          layout
          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
          animate={{ 
            width: isActive ? "auto" : 0, 
            opacity: isActive ? 1 : 0,
            marginLeft: isActive ? 8 : 0
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className={styles.tabText}
        >
          {children}
        </motion.span>
      </span>
    </li>
  );
};

export default SlideTabs;
