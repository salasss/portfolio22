// ============================================================
// CONTENU — données réelles (CV Salas Alkama), bilingue FR/EN.
// ============================================================
import type { Experience, Lang, NowItem, Project, Skill, SkillPole, UIStrings } from '../types'

/* ---------- i18n du chrome statique ([data-i18n]) ---------- */
const fr: UIStrings = {
  'boot.skip': 'skip ↵',
  'nav.about': 'À propos',
  'nav.skills': 'Compétences',
  'nav.experience': 'Parcours',
  'nav.work': 'Projets',
  'nav.contact': 'Contact',
  'cta.cv': 'CV',
  'hero.status': 'Ouvert aux opportunités · Cloud · DevOps · Front-end',
  'hero.scroll': 'défiler',
  'about.kicker': 'À propos',
  'about.title': 'Construire, automatiser et sécuriser la production — et bâtir l’interface.',
  'about.p1':
    "Ingénieur orienté Cloud, DevOps & DevSecOps, avec une vraie double compétence côté développement front-end (Angular / TypeScript). J'automatise, je conteneurise et je sécurise — et je sais aussi concevoir et coder l'interface.",
  'about.p2':
    "Expérience chez Mobilize Financial Services (Renault Group) sur la migration GCP et l'IaC, et chez Tech Instinct sur le front-end et les pipelines CI/CD. Je suis ouvert aux opportunités Cloud / DevOps / Front-end — n'hésite pas à me contacter.",
  'glance.location.k': 'Localisation',
  'glance.location.v': 'Île-de-France, FR',
  'glance.availability.k': 'Disponibilité',
  'glance.availability.v': 'Ouvert aux opportunités',
  'glance.languages.k': 'Langues',
  'glance.languages.v': 'FR · EN',
  'glance.focus.k': 'Focus',
  'glance.focus.v': 'Cloud · DevSecOps · FinOps',
  'kpi.k1': 'temps de chargement',
  'kpi.k2': 'projets techniques',
  'kpi.k3': 'expériences',
  'kpi.k4': 'multi-cloud',
  'skills.kicker': 'Compétences',
  'skills.title': 'Un stack qui se touche.',
  'skills.hint': 'survole une bulle pour le détail',
  'exp.kicker': 'Parcours',
  'exp.title': 'Expérience professionnelle.',
  'work.kicker': 'Projets',
  'work.title': 'Réalisations techniques.',
  'work.hint': 'clique pour le détail · glisse pour défiler →',
  'now.kicker': 'En ce moment',
  'now.title': 'Now',
  'now.engagementTitle': 'Engagement',
  'now.certifsTitle': 'Certifications',
  'contact.kicker': 'Contact',
  'contact.title': 'Travaillons ensemble.',
  'contact.lead':
    "Une alternance, un projet Cloud/DevOps, ou juste discuter infra ? Écris-moi, je réponds vite.",
  'contact.form.name': 'Nom',
  'contact.form.email': 'Email',
  'contact.form.message': 'Message',
  'contact.form.send': 'Envoyer',
  'contact.form.sending': 'Envoi…',
  'contact.form.success': 'Message envoyé — merci !',
  'contact.form.error': "Erreur d'envoi. Réessaie ou écris-moi directement.",
  'footer.madeby': 'conçu & codé from scratch',
  'footer.top': 'haut ↑',
  'copy.done': 'email copié ✓',
}

