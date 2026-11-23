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

// What the moving figure says as you scroll. First person, because it is Bose's own site.
export const companion = {
  home: "Hi, I'm Bose. Stay a while. I'll walk you through my work as you scroll.",
  about: 'A bit about how I got here: from leading college communities to building payment systems.',
  experience: 'By day I work on backend and payments at Juspay, from intern to PPO to full-time.',
  skills: "These are tools I use and can explain. No made-up percentage bars.",
  projects: "Here's what I've built and explored. Each is labelled honestly: product, experiment or concept.",
  ventures: 'Outside work I build products under Azhizen Solutions.',
  creator: 'I also create content about software careers, interview prep and learning.',
  achievements: 'Education, and the communities I had the chance to lead.',
  contact: "That's the tour. If something caught your eye, let's talk.",
} as const;

export const photo = '/images/bose.webp';

// Quick questions for the on-page guide chat. Answers are built from the data above.
export const chatChips = ['Who is Bose?', 'Experience', 'Skills', 'Projects', 'Education', 'Ventures', 'Contact'] as const;
