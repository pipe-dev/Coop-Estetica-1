import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./SlideTabs.module.css";

import { Home, Gem, Users, Image as ImageIcon, Briefcase, ShoppingBag } from 'lucide-react';

const getTabIcon = (path, isActive, isHovered) => {
  const iconProps = { size: 16, strokeWidth: 2.2, style: { flexShrink: 0 } };
  
  switch (path) {
    case '/':
      return <Home {...iconProps} />;
    case '/tienda':
      return <ShoppingBag {...iconProps} />;
    case '/servicios':
      return <Gem {...iconProps} />;
    case '/nosotros':
      return <Users {...iconProps} />;
    case '/patrocinador':
      return <Briefcase {...iconProps} />;
    default:
      return <Home {...iconProps} />;
  }
};

export const SlideTabs = ({ tabs = [], isLightBackground = false }) => {
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
      className={`${styles.tabsContainer} ${isLightBackground ? styles.darkTabs : styles.lightTabs}`}
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
            isLightBackground={isLightBackground}
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

const Tab = ({ children, icon, isActive, isHovered, isLightBackground, onMouseEnter, onClick }) => {
  // High contrast text/icon styling depending on liquid glass mode
  const textColor = isActive
    ? "var(--color-black)"
    : isHovered
      ? (isLightBackground ? "var(--color-gold-light)" : "var(--color-white)")
      : (isLightBackground ? "rgba(255, 255, 255, 0.90)" : "rgba(255, 255, 255, 0.75)");

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