const en: UIStrings = {
  'boot.skip': 'skip ↵',
  'nav.about': 'About',
  'nav.skills': 'Skills',
  'nav.experience': 'Journey',
  'nav.work': 'Work',
  'nav.contact': 'Contact',
  'cta.cv': 'Resume',
  'hero.status': 'Open to opportunities · Cloud · DevOps · Front-end',
  'hero.scroll': 'scroll',
  'about.kicker': 'About',
  'about.title': 'Build, automate and secure production — and craft the interface.',
  'about.p1':
    'A Cloud, DevOps & DevSecOps-minded engineer with genuine front-end skills (Angular / TypeScript). I automate, containerize and secure — and I can design and build the interface too.',
  'about.p2':
    "Experience at Mobilize Financial Services (Renault Group) on GCP migration and IaC, and at Tech Instinct on front-end and CI/CD pipelines. I'm open to Cloud / DevOps / Front-end opportunities — feel free to reach out.",
  'glance.location.k': 'Location',
  'glance.location.v': 'Paris area, FR',
  'glance.availability.k': 'Availability',
  'glance.availability.v': 'Open to opportunities',
  'glance.languages.k': 'Languages',
  'glance.languages.v': 'FR · EN',
  'glance.focus.k': 'Focus',
  'glance.focus.v': 'Cloud · DevSecOps · FinOps',
  'kpi.k1': 'load time',
  'kpi.k2': 'technical projects',
  'kpi.k3': 'experiences',
  'kpi.k4': 'multi-cloud',
  'skills.kicker': 'Skills',
  'skills.title': 'A stack that connects.',
  'skills.hint': 'hover a bubble for details',
  'exp.kicker': 'Journey',
  'exp.title': 'Professional experience.',
  'work.kicker': 'Work',
  'work.title': 'Technical projects.',
  'work.hint': 'click for details · drag to scroll →',
  'now.kicker': 'Right now',
  'now.title': 'Now',
  'now.engagementTitle': 'Community',
  'now.certifsTitle': 'Certifications',
  'contact.kicker': 'Contact',
  'contact.title': "Let's build together.",
  'contact.lead':
    'A work-study role, a Cloud/DevOps project, or just to talk infra? Drop me a line, I reply fast.',
  'contact.form.name': 'Name',
  'contact.form.email': 'Email',
  'contact.form.message': 'Message',
  'contact.form.send': 'Send',
  'contact.form.sending': 'Sending…',
  'contact.form.success': 'Message sent — thanks!',
  'contact.form.error': 'Send failed. Try again or email me directly.',
  'footer.madeby': 'designed & coded from scratch',
  'footer.top': 'top ↑',
  'copy.done': 'email copied ✓',
}

export const ui: Record<Lang, UIStrings> = { fr, en }

/* ---------- Marquee stack ---------- */
export const stack: string[] = [
  'Kubernetes',
  'Terraform',
  'GCP',
  'Docker',
  'Python',
  'GitHub Actions',
  'FastAPI',
  'Jenkins',
  'Prometheus',
  'Grafana',
  'Angular',
  'Linux',
]

/* ---------- Pôles de compétences ---------- */
export const poles: SkillPole[] = [
  { key: 'cloud', label: { fr: 'Cloud & DevOps', en: 'Cloud & DevOps' }, color: '#8b5cf6' },
  { key: 'dev', label: { fr: 'Développement', en: 'Development' }, color: '#f59e0b' },
  { key: 'data', label: { fr: 'Data & ML', en: 'Data & ML' }, color: '#fb7185' },
  { key: 'hpc', label: { fr: 'HPC', en: 'HPC' }, color: '#d946ef' },
  { key: 'sec', label: { fr: 'Réseau & Sécurité', en: 'Network & Security' }, color: '#fb923c' },
]

