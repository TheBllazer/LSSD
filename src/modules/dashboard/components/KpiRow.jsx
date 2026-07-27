import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import {
  MdPeopleAlt,
  MdDirectionsCar,
  MdDescription,
  MdGavel,
  MdGroups,
} from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import { formatNumber } from '@/utils/format';
import { motionTiming } from '@/styles/theme';

/**
 * Indicateur unitaire.
 *
 * @param {object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.label
 * @param {number|null} props.value
 * @param {boolean} props.loading
 * @param {number} props.delay
 * @param {() => void} [props.onClick]
 */
function Kpi({ icon, label, value, loading, delay, onClick }) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTiming.base, delay, ease: motionTiming.easeOut }}
      onClick={onClick}
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '3px',
        bgcolor: 'background.paper',
        boxShadow: 'var(--shadow-panel)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 140ms ease',
        '&:hover': onClick ? { borderColor: 'primary.main' } : undefined,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
        <Box sx={{ display: 'flex', fontSize: 16, color: 'primary.main' }}>{icon}</Box>
        <Typography className="label-caps">{label}</Typography>
      </Stack>

      {loading ? (
        <Skeleton variant="text" width={70} height={30} />
      ) : (
        <Typography
          className="mono"
          sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}
        >
          {value === null || value === undefined ? '—' : formatNumber(value)}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Bandeau d'indicateurs du service.
 *
 * Les valeurs proviennent du document d'agrégats, tenu à jour de façon atomique
 * par la couche de données — jamais recalculé à l'affichage.
 *
 * @param {object} props
 * @param {object|null} props.stats
 * @param {boolean} props.loading
 * @param {number} props.onlineCount
 * @param {(path: string) => void} props.onNavigate
 */
export default function KpiRow({ stats, loading, onlineCount, onNavigate }) {
  const items = [
    { key: 'citizens', icon: <MdPeopleAlt />, label: 'Citoyens', path: '/citizens' },
    { key: 'vehicles', icon: <MdDirectionsCar />, label: 'Véhicules', path: '/vehicles' },
    { key: 'weapons', icon: <GiPistolGun />, label: 'Armes', path: '/weapons' },
    { key: 'reports', icon: <MdDescription />, label: 'Rapports', path: '/reports' },
    { key: 'criminalRecords', icon: <MdGavel />, label: 'Casiers', path: '/records' },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 1.5,
        mb: 1.75,
      }}
    >
      {items.map((item, index) => (
        <Kpi
          key={item.key}
          icon={item.icon}
          label={item.label}
          value={stats?.[item.key] ?? 0}
          loading={loading}
          delay={index * 0.04}
          onClick={() => onNavigate(item.path)}
        />
      ))}

      <Kpi
        icon={<MdGroups />}
        label="En service"
        value={onlineCount}
        loading={false}
        delay={items.length * 0.04}
        onClick={() => onNavigate('/agents')}
      />
    </Box>
  );
}
