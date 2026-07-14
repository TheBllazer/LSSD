// Hiérarchie des grades du LSSD, du plus haut au plus bas.
// L'index dans ce tableau sert de "niveau" : plus l'index est petit, plus le grade est élevé.
export const ROLES = [
  'Sheriff Adjoint',
  'Major',
  'Commander',
  'Captain',
  'Lieutenant',
  'Sergent',
  'Master FTO',
  'Deputy III',
  'Deputy II',
  'Deputy I',
  'Deputy Trainee',
];

// Grade par défaut attribué à la création d'un compte.
export const DEFAULT_ROLE = 'Deputy Trainee';

// Rang à partir duquel un agent est considéré comme "gradé"
// (Sergent et au-dessus). Modifiable si besoin.
const GRADED_THRESHOLD = ROLES.indexOf('Sergent');

const roleLevel = (role) => {
  const index = ROLES.indexOf(role);
  // Rôle inconnu = on le traite comme le grade le plus bas possible
  return index === -1 ? ROLES.length : index;
};

// Un "gradé" peut valider des rapports, gérer les grades des autres agents, etc.
export const isGraded = (role) => roleLevel(role) <= GRADED_THRESHOLD;

// Seul un gradé peut changer le rôle d'un autre agent.
export const canManageAgents = (role) => isGraded(role);

// Seul un gradé peut valider/refuser un rapport.
export const canValidateReports = (role) => isGraded(role);

// Un agent peut modifier son propre rapport tant qu'il n'est pas validé,
// ou n'importe quel rapport s'il est gradé.
export const canEditReport = (userRole, report, userId) => {
  if (isGraded(userRole)) return true;
  if (report.authorId !== userId) return false;
  return report.status !== 'Validé';
};

export const canDeleteReport = (userRole) => isGraded(userRole);