/* ---------- Compétences (metaballs) ---------- */
const n = (f: string, e: string) => ({ fr: f, en: e })
export const skills: Skill[] = [
  // Cloud & DevOps
  { name: 'Kubernetes', pole: 'cloud', level: 5, note: n('orchestration · prod & CI/CD', 'orchestration · prod & CI/CD') },
  { name: 'Docker', pole: 'cloud', level: 5, note: n('multi-stage · Compose · Swarm', 'multi-stage · Compose · Swarm') },
  { name: 'Terraform', pole: 'cloud', level: 4, note: n('IaC · provisioning sécurisé', 'IaC · secure provisioning') },
  { name: 'GCP', pole: 'cloud', level: 4, note: n('Cloud Run · DNS · LB', 'Cloud Run · DNS · LB') },
  { name: 'GitHub Actions', pole: 'cloud', level: 4, note: n('pipelines CI/CD', 'CI/CD pipelines') },
  { name: 'Jenkins', pole: 'cloud', level: 3, note: n('automatisation de builds', 'build automation') },
  { name: 'Prometheus', pole: 'cloud', level: 3, note: n('métriques · alerting', 'metrics · alerting') },
  // Dev
  { name: 'Python', pole: 'dev', level: 5, note: n('AsyncIO · FastAPI · Pytest', 'AsyncIO · FastAPI · Pytest') },
  { name: 'TypeScript', pole: 'dev', level: 4, note: n('front from scratch · Angular', 'vanilla front · Angular') },
  { name: 'Angular', pole: 'dev', level: 4, note: n('SaaS · dashboards', 'SaaS · dashboards') },
  { name: 'Spring Boot', pole: 'dev', level: 4, note: n('CRM · JHipster', 'CRM · JHipster') },
  { name: 'FastAPI', pole: 'dev', level: 4, note: n('microservices async', 'async microservices') },
  { name: 'C / C++', pole: 'dev', level: 3, note: n('bas niveau · Karatsuba', 'low-level · Karatsuba') },
  { name: 'Bash', pole: 'dev', level: 4, note: n('scripting · automatisation', 'scripting · automation') },
  // Data & ML
  { name: 'Pandas', pole: 'data', level: 4, note: n('traitement de données', 'data processing') },
  { name: 'NumPy', pole: 'data', level: 4, note: n('calcul vectoriel', 'vectorized compute') },
  { name: 'PyTorch', pole: 'data', level: 3, note: n('deep learning', 'deep learning') },
  { name: 'MLflow', pole: 'data', level: 3, note: n('MLOps · tracking', 'MLOps · tracking') },
  { name: 'Scikit-Learn', pole: 'data', level: 3, note: n('ML classique', 'classic ML') },
  // HPC
  { name: 'MPI', pole: 'hpc', level: 4, note: n('calcul distribué', 'distributed compute') },
  { name: 'CUDA', pole: 'hpc', level: 3, note: n('GPU · NVIDIA DLI', 'GPU · NVIDIA DLI') },
  { name: 'OpenMP', pole: 'hpc', level: 3, note: n('parallélisme partagé', 'shared-memory parallelism') },
  { name: 'Slurm', pole: 'hpc', level: 3, note: n('ordonnancement cluster', 'cluster scheduling') },
  // Réseau & Sécurité
  { name: 'Keycloak', pole: 'sec', level: 4, note: n('IAM · SSO', 'IAM · SSO') },
  { name: 'Linux', pole: 'sec', level: 4, note: n('administration système', 'system administration') },
  { name: 'PostgreSQL', pole: 'sec', level: 4, note: n('bases relationnelles', 'relational databases') },
  { name: 'SSL/TLS', pole: 'sec', level: 3, note: n('chiffrement · Nginx', 'encryption · Nginx') },
  { name: 'Redis', pole: 'sec', level: 3, note: n('cache · in-memory', 'cache · in-memory') },
]

/* ---------- Expériences ---------- */
export const experiences: Experience[] = [
  {
    date: n('Mai 2026 — Présent', 'May 2026 — Present'),
    role: n('Stagiaire Ingénieur Cloud & DevOps', 'Cloud & DevOps Engineer Intern'),
    company: 'Mobilize Financial Services — Renault Group',
    location: 'Île-de-France, FR',
    tags: ['GCP', 'Terraform', 'Cloud Run', 'DNS', 'DevSecOps'],
    bullets: {
      fr: [
        'Migration Cloud (Projet CUI) : contribution à la migration des infrastructures vers Google Cloud Platform.',
        'Routage & réseau : rationalisation des zones DNS et unification des Load Balancers.',
        'Serverless : déploiement de services Cloud Run pour les redirections HTTP 301.',
        'DevSecOps : standards de sécurité et conformité au provisioning via Terraform.',
      ],
      en: [
        'Cloud migration (CUI project): contributing to migrating infrastructure to Google Cloud Platform.',
        'Routing & network: rationalizing DNS zones and unifying Load Balancers.',
        'Serverless: deploying Cloud Run services for HTTP 301 redirects.',
        'DevSecOps: security standards and compliance during Terraform provisioning.',
      ],
    },
  },
  {
    date: n('Sept. 2024 — Août 2025', 'Sept. 2024 — Aug. 2025'),
    role: n('Développeur Frontend & Intégration CI/CD', 'Frontend Developer & CI/CD'),
    company: 'Tech Instinct',
    location: 'Béjaïa, DZ',
    tags: ['Angular', 'TypeScript', 'Jenkins', 'Docker', 'n8n'],
    bullets: {
      fr: [
        'CI/CD : automatisation des pipelines avec Jenkins et Docker.',
        'Refactor d’une SaaS (FAST) en Angular/TypeScript, tests automatisés, −30 % de temps de chargement.',
        'Automatisation de workflows avec n8n et animation de formations techniques internes.',
      ],
      en: [
        'CI/CD: automated pipelines with Jenkins and Docker.',
        'Refactored a SaaS app (FAST) in Angular/TypeScript, added automated tests, −30% load time.',
        'Automated workflows with n8n and ran internal technical trainings.',
      ],
    },
  },
  {
    date: n('Oct. 2023 — Juin 2024', 'Oct. 2023 — June 2024'),
    role: n('Stage Ingénieur Fullstack (Cloud-Ready)', 'Fullstack Engineer Intern (Cloud-Ready)'),
    company: 'Tech Instinct',
    location: 'Béjaïa, DZ',
    tags: ['Spring Boot', 'Angular', 'Keycloak', 'Cloud'],
    bullets: {
      fr: [
        'Conception et développement complet d’un CRM (Spring Boot / Angular).',
        'Sécurité IAM : gestion des accès via Keycloak.',
        'Architecture modulaire facilitant la conteneurisation et le déploiement Cloud.',
      ],
      en: [
        'Full design and development of a CRM (Spring Boot / Angular).',
        'IAM security: access management via Keycloak.',
        'Modular architecture enabling containerization and Cloud deployment.',
      ],
    },
  },
]

