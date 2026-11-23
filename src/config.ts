// Single place for personal info, links and assistant copy.
// Edit here; nothing else in the site hard-codes these values.

export const site = {
  name: 'Bose A S',
  shortName: 'Bose',
  location: 'Bengaluru, India',
  title: 'Bose A S — Engineer, Builder, Creator',
  description:
    'Portfolio of Bose A S: Product Engineer at Juspay working on backend and payment systems, and an independent builder of SaaS, AI and IoT products.',
  headline: "I don't just write code. I build things that work.",
  tagline: 'Engineer by profession. Builder by passion.',
  email: 'asbose14102004@gmail.com',
  // Put a file at public/resume.pdf and set this to true to show the link.
  hasResume: false,
};

export const socials = [
  { label: 'GitHub', href: 'https://github.com/Bose14', icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/bose-a-s-60975221b/', icon: 'linkedin' },
  { label: 'Instagram · @bose_vlogz', href: 'https://instagram.com/bose_vlogz', icon: 'instagram' },
  { label: 'Instagram · @soul_of_roomez', href: 'https://instagram.com/soul_of_roomez', icon: 'instagram' },
] as const;

export const intro = [
  "I'm an engineer who enjoys understanding how things work and figuring out how to make them better.",
  'My journey started during my engineering days. From leading developer communities in college to entering the software industry, I\'ve always enjoyed learning by building.',
  'Today, I work on backend engineering and payment-related systems while independently exploring SaaS, AI, IoT, and real-world business applications.',
  'Beyond my professional work, I enjoy experimenting with ideas, building products, and sharing what I learn.',
];

export const identities = [
  { key: 'Engineer', text: 'Building backend systems and solving technical problems.' },
  { key: 'Builder', text: 'Turning real-world problems into software products.' },
  { key: 'Creator', text: 'Exploring ideas, sharing knowledge and building businesses.' },
];

export const experience = {
  company: 'Juspay Technologies',
  role: 'Product Engineer-I',
  location: 'Bengaluru, India',
  journey: ['Internship', 'Pre-placement offer', 'Full-time'],
  context: 'LotusPay — payment infrastructure and eNACH-related workflows.',
  areas: [
    'Backend engineering',
    'Payment infrastructure',
    'eNACH integrations',
    'Merchant and sponsor-bank integration workflows',
    'API development and integration',
    'Database operations',
    'Production debugging and troubleshooting',
    'Working with Java, Ruby on Rails and Rust',
  ],
  note: 'Only publicly shareable information is listed here. No proprietary code, internal architecture or customer details.',
};

export const skills = [
  { group: 'Backend', items: ['Java', 'Ruby on Rails', 'Rust', 'Actix Web', 'REST APIs'] },
  { group: 'Data & infrastructure', items: ['MySQL', 'PostgreSQL', 'Supabase', 'Firebase', 'SQLx', 'SFTP'] },
  { group: 'Product development', items: ['Web applications', 'API integrations', 'SaaS products'] },
  { group: 'Exploring', items: ['AI engineering', 'RAG', 'AI agents', 'LLM applications', 'IoT'] },
];

export const education = {
  institution: 'KSRIET',
  degree: 'B.Tech Information Technology',
  years: '2021–2025',
  achievement: 'Best Outgoing Student — 2025',
  leadership: [
    { role: 'Web Development Lead', org: 'Google Developer Student Clubs' },
    { role: 'Campus Representative', org: 'Hack2Skill' },
    { role: 'Chapter Lead', org: 'GeeksforGeeks Student Chapter' },
  ],
};

export const venture = {
  name: 'Azhizen Solutions',
  blurb: 'A technology venture and the umbrella for my independent product experiments.',
};

export const creator = {
  blurb:
    'Alongside engineering, I share what I learn: software engineering, IT career journeys, interview preparation, fresher career guidance and personal experiences.',
  topics: [
    'Software engineering',
    'IT career journeys',
    'Interview preparation',
    'Fresher career guidance',
    'Learning and technology',
    'Personal experiences',
  ],
};

// Assistant ("Bo") — the illustrated guide that moves around the page.
export const assistant = {
  name: 'Bo',
  // Set to e.g. '/images/assistant.svg' to use your own illustration instead of the built-in one.
  avatarSrc: '',
  // side: which edge Bo stands on. level: 0 = bottom, 1 = middle, 2 = upper.
  stops: {
    hero: {
      side: 'right',
      level: 0,
      text: "Hi, I'm Bo, Bose's assistant. I'll walk you around this portfolio. Scroll down and I'll tell you what each part is about.",
    },
    intro: {
      side: 'left',
      level: 1,
      text: "Bose is an engineer who learns by building. This is the short version of his story, from college communities to the software industry.",
    },
    projects: {
      side: 'right',
      level: 1,
      text: 'These are Bose\'s featured projects. Each one is labelled as a product, experiment or concept, so you know what is real and what is still an idea. Open one for the case study.',
    },
    experience: {
      side: 'left',
      level: 0,
      text: 'Bose works at Juspay as a Product Engineer, after joining as an intern and getting a PPO. His work is backend and payments, with eNACH integrations.',
    },
    skills: {
      side: 'right',
      level: 2,
      text: 'No percentage bars here. These are the tools Bose uses and can explain. The last group is what he is currently exploring.',
    },
    ventures: {
      side: 'left',
      level: 1,
      text: 'Outside his job, Bose builds products under Azhizen Solutions. Each venture shows its current status honestly.',
    },
    achievements: {
      side: 'right',
      level: 0,
      text: 'Bose was Best Outgoing Student in 2025 and led three student communities along the way.',
    },
    creator: {
      side: 'left',
      level: 2,
      text: 'Bose also creates content about software careers, interview prep and learning. That is the creator side of him.',
    },
    contact: {
      side: 'right',
      level: 1,
      text: "That's the tour. If something caught your eye, email Bose or find him on the links below. He would like to hear from you.",
    },
  },
  pages: {
    about: 'This is the longer version of the story. I am still here if you need me.',
    projects: 'Every project, in one place. Pick one to read its case study.',
    project: 'This is a case study. Sections only appear once there is real information to show.',
    notfound: 'Oops, this page does not exist. Let me take you home.',
  },
} as const;

export type StopKey = keyof typeof assistant.stops;
