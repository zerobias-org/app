import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

interface SeedProvider {
  zerobiasUserId: string;
  slug: string;
  displayName: string;
  headline: string;
  about: string;
  hourlyRate: string;
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  responseTime: string;
  totalJobsCompleted: number;
  ratingAverage: string;
  skills: {
    skillName: string;
    skillCategory: string;
    proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
    yearsExperience: number;
  }[];
  services: {
    title: string;
    description: string;
    category: string;
    pricingType: 'fixed' | 'hourly' | 'subscription' | 'custom';
    price: string;
    deliveryTime: string;
  }[];
}

const providers: SeedProvider[] = [
  {
    zerobiasUserId: 'a1-bob-it',
    slug: 'a1-bob-it',
    displayName: 'A1-Bob-IT',
    headline: 'AI Agent Builder & Compliance Automation Specialist',
    about: 'Full-stack developer specializing in AI agent development for compliance automation. Builds custom ZeroBias platform integrations, LLM-powered audit bots, and automated evidence collection pipelines.',
    hourlyRate: '200.00',
    availabilityStatus: 'available',
    responseTime: 'Within 4 hours',
    totalJobsCompleted: 18,
    ratingAverage: '4.90',
    skills: [
      { skillName: 'LLM / AI Agents', skillCategory: 'Agentic', proficiencyLevel: 'expert', yearsExperience: 3 },
      { skillName: 'Python', skillCategory: 'Engineering', proficiencyLevel: 'expert', yearsExperience: 8 },
      { skillName: 'ZeroBias Platform', skillCategory: 'Platform', proficiencyLevel: 'expert', yearsExperience: 2 },
    ],
    services: [
      { title: 'Custom Compliance Agent', description: 'Build a custom AI agent for your compliance workflow on the ZeroBias platform.', category: 'Agentic', pricingType: 'fixed', price: '5000.00', deliveryTime: '3 weeks' },
      { title: 'Automation Audit Bot', description: 'Automated evidence collection and audit preparation bot.', category: 'Agentic', pricingType: 'hourly', price: '200.00', deliveryTime: 'Ongoing' },
    ],
  },
  {
    zerobiasUserId: 'a3-gina-auditor',
    slug: 'a3-gina-auditor',
    displayName: 'A3-Gina-Auditor',
    headline: 'SOC 2 & ISO 27001 Lead Assessor',
    about: 'Certified lead auditor with 10+ years performing SOC 2 Type I/II, ISO 27001, and HIPAA assessments. Deep expertise in control evaluation, evidence review, and remediation guidance for SaaS and healthcare organizations.',
    hourlyRate: '175.00',
    availabilityStatus: 'available',
    responseTime: 'Within 24 hours',
    totalJobsCompleted: 42,
    ratingAverage: '4.95',
    skills: [
      { skillName: 'SOC 2', skillCategory: 'Compliance', proficiencyLevel: 'expert', yearsExperience: 10 },
      { skillName: 'ISO 27001', skillCategory: 'Compliance', proficiencyLevel: 'expert', yearsExperience: 8 },
      { skillName: 'HIPAA', skillCategory: 'Healthcare', proficiencyLevel: 'expert', yearsExperience: 6 },
    ],
    services: [
      { title: 'SOC 2 Type II Assessment', description: 'Full SOC 2 Type II assessment including control testing, evidence review, and report preparation.', category: 'Assessors', pricingType: 'fixed', price: '8000.00', deliveryTime: '6 weeks' },
      { title: 'ISO 27001 Gap Analysis', description: 'Comprehensive gap analysis against ISO 27001 controls with remediation roadmap.', category: 'Assessors', pricingType: 'hourly', price: '175.00', deliveryTime: '2 weeks' },
    ],
  },
  {
    zerobiasUserId: 'demo-advisor-002',
    slug: 'james-okafor',
    displayName: 'James Okafor',
    headline: 'GRC Strategy & Compliance Advisory',
    about: 'Strategic GRC consultant helping organizations build and mature their compliance programs. Expertise in risk management frameworks, policy development, and regulatory readiness across NIST, SOX, and PCI-DSS.',
    hourlyRate: '175.00',
    availabilityStatus: 'available',
    responseTime: 'Within 12 hours',
    totalJobsCompleted: 31,
    ratingAverage: '4.85',
    skills: [
      { skillName: 'Risk Assessment', skillCategory: 'GRC', proficiencyLevel: 'expert', yearsExperience: 10 },
      { skillName: 'NIST CSF', skillCategory: 'Compliance', proficiencyLevel: 'expert', yearsExperience: 7 },
      { skillName: 'Policy Development', skillCategory: 'GRC', proficiencyLevel: 'expert', yearsExperience: 5 },
    ],
    services: [
      { title: 'GRC Program Development', description: 'End-to-end GRC program design including governance structure, risk framework, and compliance tracking.', category: 'Advisors', pricingType: 'fixed', price: '12000.00', deliveryTime: '8 weeks' },
      { title: 'Compliance Roadmap', description: 'Strategic compliance roadmap with prioritized initiatives and timeline.', category: 'Advisors', pricingType: 'hourly', price: '175.00', deliveryTime: '2 weeks' },
    ],
  },
  {
    zerobiasUserId: 'demo-secops-004',
    slug: 'carlos-rivera',
    displayName: 'Carlos Rivera',
    headline: 'Security Operations & Incident Response',
    about: 'Seasoned SecOps professional with hands-on experience building and running security operations centers. Specializes in SIEM/SOAR deployment, incident response planning, and cloud security architecture for AWS and Azure.',
    hourlyRate: '185.00',
    availabilityStatus: 'busy',
    responseTime: 'Within 48 hours',
    totalJobsCompleted: 24,
    ratingAverage: '4.80',
    skills: [
      { skillName: 'SIEM / SOAR', skillCategory: 'SecOps', proficiencyLevel: 'expert', yearsExperience: 6 },
      { skillName: 'Incident Response', skillCategory: 'SecOps', proficiencyLevel: 'expert', yearsExperience: 8 },
      { skillName: 'Cloud Security', skillCategory: 'SecOps', proficiencyLevel: 'expert', yearsExperience: 5 },
    ],
    services: [
      { title: 'SOC Setup & Optimization', description: 'Design, build, or optimize your Security Operations Center with proper tooling and runbooks.', category: 'SecOps', pricingType: 'fixed', price: '15000.00', deliveryTime: '10 weeks' },
      { title: 'Incident Response Retainer', description: 'On-call IR support with guaranteed response SLA and post-incident reporting.', category: 'SecOps', pricingType: 'hourly', price: '185.00', deliveryTime: 'Ongoing' },
    ],
  },
  {
    zerobiasUserId: 'demo-trainer-005',
    slug: 'alex-nguyen',
    displayName: 'Alex Nguyen',
    headline: 'Compliance Training & Certification Prep',
    about: 'Training specialist focused on security awareness and professional certification preparation. Develops customized training programs, facilitates workshops, and helps teams achieve CISSP, CISA, and CompTIA Security+ certifications.',
    hourlyRate: '140.00',
    availabilityStatus: 'available',
    responseTime: 'Within 24 hours',
    totalJobsCompleted: 56,
    ratingAverage: '4.92',
    skills: [
      { skillName: 'Training Design', skillCategory: 'Training', proficiencyLevel: 'expert', yearsExperience: 7 },
      { skillName: 'CISSP', skillCategory: 'Certifications', proficiencyLevel: 'expert', yearsExperience: 5 },
      { skillName: 'Security Awareness', skillCategory: 'Training', proficiencyLevel: 'expert', yearsExperience: 6 },
    ],
    services: [
      { title: 'CISSP Prep Course', description: 'Structured 8-week CISSP exam preparation with practice tests and study materials.', category: 'Training', pricingType: 'fixed', price: '2500.00', deliveryTime: '8 weeks' },
      { title: 'Security Awareness Program', description: 'Custom security awareness training program with phishing simulations and metrics.', category: 'Training', pricingType: 'fixed', price: '3500.00', deliveryTime: '4 weeks' },
    ],
  },
];