/* ---------- Projets ---------- */
export const projects: Project[] = [
  {
    id: 'ecovision',
    index: '01',
    title: 'EcoVision',
    tagline: n('MLOps & Green AI industrialisés.', 'Industrialized MLOps & Green AI.'),
    role: n('MLOps · CI/CD · Monitoring', 'MLOps · CI/CD · Monitoring'),
    problem: n(
      'Industrialiser un modèle de vision tout en mesurant son empreinte carbone.',
      'Industrialize a vision model while measuring its carbon footprint.',
    ),
    solution: n(
      'Pipeline CI/CD complet (tests + build d’images) et monitoring métriques + énergie.',
      'Full CI/CD pipeline (tests + image build) with metrics and energy monitoring.',
    ),
    bullets: {
      fr: [
        'Workflows GitHub Actions : tests (Pytest) et build automatique d’images Docker.',
        'Monitoring via MLflow (métriques) et CodeCarbon (empreinte carbone).',
        'Détection objets temps réel avec YOLOv8 servie par FastAPI.',
      ],
      en: [
        'GitHub Actions workflows: tests (Pytest) and automatic Docker image builds.',
        'Monitoring via MLflow (metrics) and CodeCarbon (carbon footprint).',
        'Real-time object detection with YOLOv8 served by FastAPI.',
      ],
    },
    stack: ['Python', 'FastAPI', 'YOLOv8', 'MLflow', 'Docker', 'GitHub Actions'],
  },
  {
    id: 'microservices',
    index: '02',
    title: 'Cloud Native Microservices',
    tagline: n('Traitement d’images asynchrone à faible latence.', 'Low-latency async image processing.'),
    role: n('Architecture · Backend async', 'Architecture · Async backend'),
    problem: n(
      'Traiter des images à grande échelle avec une latence minimale.',
      'Process images at scale with minimal latency.',
    ),
    solution: n(
      'Service stateless AsyncIO, prêt pour Kubernetes ou Serverless.',
      'Stateless AsyncIO service, ready for Kubernetes or Serverless.',
    ),
    bullets: {
      fr: [
        'Service de traitement d’images asynchrone (AsyncIO) à faible latence.',
        'Architecture stateless optimisée pour Kubernetes ou AWS Lambda.',
        'API performante avec FastAPI + Uvicorn.',
      ],
      en: [
        'Asynchronous (AsyncIO) low-latency image processing service.',
        'Stateless architecture optimized for Kubernetes or AWS Lambda.',
        'High-performance API with FastAPI + Uvicorn.',
      ],
    },
    stack: ['Python', 'FastAPI', 'Uvicorn', 'AsyncIO'],
  },
  {
    id: 'mobilite',
    index: '03',
    title: 'Urban Mobility HPC',
    tagline: n('Simulation distribuée sur cluster.', 'Distributed simulation on a cluster.'),
    role: n('HPC · IaC', 'HPC · IaC'),
    problem: n(
      'Simuler la mobilité urbaine à grande échelle sur infrastructure distribuée.',
      'Simulate urban mobility at scale on distributed infrastructure.',
    ),
    solution: n(
      'Pipelines d’exécution hybrides (MPI + multiprocessing) déployés via Terraform.',
      'Hybrid execution pipelines (MPI + multiprocessing) deployed via Terraform.',
    ),
    bullets: {
      fr: [
        'Calcul distribué : pipelines hybrides MPI / multiprocessing sur cluster.',
        'Infrastructure as Code : déploiement via Terraform et CI/CD complet.',
        'Traitement de données avec Pandas (mpi4py).',
      ],
      en: [
        'Distributed computing: hybrid MPI / multiprocessing pipelines on a cluster.',
        'Infrastructure as Code: deployment via Terraform with full CI/CD.',
        'Data processing with Pandas (mpi4py).',
      ],
    },
    stack: ['Python', 'mpi4py', 'Pandas', 'Docker', 'Terraform', 'Linux'],
  },
  {
    id: 'docker-audit',
    index: '04',
    title: 'Container Audit',
    tagline: n('Audit automatique de Dockerfiles (DevSecOps).', 'Automatic Dockerfile auditing (DevSecOps).'),
    role: n('DevSecOps · Tooling', 'DevSecOps · Tooling'),
    problem: n(
      'Garantir la sécurité et la légèreté des images Docker en continu.',
      'Continuously ensure Docker images are secure and lightweight.',
    ),
    solution: n(
      'Outil d’audit automatique + analyse de conformité temps réel via webhooks.',
      'Automatic audit tool + real-time compliance analysis via webhooks.',
    ),
    bullets: {
      fr: [
        'Audit de Dockerfiles : migration vers Alpine, multi-stage builds.',
        'Analyse de conformité temps réel via Webhooks GitHub.',
        'Outil basé sur le Docker SDK et l’API REST.',
      ],
      en: [
        'Dockerfile auditing: Alpine migration, multi-stage builds.',
        'Real-time compliance analysis via GitHub Webhooks.',
        'Tool built on the Docker SDK and REST API.',
      ],
    },
    stack: ['Python', 'Docker SDK', 'Shell', 'REST API'],
  },
  {
    id: 'bigint',
    index: '05',
    title: 'BigInt Library',
    tagline: n('Arithmétique grands entiers optimisée en C/C++.', 'Optimized big-integer arithmetic in C/C++.'),
    role: n('HPC · Algorithmique', 'HPC · Algorithms'),
    problem: n(
      'Multiplier de très grands entiers efficacement, à la main.',
      'Multiply very large integers efficiently, by hand.',
    ),
    solution: n(
      'Gestion mémoire manuelle + algorithme de Karatsuba, profilé finement.',
      'Manual memory management + Karatsuba algorithm, finely profiled.',
    ),
    bullets: {
      fr: [
        'Optimisation bas niveau : gestion mémoire manuelle, Karatsuba.',
        'Profiling des cycles CPU et détection de fuites (Valgrind, GDB).',
      ],
      en: [
        'Low-level optimization: manual memory management, Karatsuba.',
        'CPU cycle profiling and leak detection (Valgrind, GDB).',
      ],
    },
    stack: ['C', 'C++', 'Valgrind', 'GDB'],
  },
  {
    id: 'saas',
    index: '06',
    title: 'Fullstack SaaS',
    tagline: n('Dashboards complexes en architecture composants.', 'Complex dashboards, component architecture.'),
    role: n('Fullstack', 'Fullstack'),
    problem: n(
      'Construire des tableaux de bord SaaS riches et maintenables.',
      'Build rich, maintainable SaaS dashboards.',
    ),
    solution: n(
      'Architecture en composants, back robuste, base relationnelle.',
      'Component architecture, robust backend, relational database.',
    ),
    bullets: {
      fr: [
        'Conception de dashboards complexes basés sur une architecture en composants.',
        'Back Spring Boot / JHipster, base PostgreSQL, UI Tailwind.',
      ],
      en: [
        'Designed complex dashboards based on a component architecture.',
        'Spring Boot / JHipster backend, PostgreSQL database, Tailwind UI.',
      ],
    },
    stack: ['Angular', 'TypeScript', 'Spring Boot', 'JHipster', 'PostgreSQL', 'Tailwind'],
  },
]

/* ---------- Now / Engagement / Certifs ---------- */
export const nowItems: NowItem[] = [
  { label: n('Master 1 HPC à l’UPVD (Perpignan)', 'MSc in HPC at UPVD (Perpignan)') },
  { label: n('Stage Cloud/DevOps @ Mobilize (Renault)', 'Cloud/DevOps intern @ Mobilize (Renault)') },
  { label: n('Mastère Spé. Cybersécurité @ Efrei (Sept. 2026)', 'Specialized Master in Cybersecurity @ Efrei (Sept. 2026)') },
]

export const engagementItems: NowItem[] = [
  { label: n('Nélosis — Responsable Digital & Automatisation', 'Nélosis — Head of Digital & Automation') },
  { label: n('Workflows n8n & chatbots IA (Discord)', 'n8n workflows & AI chatbots (Discord)') },
  { label: n('Intérêts : veille SRE, LeetCode, sport', 'Interests: SRE watch, LeetCode, sport') },
]

export const certifItems: NowItem[] = [
  { label: n('NVIDIA DLI — CUDA Python (en cours)', 'NVIDIA DLI — CUDA Python (in progress)') },
]
