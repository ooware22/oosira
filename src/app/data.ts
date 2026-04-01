export interface Formation {
  diplome: string;
  specialite: string;
  etablissement: string;
  ville: string;
  annee: string;
  mention: string;
}

export interface Experience {
  poste: string;
  entreprise: string;
  secteur: string;
  dateDebut: string;
  dateFin: string;
  description: string;
}

export interface Langue {
  langue: string;
  niveau: string;
}

export interface Candidate {
  id: number;
  prenom: string;
  nom: string;
  titre: string;
  email: string;
  telephone: string;
  ville: string;
  linkedin: string;
  accroche: string;
  formations: Formation[];
  experiences: Experience[];
  competences: string[];
  langues: Langue[];
  logiciels: string[];
  iconName: string;
  cardColor: string;
  recommendedTemplate: number;
}

export const TEMPLATE_NAMES = [
  'Classique Pro',
  'Ingenieur',
  'Cadre Moderne',
  'Medical',
  'Tech & IT',
];

export const candidates: Candidate[] = [
  {
    id: 1,
    prenom: 'Yacine',
    nom: 'Belkacem',
    titre: 'Ingenieur Genie Mecanique Senior',
    email: 'y.belkacem@email.dz',
    telephone: '+213 555 12 34 56',
    ville: 'Annaba',
    linkedin: 'linkedin.com/in/ybelkacem',
    accroche: 'Ingenieur mecanicien senior avec 12 ans d\'experience en conception industrielle, gestion de projets techniques et optimisation des processus de fabrication. Expert en CAO/FAO et simulation numerique.',
    formations: [
      {
        diplome: 'Master',
        specialite: 'Genie Mecanique - Conception & Fabrication',
        etablissement: 'Universite Badji Mokhtar',
        ville: 'Annaba',
        annee: '2012',
        mention: 'Tres Bien',
      },
      {
        diplome: 'Licence',
        specialite: 'Sciences Techniques - Mecanique',
        etablissement: 'Universite Badji Mokhtar',
        ville: 'Annaba',
        annee: '2010',
        mention: 'Bien',
      },
    ],
    experiences: [
      {
        poste: 'Ingenieur Conception Senior',
        entreprise: 'ArcelorMittal Annaba',
        secteur: 'Siderurgie',
        dateDebut: '2018',
        dateFin: 'Present',
        description: 'Direction de l\'equipe conception (5 ingenieurs). Optimisation des lignes de production avec une reduction de 18% des temps d\'arret. Mise en place de la maintenance predictive.',
      },
      {
        poste: 'Ingenieur Mecanique',
        entreprise: 'Sonatrach - Division Production',
        secteur: 'Petrochimie',
        dateDebut: '2014',
        dateFin: '2018',
        description: 'Conception et suivi de montage d\'equipements sous pression. Realisation d\'etudes RDM et analyses par elements finis.',
      },
      {
        poste: 'Ingenieur Bureau d\'Etudes',
        entreprise: 'ENMTP - Entreprise Nationale',
        secteur: 'Materiel de Travaux Publics',
        dateDebut: '2012',
        dateFin: '2014',
        description: 'Conception de pieces mecaniques sur SolidWorks. Elaboration de plans de fabrication et gammes d\'usinage.',
      },
    ],
    competences: ['CAO/FAO', 'SolidWorks', 'CATIA V5', 'ANSYS', 'RDM', 'Elements Finis', 'Gestion de Projets', 'Maintenance Predictive', 'Normes ISO', 'Lean Manufacturing'],
    langues: [
      { langue: 'Arabe', niveau: 'Natif' },
      { langue: 'Francais', niveau: 'Courant' },
      { langue: 'Anglais', niveau: 'Intermediaire' },
    ],
    logiciels: ['SolidWorks', 'CATIA V5', 'ANSYS Mechanical', 'AutoCAD', 'MS Project', 'SAP PM'],
    iconName: 'cog',
    cardColor: '#3B6EF0',
    recommendedTemplate: 2,
  },
  {
    id: 2,
    prenom: 'Sofiane',
    nom: 'Benali',
    titre: 'Directeur Commercial B2B',
    email: 's.benali@email.dz',
    telephone: '+213 555 78 90 12',
    ville: 'Constantine',
    linkedin: 'linkedin.com/in/sbenali',
    accroche: 'Directeur commercial aguerri avec 15 ans d\'experience dans le developpement business B2B, la negociation de contrats strategiques et la gestion d\'equipes commerciales performantes.',
    formations: [
      {
        diplome: 'MBA',
        specialite: 'Management Commercial & Marketing',
        etablissement: 'ESC Alger - Ecole Superieure de Commerce',
        ville: 'Alger',
        annee: '2010',
        mention: 'Major de promotion',
      },
      {
        diplome: 'Licence',
        specialite: 'Sciences Commerciales',
        etablissement: 'Universite des Freres Mentouri',
        ville: 'Constantine',
        annee: '2007',
        mention: 'Bien',
      },
    ],
    experiences: [
      {
        poste: 'Directeur Commercial Region Est',
        entreprise: 'Cevital - Groupe Agroalimentaire',
        secteur: 'Agroalimentaire',
        dateDebut: '2019',
        dateFin: 'Present',
        description: 'Pilotage d\'une equipe de 25 commerciaux sur 12 wilayas. Croissance du CA de 35% en 3 ans. Negociation de contrats cadres avec la grande distribution.',
      },
      {
        poste: 'Responsable Grands Comptes',
        entreprise: 'Danone Djurdjura',
        secteur: 'FMCG',
        dateDebut: '2014',
        dateFin: '2019',
        description: 'Gestion du portefeuille grands comptes (CA 800M DZD). Deploiement de la strategie trade marketing. Lancement de 3 nouvelles gammes de produits.',
      },
      {
        poste: 'Chef de Zone Commerciale',
        entreprise: 'Hamoud Boualem',
        secteur: 'Boissons',
        dateDebut: '2010',
        dateFin: '2014',
        description: 'Developpement du reseau de distribution sur 6 wilayas. Recrutement et formation de 15 commerciaux terrain.',
      },
    ],
    competences: ['Developpement B2B', 'Negociation', 'Management d\'Equipe', 'Trade Marketing', 'CRM', 'Grands Comptes', 'Business Development', 'Distribution', 'KPI & Reporting', 'Budgetisation'],
    langues: [
      { langue: 'Arabe', niveau: 'Natif' },
      { langue: 'Francais', niveau: 'Courant' },
      { langue: 'Anglais', niveau: 'Intermediaire' },
      { langue: 'Espagnol', niveau: 'Debutant' },
    ],
    logiciels: ['Salesforce', 'SAP SD', 'Microsoft 365', 'Power BI', 'HubSpot CRM'],
    iconName: 'chart-bar',
    cardColor: '#C0392B',
    recommendedTemplate: 3,
  },
  {
    id: 3,
    prenom: 'Amina',
    nom: 'Cherif',
    titre: 'Chef Comptable - Gestion Financiere',
    email: 'a.cherif@email.dz',
    telephone: '+213 555 34 56 78',
    ville: 'Alger',
    linkedin: 'linkedin.com/in/acherif',
    accroche: 'Chef comptable rigoureuse avec 10 ans d\'experience en comptabilite generale et analytique, fiscalite algerienne et reporting financier. Maitrise du SCF et des normes IFRS.',
    formations: [
      {
        diplome: 'Master',
        specialite: 'Comptabilite, Controle et Audit',
        etablissement: 'ESC Alger - Ecole Superieure de Commerce',
        ville: 'Alger',
        annee: '2014',
        mention: 'Tres Bien',
      },
      {
        diplome: 'Licence',
        specialite: 'Sciences Financieres et Comptabilite',
        etablissement: 'Universite d\'Alger 3',
        ville: 'Alger',
        annee: '2012',
        mention: 'Bien',
      },
    ],
    experiences: [
      {
        poste: 'Chef Comptable',
        entreprise: 'Groupe Benamor',
        secteur: 'Agroalimentaire',
        dateDebut: '2020',
        dateFin: 'Present',
        description: 'Supervision d\'une equipe de 6 comptables. Etablissement des etats financiers consolides. Gestion des declarations fiscales (TVA, IBS, TAP).',
      },
      {
        poste: 'Comptable Principale',
        entreprise: 'Pfizer Algerie',
        secteur: 'Pharmaceutique',
        dateDebut: '2016',
        dateFin: '2020',
        description: 'Tenue de la comptabilite generale et analytique selon les normes IFRS. Preparation des reportings mensuels pour le siege regional.',
      },
      {
        poste: 'Comptable Junior',
        entreprise: 'Cabinet Mazars Algerie',
        secteur: 'Audit & Conseil',
        dateDebut: '2014',
        dateFin: '2016',
        description: 'Missions d\'audit legal pour des societes cotees. Verification des comptes annuels. Redaction de rapports d\'audit.',
      },
    ],
    competences: ['Comptabilite Generale', 'SCF / IFRS', 'Fiscalite Algerienne', 'Audit Interne', 'Consolidation', 'Reporting', 'Cloture Annuelle', 'Controle de Gestion', 'Tresorerie', 'Normes Comptables'],
    langues: [
      { langue: 'Arabe', niveau: 'Natif' },
      { langue: 'Francais', niveau: 'Courant' },
      { langue: 'Anglais', niveau: 'Intermediaire' },
    ],
    logiciels: ['SAP FI/CO', 'Sage Comptabilite', 'Excel Avance', 'PC Compta', 'Power BI'],
    iconName: 'clipboard-document',
    cardColor: '#2563EB',
    recommendedTemplate: 1,
  },
  {
    id: 4,
    prenom: 'Karim',
    nom: 'Meddah',
    titre: 'Developpeur Full Stack Python/React',
    email: 'k.meddah@email.dz',
    telephone: '+213 555 90 12 34',
    ville: 'Oran',
    linkedin: 'linkedin.com/in/kmeddah',
    accroche: 'Developpeur full stack passionne avec 7 ans d\'experience en conception d\'applications web et mobiles. Stack technique centre sur Python (Django/FastAPI) et React/Next.js. Contributeur open source.',
    formations: [
      {
        diplome: 'Master',
        specialite: 'Genie Logiciel & Systemes Distribues',
        etablissement: 'Universite USTO - Mohamed Boudiaf',
        ville: 'Oran',
        annee: '2017',
        mention: 'Tres Bien',
      },
      {
        diplome: 'Licence',
        specialite: 'Informatique - Systemes d\'Information',
        etablissement: 'Universite USTO - Mohamed Boudiaf',
        ville: 'Oran',
        annee: '2015',
        mention: 'Bien',
      },
    ],
    experiences: [
      {
        poste: 'Lead Developpeur Full Stack',
        entreprise: 'Yassir - Tech Startup',
        secteur: 'Tech / Mobilite',
        dateDebut: '2021',
        dateFin: 'Present',
        description: 'Architecture et developpement du back-office en Django + React. Mise en place de pipelines CI/CD (GitHub Actions, Docker). Mentorat de 4 developpeurs juniors.',
      },
      {
        poste: 'Developpeur Backend Python',
        entreprise: 'Emploitic.com',
        secteur: 'RH / Job Board',
        dateDebut: '2019',
        dateFin: '2021',
        description: 'Developpement d\'APIs REST avec FastAPI. Integration de services de matching CV/offres avec NLP. Optimisation des requetes PostgreSQL.',
      },
      {
        poste: 'Developpeur Web Junior',
        entreprise: 'Icosnet - ESN',
        secteur: 'Services Numeriques',
        dateDebut: '2017',
        dateFin: '2019',
        description: 'Developpement de sites et applications web en Django. Integration frontend avec Bootstrap et jQuery.',
      },
    ],
    competences: ['Python', 'Django', 'FastAPI', 'React', 'Next.js', 'TypeScript', 'PostgreSQL', 'Docker', 'CI/CD', 'API REST', 'Git', 'Agile/Scrum'],
    langues: [
      { langue: 'Arabe', niveau: 'Natif' },
      { langue: 'Francais', niveau: 'Courant' },
      { langue: 'Anglais', niveau: 'Courant' },
    ],
    logiciels: ['VS Code', 'Docker', 'Git/GitHub', 'Postman', 'Jira', 'Figma', 'Linux', 'AWS'],
    iconName: 'command-line',
    cardColor: '#00D4FF',
    recommendedTemplate: 5,
  },
  {
    id: 5,
    prenom: 'Nadia',
    nom: 'Boukherroub',
    titre: 'Infirmiere Coordinatrice - Soins Intensifs',
    email: 'n.boukherroub@email.dz',
    telephone: '+213 555 56 78 90',
    ville: 'Setif',
    linkedin: 'linkedin.com/in/nboukherroub',
    accroche: 'Infirmiere coordinatrice diplomee d\'Etat avec 11 ans d\'experience en soins intensifs et reanimation. Expertise en coordination d\'equipes soignantes et protocoles de soins critiques.',
    formations: [
      {
        diplome: 'Diplome d\'Etat',
        specialite: 'Infirmiere de Sante Publique',
        etablissement: 'INFSPM - Institut National de Formation Superieure Paramedicale',
        ville: 'Setif',
        annee: '2013',
        mention: 'Tres Bien',
      },
      {
        diplome: 'Certificat',
        specialite: 'Soins Intensifs et Reanimation',
        etablissement: 'CHU Setif - Formation Continue',
        ville: 'Setif',
        annee: '2015',
        mention: '',
      },
    ],
    experiences: [
      {
        poste: 'Infirmiere Coordinatrice - Reanimation',
        entreprise: 'CHU Setif - Centre Hospitalier Universitaire',
        secteur: 'Sante Publique',
        dateDebut: '2019',
        dateFin: 'Present',
        description: 'Coordination d\'une equipe de 18 infirmieres en service de reanimation polyvalente (12 lits). Mise en place de protocoles de soins standardises.',
      },
      {
        poste: 'Infirmiere Specialisee - Soins Intensifs',
        entreprise: 'CHU Setif',
        secteur: 'Sante Publique',
        dateDebut: '2015',
        dateFin: '2019',
        description: 'Prise en charge de patients en soins critiques. Administration de traitements complexes (ventilation mecanique, catecholamines).',
      },
      {
        poste: 'Infirmiere de Soins Generaux',
        entreprise: 'EPH Setif - Etablissement Public Hospitalier',
        secteur: 'Sante Publique',
        dateDebut: '2013',
        dateFin: '2015',
        description: 'Soins infirmiers en service de medecine interne. Administration de traitements et surveillance des patients.',
      },
    ],
    competences: ['Soins Intensifs', 'Reanimation', 'Coordination d\'Equipe', 'Protocoles de Soins', 'Ventilation Mecanique', 'Formation Continue', 'Hygiene Hospitaliere', 'Qualite des Soins', 'Gestion de Planning', 'Accompagnement Patient'],
    langues: [
      { langue: 'Arabe', niveau: 'Natif' },
      { langue: 'Francais', niveau: 'Courant' },
      { langue: 'Anglais', niveau: 'Technique' },
    ],
    logiciels: ['Dossier Patient Informatise', 'Microsoft Office', 'Planning Hospitalier', 'Logiciel de Pharmacie'],
    iconName: 'heart',
    cardColor: '#1ABC9C',
    recommendedTemplate: 4,
  },
];
