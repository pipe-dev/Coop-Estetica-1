import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionTitle from '../components/ui/SectionTitle'
import { team } from '../data/team'
import styles from './Team.module.css'

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }

function Team() {
  const [selectedMember, setSelectedMember] = useState(null)

  return (
    <main className={styles.team}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.p className={styles.heroSub} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Conoce a
          </motion.p>
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Nuestro <span className={styles.accent}>Equipo</span>
          </motion.h1>
          <motion.p
            className={styles.heroDesc}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Artistas de la belleza con años de experiencia y pasión por la excelencia
          </motion.p>
        </div>
      </section>

      <section className={styles.teamSection}>
        <div className="container">
          <motion.div
            className={styles.teamGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {team.map((member, i) => (
              <motion.div
                key={member.id}
                className={styles.memberCard}
                variants={fadeInUp}
                custom={i}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedMember(member)}
              >
                <div className={styles.memberImageWrapper}>
                  <img src={member.avatar} alt={member.name} className={styles.memberImage} />
                  <div className={styles.memberOverlay}>
                    <span className={styles.viewMore}>Ver perfil</span>
                  </div>
                </div>
                <div className={styles.memberInfo}>
                  <h3 className={styles.memberName}>{member.name}</h3>
                  <p className={styles.memberRole}>{member.role}</p>
                  <p className={styles.memberExp}>{member.experience} de experiencia</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={() => setSelectedMember(null)}>✕</button>
              <div className={styles.modalContent}>
                <img src={selectedMember.avatar} alt={selectedMember.name} className={styles.modalImage} />
                <div className={styles.modalInfo}>
                  <h2 className={styles.modalName}>{selectedMember.name}</h2>
                  <p className={styles.modalRole}>{selectedMember.role}</p>
                  <div className={styles.modalTags}>
                    <span className={styles.tag}>{selectedMember.specialty}</span>
                    <span className={styles.tag}>{selectedMember.experience}</span>
                  </div>
                  <p className={styles.modalBio}>{selectedMember.bio}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default Team
