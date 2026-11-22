import type { SiteContentData } from '../types/content';

export const DEFAULT_SITE_CONTENT: SiteContentData = {
  identity: {
    brandMark: 'MRM.',
    fullName: 'MD ROBIN MIA',
    tagline: 'THINK. CREATE. BUILD. INSPIRE.',
    availabilityLabel: 'Personal Brand & Technology',
    heroLabel: 'PERSONAL BRAND & TECHNOLOGY',
    heroSubheading:
      'Exploring technology, developing digital products, learning new skills, and transforming ideas into meaningful digital experiences.',
    heroDescription:
      'Welcome to my personal digital hub. Here I document my technology interests, foundational digital skills, evolving projects, and ongoing learning journey.',
    footerDescription:
      'Personal brand, technology hub, project portfolio, and learning journal of MD Robin Mia — transforming ideas into meaningful digital experiences.',
    copyrightText: '© 2026 MD ROBIN MIA. All Rights Reserved.',
    canonicalBaseUrl: 'https://mdrobinmia.pages.dev',
  },
  aboutIntro:
    "Hello! I'm MD Robin Mia. I am a curious learner focused on technology, digital creativity, and building practical things for the web.",
  aboutSections: [
    {
      id: 'personal-introduction',
      title: 'Personal Introduction',
      content:
        'I am MD Robin Mia (MRM.) — an emerging builder and curious learner dedicated to exploring modern technology, clean design, and useful web experiences. This space serves as my central digital hub where ideas, skills, and ongoing projects live together.',
      isPlaceholder: false,
    },
    {
      id: 'my-technology-interests',
      title: 'My Technology Interests',
      content:
        'My curiosity centers on practical web tools, clean user interfaces, digital image utilities, thoughtful online discussion platforms, and applied language model workflows that simplify everyday tasks.',
      isPlaceholder: false,
    },
    {
      id: 'my-learning-journey',
      title: 'My Learning Journey',
      content:
        'I am building my technical foundation step by step—moving from everyday computer fluency and visual design into semantic HTML, responsive layouts, modern frontend concepts, and structured product thinking.',
      isPlaceholder: true,
    },
    {
      id: 'my-vision',
      title: 'My Vision',
      content:
        'To combine simplicity, intentional design, and practical technology so everyday digital products feel clearer, faster, and more human-centered.',
      isPlaceholder: true,
    },
    {
      id: 'my-goals',
      title: 'My Goals',
      content:
        'To strengthen my web development foundations, ship real-world versions of my early project concepts, and collaborate meaningfully with curious builders and learners.',
      isPlaceholder: true,
    },
  ],
  educationEntries: [
    {
      id: 'independent-digital-learning',
      period: 'Ongoing',
      title: 'Independent Web & Digital Studies',
      institutionOrContext: 'Self-Directed Learning',
      summary:
        'Studying modern web structure, typography, responsive design systems, and practical digital workflows through hands-on experimentation.',
      isPlaceholder: false,
    },
    {
      id: 'formal-education-record',
      period: 'Academic Record',
      title: 'Formal Educational Background',
      institutionOrContext: 'Details Pending Update',
      summary:
        'Verified school, college, and academic institution records will be documented here once published.',
      isPlaceholder: true,
    },
  ],
  skills: [
    {
      id: 'basic-computer-skills',
      name: 'Basic Computer Skills',
      stage: 'Current Skills',
      area: 'Foundations',
      note: 'Everyday computing workflows, file organization, troubleshooting, and digital productivity.',
    },
    {
      id: 'typing',
      name: 'Typing',
      stage: 'Current Skills',
      area: 'Communication',
      note: 'Clear, steady written communication and structured document drafting.',
    },
    {
      id: 'canva',
      name: 'Canva',
      stage: 'Current Skills',
      area: 'Visual Design',
      note: 'Creating clean layouts, social graphics, and minimal visual compositions.',
    },
    {
      id: 'facebook-social-media',
      name: 'Facebook & Social Media',
      stage: 'Current Skills',
      area: 'Digital Presence',
      note: 'Managing pages, sharing updates thoughtfully, and understanding online communities.',
    },
    {
      id: 'web-development-learning',
      name: 'Web Development Fundamentals',
      stage: 'Currently Learning',
      area: 'Web Engineering',
      note: 'Actively studying semantic HTML, CSS layout systems, responsive interfaces, and how static sites are built.',
    },
    {
      id: 'digital-creativity',
      name: 'Digital Product Thinking',
      stage: 'Currently Learning',
      area: 'Product Design',
      note: 'Learning to translate everyday problems into clear user flows, scopes, and clean digital prototypes.',
    },
    {
      id: 'ai-language-workflows',
      name: 'AI & Language Workflows',
      stage: 'Areas of Interest',
      area: 'AI Exploration',
      note: 'Exploring how structured prompts and language models can support everyday clarity and creative tools.',
    },
    {
      id: 'minimal-interface-design',
      name: 'Minimal Interface Architecture',
      stage: 'Areas of Interest',
      area: 'UI & Editorial',
      note: 'Studying Swiss editorial typography, whitespace balance, and distraction-free monochrome systems.',
    },
  ],
  projects: [
    {
      id: 'vyopic',
      slug: 'vyopic',
      name: 'Vyopic',
      shortDescription: 'Smart Photo Tools',
      overview:
        'A focused collection of practical, lightweight photo utilities designed to make everyday image adjustments fast and accessible directly from the browser.',
      category: 'Photo & Utility',
      status: 'In Development',
      websiteUrl: null,
      urlPlaceholderNote: 'Website link will be published once this project launches.',
      highlights: [
        'Fast, clutter-free photo editing workflow',
        'Minimalist black-and-white workspace',
        'Browser-first accessibility without heavy installs',
      ],
      techStack: ['HTML / CSS / JavaScript (Learning)', 'Browser UI Prototype'],
      developmentProgress: 'Early UI exploration and core tool scoping',
    },
    {
      id: 'qyopic',
      slug: 'qyopic',
      name: 'Qyopic',
      shortDescription: 'Digital Image Platform',
      overview:
        'A clean digital image platform concept centered on organizing, presenting, and discovering visual assets with clarity and speed.',
      category: 'Digital Media',
      status: 'Concept',
      websiteUrl: null,
      urlPlaceholderNote: 'Website link will be published once this project launches.',
      highlights: [
        'Curated visual browsing without noise',
        'Clean metadata presentation',
        'Built for lightweight image discovery',
      ],
      techStack: ['To be finalized (Concept Stage)'],
      developmentProgress: 'Concept definition and visual layout planning',
    },
    {
      id: 'comentosh',
      slug: 'comentosh',
      name: 'Comentosh',
      shortDescription: 'Comment-First Social Platform',
      overview:
        'An experimental social platform concept where thoughtful comments and structured dialogue take center stage over vanity metrics.',
      category: 'Social Platform',
      status: 'In Development',
      websiteUrl: null,
      urlPlaceholderNote: 'Website link will be published once this project launches.',
      highlights: [
        'Conversation-first layout',
        'Distraction-free reading and reply threads',
        'Focus on meaningful community discussion',
      ],
      techStack: ['Web Interface Design', 'Frontend Prototype (Learning)'],
      developmentProgress: 'Information architecture and discussion thread design',
    },
    {
      id: 'pasher-shop',
      slug: 'pasher-shop',
      name: 'Pasher Shop',
      shortDescription: 'Local Shop Discovery Platform',
      overview:
        'A neighborhood discovery concept connecting people with nearby local shops, essential products, and community storefronts.',
      category: 'Local Commerce',
      status: 'Concept',
      websiteUrl: null,
      urlPlaceholderNote: 'Website link will be published once this project launches.',
      highlights: [
        'Simple neighborhood store directory',
        'Clear product and location visibility',
        'Designed to support small local businesses',
      ],
      techStack: ['To be finalized (Concept Stage)'],
      developmentProgress: 'Problem framing and neighborhood directory structure',
    },
    {
      id: 'robin-llm',
      slug: 'robin-llm',
      name: 'Robin LLM',
      shortDescription: 'Language Model Project',
      overview:
        'A personal exploration into language models, prompt architecture, and helpful AI-assisted workflows tailored for everyday clarity.',
      category: 'AI & Language',
      status: 'In Development',
      websiteUrl: null,
      urlPlaceholderNote: 'Website link will be published once this project launches.',
      highlights: [
        'Structured experimentation with language tasks',
        'Focus on clear, practical human utility',
        'Iterative learning notebook and workflow study',
      ],
      techStack: ['Prompt Architecture Exploration', 'AI Workflow Research'],
      developmentProgress: 'Ongoing prompt design and practical use-case testing',
    },
    {
      id: 'lifeweb',
      slug: 'lifeweb',
      name: 'LIFEWEB',
      shortDescription: 'Digital World Platform',
      overview:
        'An ambitious unified digital world concept bringing personal spaces, creative tools, and connected experiences under one cohesive web umbrella.',
      category: 'Web Ecosystem',
      status: 'Planned',
      websiteUrl: null,
      urlPlaceholderNote: 'Website link will be published once this project launches.',
      highlights: [
        'Unified personal digital ecosystem',
        'Minimalist Swiss-inspired interface architecture',
        'Long-term modular web platform vision',
      ],
      techStack: ['To be finalized (Planned Architecture)'],
      developmentProgress: 'Long-term modular vision and ecosystem roadmap',
    },
  ],
  achievements: [
    {
      id: 'milestone-personal-space',
      group: 'Personal Milestones',
      title: 'Launching Personal Digital Space (MRM.)',
      issuerOrContext: 'Personal Initiative',
      dateLabel: '2026',
      description:
        'Established a unified personal website architecture to document ideas, technology interests, learning progress, and upcoming digital projects.',
      isPlaceholder: false,
    },
    {
      id: 'cert-archive-slot',
      group: 'Certificates Showcase',
      title: 'Certificates & Credentials',
      issuerOrContext: 'Archive',
      dateLabel: 'Upcoming',
      description:
        'Verified course certificates and skill credentials will be published in this section as they are completed.',
      isPlaceholder: true,
    },
    {
      id: 'edu-archive-slot',
      group: 'Educational Background',
      title: 'Educational Background',
      issuerOrContext: 'Academic Timeline',
      dateLabel: 'Ongoing',
      description:
        'Academic milestones and educational details will be documented here.',
      isPlaceholder: true,
    },
    {
      id: 'award-archive-slot',
      group: 'Awards & Recognition',
      title: 'Awards & Recognition',
      issuerOrContext: 'Archive',
      dateLabel: 'Upcoming',
      description:
        'Recognitions, competition highlights, and community milestones will appear here as they are earned.',
      isPlaceholder: true,
    },
  ],
  blogPosts: [
    {
      id: 'sample-post-1',
      slug: 'building-a-minimalist-digital-space',
      title: 'Why I Built a Minimalist Black-and-White Digital Space',
      excerpt:
        'Exploring how restraint, typography, and clear structure help ideas stand out without visual noise.',
      content: [
        'When designing a personal website from scratch, it is tempting to fill every corner with colors, animations, and decorative widgets. Yet the clearest digital spaces often rely on the opposite: intentional white space, legible typography, and calm contrast.',
        'Choosing a strict black-and-white palette shifts full attention to the words, ideas, and projects themselves. Without bright gradients competing for attention, every heading, project card, and paragraph carries deliberate weight.',
        'As I continue learning web development and shaping concepts like Vyopic, Comentosh, and LIFEWEB, this journal will evolve into a living notebook for real lessons learned along the way.',
      ],
      category: 'Digital Projects',
      publishDate: '2026-11-10',
      readingTimeMinutes: 3,
      featured: true,
      isSample: true,
    },
    {
      id: 'sample-post-2',
      slug: 'learning-web-development-step-by-step',
      title: 'Approaching Web Development One Fundamental at a Time',
      excerpt:
        'Focusing on structure, semantic HTML, responsive spacing, and curiosity before chasing complexity.',
      content: [
        'Starting out in web development can feel overwhelming because tools change rapidly. However, core principles—clear page structure, accessible navigation, clean typography, and responsive layouts—remain constant across every framework.',
        'Instead of rushing to build everything at once, breaking ideas into small, understandable components makes learning sustainable. Every small screen, button, and form teaches something practical about how people interact with software.',
      ],
      category: 'Web Development',
      publishDate: '2026-11-04',
      readingTimeMinutes: 4,
      featured: false,
      isSample: true,
    },
    {
      id: 'sample-post-3',
      slug: 'thinking-about-human-centered-ai-tools',
      title: 'Designing Practical Ideas Around Language Models',
      excerpt:
        'Reflecting on what makes AI concepts like Robin LLM useful in everyday digital workflows.',
      content: [
        'Technology becomes meaningful when it reduces friction rather than adding confusion. Whether exploring photo utilities or language models, the central question remains simple: does this help someone think, create, or finish a task more clearly?',
        'Projects like Robin LLM start as curiosity-driven explorations—testing how structured prompts and clean interfaces can turn complex capability into simple, reliable tools.',
      ],
      category: 'AI & Machine Learning',
      publishDate: '2026-10-28',
      readingTimeMinutes: 3,
      featured: false,
      isSample: true,
    },
    {
      id: 'sample-post-4',
      slug: 'from-idea-to-structured-project-plan',
      title: 'How to Organize Early-Stage Digital Project Ideas',
      excerpt:
        'A straightforward framework for documenting a project name, purpose, category, and realistic status.',
      content: [
        'Every digital product starts as a short note. Before writing complex code or designing dozens of screens, writing down four simple fields—Name, One-Line Purpose, Category, and Honest Status—keeps expectations grounded.',
        'Separating projects into Planned, Concept, In Development, and Live makes it easy for visitors to understand what exists today and what is actively taking shape.',
      ],
      category: 'Learning Journey',
      publishDate: '2026-10-19',
      readingTimeMinutes: 3,
      featured: false,
      isSample: true,
    },
    {
      id: 'sample-post-5',
      slug: 'minimal-tools-in-everyday-digital-life',
      title: 'Why Lightweight Browser Tools Matter',
      excerpt:
        'On the value of fast, focused web utilities for everyday tasks without clutter.',
      content: [
        'Many everyday tasks—resizing an image, organizing a note, or finding a nearby shop—do not require massive software suites. Focused web tools that open quickly and respect the user’s attention continue to stand the test of time.',
      ],
      category: 'Technology',
      publishDate: '2026-10-11',
      readingTimeMinutes: 2,
      featured: false,
      isSample: true,
    },
  ],
  contact: {
    heading: "Let's Connect",
    description: 'Have an idea, a question or want to collaborate? Feel free to get in touch.',
    email: '',
    emailIsPlaceholder: true,
    socialLinks: [
      {
        id: 'email',
        platform: 'Email',
        label: 'Direct Email',
        url: null,
        placeholderNote: 'Email address coming soon',
      },
      {
        id: 'facebook',
        platform: 'Facebook',
        label: 'Facebook',
        url: null,
        placeholderNote: 'Link coming soon',
      },
      {
        id: 'linkedin',
        platform: 'LinkedIn',
        label: 'LinkedIn',
        url: null,
        placeholderNote: 'Link coming soon',
      },
      {
        id: 'github',
        platform: 'GitHub',
        label: 'GitHub',
        url: null,
        placeholderNote: 'Link coming soon',
      },
      {
        id: 'instagram',
        platform: 'Instagram',
        label: 'Instagram',
        url: null,
        placeholderNote: 'Link coming soon',
      },
    ],
  },
};