async function seed() {
  console.log('Seeding provider profiles...\n');

  for (const provider of providers) {
    // Check if profile already exists
    const existing = await db.query.providerProfiles.findFirst({
      where: eq(schema.providerProfiles.zerobiasUserId, provider.zerobiasUserId),
    });

    if (existing) {
      console.log(`  Skipping "${provider.displayName}" — already exists (${existing.id})`);
      continue;
    }

    // Insert profile
    const [profile] = await db.insert(schema.providerProfiles)
      .values({
        zerobiasUserId: provider.zerobiasUserId,
        slug: provider.slug,
        displayName: provider.displayName,
        headline: provider.headline,
        about: provider.about,
        hourlyRate: provider.hourlyRate,
        availabilityStatus: provider.availabilityStatus,
        responseTime: provider.responseTime,
        totalJobsCompleted: provider.totalJobsCompleted,
        ratingAverage: provider.ratingAverage,
      })
      .returning();

    console.log(`  Created "${provider.displayName}" (${profile.id})`);

    // Insert skills
    for (const skill of provider.skills) {
      await db.insert(schema.providerSkills).values({
        providerId: profile.id,
        skillName: skill.skillName,
        skillCategory: skill.skillCategory,
        proficiencyLevel: skill.proficiencyLevel,
        yearsExperience: skill.yearsExperience,
      });
    }
    console.log(`    + ${provider.skills.length} skills`);

    // Insert services
    for (const service of provider.services) {
      await db.insert(schema.serviceOfferings).values({
        providerId: profile.id,
        title: service.title,
        description: service.description,
        category: service.category,
        pricingType: service.pricingType,
        price: service.price,
        deliveryTime: service.deliveryTime,
      });
    }
    console.log(`    + ${provider.services.length} services`);
  }

  console.log('\nSeed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
