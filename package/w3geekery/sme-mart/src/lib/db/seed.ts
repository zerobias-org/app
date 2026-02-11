import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// =============================================================================
// SEED DATA INTERFACES
// =============================================================================

interface SeedProviderSkill {
  // ZeroBias NICE Skill ID (S#### code)
  // See: GET /platform/catalog/roleQualifications?qualificationType=skill
  zerobiasSkillId: string;
  skillName: string; // Cached display name from ZeroBias catalog
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
  yearsExperience: number;
}

interface SeedProviderFramework {
  // ZeroBias Framework ID (UUID)
  // See: GET /platform/catalog/frameworks
  zerobiasFrameworkId: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
  yearsExperience: number;
  assessorCertified?: boolean;
  implementationExperience?: boolean;
  auditExperience?: boolean;
}

interface SeedProviderProduct {
  // ZeroBias Product ID (UUID)
  // See: POST /portal/productSearch
  zerobiasProductId: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
  yearsExperience: number;
  certified?: boolean;
  certificationDetails?: string;
}

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
  skills: SeedProviderSkill[];
  frameworks?: SeedProviderFramework[];
  products?: SeedProviderProduct[];
  services: {
    title: string;
    description: string;
    category: string;
    pricingType: 'fixed' | 'hourly' | 'subscription' | 'custom';
    price: string;
    deliveryTime: string;
  }[];
}

// =============================================================================
// NICE SKILL ID REFERENCE (Sample codes from ZeroBias)
// Full list: GET /platform/catalog/roleQualifications?qualificationType=skill
// =============================================================================

const NICE_SKILLS = {
  // Programming & Development
  PROGRAMMING_LANGUAGES: 'S0257',       // Skill in using programming languages
  SCRIPTING: 'S0316',                   // Skill in scripting languages

  // Security Operations
  INCIDENT_RESPONSE: 'S0047',           // Skill in preserving evidence integrity
  SECURITY_MONITORING: 'S0020',         // Skill in developing and deploying signatures
  FORENSIC_ANALYSIS: 'S0062',           // Skill in forensic analysis

  // Risk & Compliance
  RISK_ASSESSMENT: 'S0141',             // Skill in assessing security risks
  VULNERABILITY_ASSESSMENT: 'S0137',    // Skill in conducting vulnerability assessments
  POLICY_DEVELOPMENT: 'S0027',          // Skill in developing and applying policies

  // Cloud & Infrastructure
  CLOUD_SECURITY: 'S0354',              // Skill in cloud security
  NETWORK_SECURITY: 'S0077',            // Skill in securing network communications

  // Training & Communication
  TRAINING_DEVELOPMENT: 'S0073',        // Skill in developing instructional materials
  SECURITY_AWARENESS: 'S0356',          // Skill in developing security awareness
  TECHNICAL_WRITING: 'S0059',           // Skill in technical writing

  // AI & Automation
  DATA_ANALYSIS: 'S0060',               // Skill in analyzing data
  AUTOMATION: 'S0360',                  // Skill in developing automated solutions
};

// =============================================================================
// FRAMEWORK ID REFERENCE (Sample UUIDs from ZeroBias)
// Full list: GET /platform/catalog/frameworks
// =============================================================================

const FRAMEWORKS = {
  SOC2: 'f001-soc2-framework-uuid',
  ISO27001: 'f002-iso27001-framework-uuid',
  NIST_CSF: 'f003-nist-csf-framework-uuid',
  HIPAA: 'f004-hipaa-framework-uuid',
  PCI_DSS: 'f005-pci-dss-framework-uuid',
  FEDRAMP: 'f006-fedramp-framework-uuid',
  CMMC: 'f007-cmmc-framework-uuid',
  NIST_800_53: 'f008-nist-800-53-framework-uuid',
};

// =============================================================================
// SEED DATA
// =============================================================================

// =============================================================================
// REAL USERS (by environment)
// Add your actual ZeroBias user IDs here for testing
// =============================================================================

const REAL_USERS = {
  // QA Environment
  QA_CLARK_STACER: '4cdc1b47-18cb-50b1-9a46-4a514a245c9c',
  // CI Environment
  CI_ROUGHNECK_ADMIN: 'ea998b93-d05a-5743-8fe4-0e8d383f2b0c',
};

const providers: SeedProvider[] = [
  // -------------------------------------------------------------------------
  // Real user: Clark Stacer (QA)
  // -------------------------------------------------------------------------
  {
    zerobiasUserId: REAL_USERS.QA_CLARK_STACER,
    slug: 'clark-stacer',
    displayName: 'Clark Stacer',
    headline: 'Platform Architect & Compliance Automation Expert',
    about: 'Building the future of compliance automation with ZeroBias. Expertise in platform architecture, AI agent development, and GRC tooling.',
    hourlyRate: '250.00',
    availabilityStatus: 'available',
    responseTime: 'Within 24 hours',
    totalJobsCompleted: 12,
    ratingAverage: '4.95',
    skills: [
      { zerobiasSkillId: NICE_SKILLS.AUTOMATION, skillName: 'Automated solutions', proficiencyLevel: 'expert', yearsExperience: 10 },
      { zerobiasSkillId: NICE_SKILLS.PROGRAMMING_LANGUAGES, skillName: 'Programming languages', proficiencyLevel: 'expert', yearsExperience: 20 },
      { zerobiasSkillId: NICE_SKILLS.CLOUD_SECURITY, skillName: 'Cloud security', proficiencyLevel: 'expert', yearsExperience: 8 },
    ],
    services: [
      { title: 'Platform Architecture Review', description: 'Comprehensive review of your ZeroBias platform implementation and recommendations.', category: 'Engineering', pricingType: 'fixed', price: '5000.00', deliveryTime: '2 weeks' },
      { title: 'Custom Agent Development', description: 'Build custom AI agents for compliance automation on the ZeroBias platform.', category: 'Agentic', pricingType: 'hourly', price: '250.00', deliveryTime: 'Varies' },
    ],
  },
  // -------------------------------------------------------------------------
  // Demo providers
  // -------------------------------------------------------------------------
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
      { zerobiasSkillId: NICE_SKILLS.AUTOMATION, skillName: 'Automated solutions', proficiencyLevel: 'expert', yearsExperience: 3 },
      { zerobiasSkillId: NICE_SKILLS.PROGRAMMING_LANGUAGES, skillName: 'Programming languages', proficiencyLevel: 'expert', yearsExperience: 8 },
      { zerobiasSkillId: NICE_SKILLS.DATA_ANALYSIS, skillName: 'Data analysis', proficiencyLevel: 'expert', yearsExperience: 5 },
      { zerobiasSkillId: NICE_SKILLS.SCRIPTING, skillName: 'Scripting languages', proficiencyLevel: 'expert', yearsExperience: 7 },
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
      { zerobiasSkillId: NICE_SKILLS.RISK_ASSESSMENT, skillName: 'Risk assessment', proficiencyLevel: 'expert', yearsExperience: 10 },
      { zerobiasSkillId: NICE_SKILLS.VULNERABILITY_ASSESSMENT, skillName: 'Vulnerability assessment', proficiencyLevel: 'expert', yearsExperience: 8 },
      { zerobiasSkillId: NICE_SKILLS.POLICY_DEVELOPMENT, skillName: 'Policy development', proficiencyLevel: 'expert', yearsExperience: 9 },
    ],
    frameworks: [
      { zerobiasFrameworkId: FRAMEWORKS.SOC2, proficiencyLevel: 'expert', yearsExperience: 10, assessorCertified: true, auditExperience: true },
      { zerobiasFrameworkId: FRAMEWORKS.ISO27001, proficiencyLevel: 'expert', yearsExperience: 8, assessorCertified: true, auditExperience: true },
      { zerobiasFrameworkId: FRAMEWORKS.HIPAA, proficiencyLevel: 'expert', yearsExperience: 6, implementationExperience: true, auditExperience: true },
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
      { zerobiasSkillId: NICE_SKILLS.RISK_ASSESSMENT, skillName: 'Risk assessment', proficiencyLevel: 'expert', yearsExperience: 10 },
      { zerobiasSkillId: NICE_SKILLS.POLICY_DEVELOPMENT, skillName: 'Policy development', proficiencyLevel: 'expert', yearsExperience: 7 },
      { zerobiasSkillId: NICE_SKILLS.TECHNICAL_WRITING, skillName: 'Technical writing', proficiencyLevel: 'expert', yearsExperience: 8 },
    ],
    frameworks: [
      { zerobiasFrameworkId: FRAMEWORKS.NIST_CSF, proficiencyLevel: 'expert', yearsExperience: 7, implementationExperience: true },
      { zerobiasFrameworkId: FRAMEWORKS.NIST_800_53, proficiencyLevel: 'expert', yearsExperience: 6, implementationExperience: true },
      { zerobiasFrameworkId: FRAMEWORKS.PCI_DSS, proficiencyLevel: 'intermediate', yearsExperience: 4, implementationExperience: true },
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
      { zerobiasSkillId: NICE_SKILLS.SECURITY_MONITORING, skillName: 'Security monitoring', proficiencyLevel: 'expert', yearsExperience: 6 },
      { zerobiasSkillId: NICE_SKILLS.INCIDENT_RESPONSE, skillName: 'Incident response', proficiencyLevel: 'expert', yearsExperience: 8 },
      { zerobiasSkillId: NICE_SKILLS.CLOUD_SECURITY, skillName: 'Cloud security', proficiencyLevel: 'expert', yearsExperience: 5 },
      { zerobiasSkillId: NICE_SKILLS.FORENSIC_ANALYSIS, skillName: 'Forensic analysis', proficiencyLevel: 'intermediate', yearsExperience: 4 },
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
      { zerobiasSkillId: NICE_SKILLS.TRAINING_DEVELOPMENT, skillName: 'Training development', proficiencyLevel: 'expert', yearsExperience: 7 },
      { zerobiasSkillId: NICE_SKILLS.SECURITY_AWARENESS, skillName: 'Security awareness', proficiencyLevel: 'expert', yearsExperience: 6 },
      { zerobiasSkillId: NICE_SKILLS.TECHNICAL_WRITING, skillName: 'Technical writing', proficiencyLevel: 'expert', yearsExperience: 5 },
    ],
    services: [
      { title: 'CISSP Prep Course', description: 'Structured 8-week CISSP exam preparation with practice tests and study materials.', category: 'Training', pricingType: 'fixed', price: '2500.00', deliveryTime: '8 weeks' },
      { title: 'Security Awareness Program', description: 'Custom security awareness training program with phishing simulations and metrics.', category: 'Training', pricingType: 'fixed', price: '3500.00', deliveryTime: '4 weeks' },
    ],
  },
];

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

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

    // Insert skills (references ZeroBias NICE Skills by ID)
    for (const skill of provider.skills) {
      await db.insert(schema.providerSkills).values({
        providerId: profile.id,
        zerobiasSkillId: skill.zerobiasSkillId,
        skillName: skill.skillName,
        proficiencyLevel: skill.proficiencyLevel,
        yearsExperience: skill.yearsExperience,
      });
    }
    console.log(`    + ${provider.skills.length} skills`);

    // Insert frameworks (references ZeroBias Frameworks by ID)
    if (provider.frameworks && provider.frameworks.length > 0) {
      for (const framework of provider.frameworks) {
        await db.insert(schema.providerFrameworks).values({
          providerId: profile.id,
          zerobiasFrameworkId: framework.zerobiasFrameworkId,
          proficiencyLevel: framework.proficiencyLevel,
          yearsExperience: framework.yearsExperience,
          assessorCertified: framework.assessorCertified,
          implementationExperience: framework.implementationExperience,
          auditExperience: framework.auditExperience,
        });
      }
      console.log(`    + ${provider.frameworks.length} frameworks`);
    }

    // Insert products (references ZeroBias Products by ID)
    if (provider.products && provider.products.length > 0) {
      for (const product of provider.products) {
        await db.insert(schema.providerProducts).values({
          providerId: profile.id,
          zerobiasProductId: product.zerobiasProductId,
          proficiencyLevel: product.proficiencyLevel,
          yearsExperience: product.yearsExperience,
          certified: product.certified,
          certificationDetails: product.certificationDetails,
        });
      }
      console.log(`    + ${provider.products.length} products`);
    }

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

  // Seed reviews for A1-Bob-IT
  console.log('\nSeeding reviews for A1-Bob-IT...');
  const bobProfile = await db.query.providerProfiles.findFirst({
    where: eq(schema.providerProfiles.zerobiasUserId, 'a1-bob-it'),
  });

  if (bobProfile) {
    const existingReviews = await db.query.reviews.findMany({
      where: eq(schema.reviews.providerId, bobProfile.id),
    });

    if (existingReviews.length > 0) {
      console.log(`  Skipping reviews — ${existingReviews.length} already exist`);
    } else {
      const seedReviews = [
        {
          providerId: bobProfile.id,
          reviewerZerobiasUserId: 'demo-advisor-002',
          rating: 5,
          reviewText: 'Bob built us an incredible compliance automation agent. Cut our evidence collection time by 70%. Highly recommend for any AI/compliance work.',
          approved: false,
        },
        {
          providerId: bobProfile.id,
          reviewerZerobiasUserId: 'a3-gina-auditor',
          rating: 4,
          reviewText: 'Great work on the audit bot integration. Delivered on time and was very responsive to feedback. Minor documentation gaps but overall excellent.',
          approved: false,
        },
        {
          providerId: bobProfile.id,
          reviewerZerobiasUserId: 'demo-secops-004',
          rating: 5,
          reviewText: 'Fantastic automation specialist. Built a custom SIEM integration that saved our team hours of manual work every week.',
          approved: false,
        },
        {
          providerId: bobProfile.id,
          reviewerZerobiasUserId: 'demo-trainer-005',
          rating: 3,
          reviewText: 'Decent work but scope crept a bit. Communication could be better during the project. End result was functional.',
          approved: false,
        },
      ];

      for (const review of seedReviews) {
        await db.insert(schema.reviews).values(review);
      }
      console.log(`  Created ${seedReviews.length} reviews (all pending approval)`);
    }
  } else {
    console.log('  A1-Bob-IT profile not found — skipping reviews');
  }

  // --- Seed Categories ---
  console.log('\nSeeding categories...');

  const existingCategories = await db.query.categories.findMany();
  if (existingCategories.length > 0) {
    console.log(`  Skipping categories — ${existingCategories.length} already exist`);
  } else {
    const topLevelCategories = [
      { name: 'Assessors', slug: 'assessors', description: 'Compliance assessment professionals', icon: 'assessment', sortOrder: 1 },
      { name: 'Advisors', slug: 'advisors', description: 'Compliance advisory and consulting professionals', icon: 'support_agent', sortOrder: 2 },
      { name: 'Agentic', slug: 'agentic', description: 'AI agent and automation specialists', icon: 'smart_toy', sortOrder: 3 },
      { name: 'SecOps', slug: 'secops', description: 'Security operations professionals', icon: 'security', sortOrder: 4 },
      { name: 'DevSecOps', slug: 'devsecops', description: 'Development security operations specialists', icon: 'integration_instructions', sortOrder: 5 },
      { name: 'Data Services', slug: 'data-services', description: 'Data collection and documentation services', icon: 'storage', sortOrder: 6 },
      { name: 'Training', slug: 'training', description: 'Compliance training and certification professionals', icon: 'school', sortOrder: 7 },
    ];

    const insertedTopLevel = await db.insert(schema.categories)
      .values(topLevelCategories)
      .returning();

    console.log(`  Created ${insertedTopLevel.length} top-level categories`);

    // Build a slug-to-id map for parent lookups
    const parentMap = new Map<string, string>();
    for (const cat of insertedTopLevel) {
      parentMap.set(cat.slug, cat.id);
    }

    const subcategories: { parentSlug: string; name: string; slug: string; description: string; icon: string; sortOrder: number }[] = [
      // Assessors
      { parentSlug: 'assessors', name: 'SOC 2 Assessors', slug: 'soc2-assessors', description: 'SOC 2 audit specialists', icon: 'verified', sortOrder: 1 },
      { parentSlug: 'assessors', name: 'ISO 27001 Auditors', slug: 'iso27001-auditors', description: 'ISO 27001 certification auditors', icon: 'verified', sortOrder: 2 },
      { parentSlug: 'assessors', name: 'HITRUST Assessors', slug: 'hitrust-assessors', description: 'HITRUST CSF assessment specialists', icon: 'verified', sortOrder: 3 },
      { parentSlug: 'assessors', name: 'PCI-DSS QSAs', slug: 'pci-qsas', description: 'PCI-DSS qualified security assessors', icon: 'verified', sortOrder: 4 },
      // Advisors
      { parentSlug: 'advisors', name: 'GRC Consultants', slug: 'grc-consultants', description: 'Governance, risk, and compliance consultants', icon: 'policy', sortOrder: 1 },
      { parentSlug: 'advisors', name: 'Privacy Advisors', slug: 'privacy-advisors', description: 'Data privacy and protection advisors', icon: 'privacy_tip', sortOrder: 2 },
      { parentSlug: 'advisors', name: 'Risk Analysts', slug: 'risk-analysts', description: 'Risk assessment and analysis professionals', icon: 'analytics', sortOrder: 3 },
      // Agentic
      { parentSlug: 'agentic', name: 'AI Agent Builders', slug: 'ai-agent-builders', description: 'Custom AI agent development specialists', icon: 'robot', sortOrder: 1 },
      { parentSlug: 'agentic', name: 'Prompt Engineers', slug: 'prompt-engineers', description: 'LLM prompt design and optimization experts', icon: 'code', sortOrder: 2 },
      { parentSlug: 'agentic', name: 'Automation Specialists', slug: 'automation-specialists', description: 'Workflow and process automation professionals', icon: 'settings_automation', sortOrder: 3 },
      // SecOps
      { parentSlug: 'secops', name: 'Security Analysts', slug: 'security-analysts', description: 'Security monitoring and analysis professionals', icon: 'shield', sortOrder: 1 },
      { parentSlug: 'secops', name: 'Incident Responders', slug: 'incident-responders', description: 'Security incident response specialists', icon: 'emergency', sortOrder: 2 },
      { parentSlug: 'secops', name: 'Threat Hunters', slug: 'threat-hunters', description: 'Proactive threat detection specialists', icon: 'search', sortOrder: 3 },
      // DevSecOps
      { parentSlug: 'devsecops', name: 'Secure SDLC', slug: 'secure-sdlc', description: 'Secure software development lifecycle experts', icon: 'cycle', sortOrder: 1 },
      { parentSlug: 'devsecops', name: 'CI/CD Security', slug: 'cicd-security', description: 'CI/CD pipeline security specialists', icon: 'loop', sortOrder: 2 },
      { parentSlug: 'devsecops', name: 'Container Security', slug: 'container-security', description: 'Container and orchestration security professionals', icon: 'inventory_2', sortOrder: 3 },
      // Data Services
      { parentSlug: 'data-services', name: 'Evidence Collection', slug: 'evidence-collection', description: 'Compliance evidence gathering specialists', icon: 'folder', sortOrder: 1 },
      { parentSlug: 'data-services', name: 'Data Entry', slug: 'data-entry', description: 'Compliance data entry professionals', icon: 'keyboard', sortOrder: 2 },
      { parentSlug: 'data-services', name: 'Documentation', slug: 'documentation', description: 'Policy and procedure documentation specialists', icon: 'description', sortOrder: 3 },
      // Training
      { parentSlug: 'training', name: 'Compliance Training', slug: 'compliance-training', description: 'Compliance education and training delivery', icon: 'cast_for_education', sortOrder: 1 },
      { parentSlug: 'training', name: 'Certification Prep', slug: 'certification-prep', description: 'Professional certification preparation courses', icon: 'workspace_premium', sortOrder: 2 },
      { parentSlug: 'training', name: 'Awareness Programs', slug: 'awareness-programs', description: 'Security awareness program development', icon: 'campaign', sortOrder: 3 },
    ];

    const subcategoryValues = subcategories.map(({ parentSlug, ...rest }) => ({
      ...rest,
      parentId: parentMap.get(parentSlug)!,
    }));

    const insertedSubs = await db.insert(schema.categories)
      .values(subcategoryValues)
      .returning();

    console.log(`  Created ${insertedSubs.length} subcategories`);
  }

  // --- Seed Work Requests ---
  console.log('\nSeeding work requests...');

  const existingRequests = await db.query.workRequests.findMany();
  if (existingRequests.length > 0) {
    console.log(`  Skipping work requests — ${existingRequests.length} already exist`);
  } else {
    const workRequestsData = [
      {
        buyerZerobiasUserId: 'buyer-acme-001',
        buyerZerobiasOrgId: 'org-acme-corp',
        title: 'SOC 2 Type II Assessment Support',
        description: 'Need an experienced assessor to guide our team through SOC 2 Type II certification. Looking for someone with Big 4 audit experience who can review our controls and help prepare evidence. We\'re a B2B SaaS company with 50 employees.',
        category: 'Assessors',
        budgetType: 'fixed' as const,
        budgetMin: '8000',
        budgetMax: '12000',
        timeline: '6-8 weeks',
        status: 'open' as const,
      },
      {
        buyerZerobiasUserId: 'buyer-fintech-002',
        buyerZerobiasOrgId: 'org-fintech-inc',
        title: 'NIST CSF Implementation Advisor',
        description: 'Seeking GRC consultant to help implement NIST Cybersecurity Framework. We are a mid-size financial services company looking to mature our security program. Need someone who can assess current state and build a roadmap.',
        category: 'Advisors',
        budgetType: 'hourly' as const,
        budgetMin: '150',
        budgetMax: '250',
        timeline: '3 months',
        status: 'in_progress' as const,
      },
      {
        buyerZerobiasUserId: 'buyer-startup-003',
        buyerZerobiasOrgId: 'org-startup-xyz',
        title: 'AI Agent for Compliance Evidence Collection',
        description: 'Looking for an agentic developer to build a custom AI agent that automatically collects and organizes compliance evidence from our AWS, GitHub, and Jira environments. Should integrate with ZeroBias platform.',
        category: 'Agentic',
        budgetType: 'negotiable' as const,
        budgetMin: '10000',
        budgetMax: '20000',
        timeline: '8-12 weeks',
        status: 'open' as const,
      },
      {
        buyerZerobiasUserId: 'buyer-health-004',
        buyerZerobiasOrgId: 'org-healthtech',
        title: 'ISO 27001 Gap Assessment',
        description: 'Need ISO 27001 specialist to conduct gap assessment and provide remediation roadmap. Company currently has no formal ISMS. Healthcare tech company with HIPAA requirements as well.',
        category: 'Assessors',
        budgetType: 'fixed' as const,
        budgetMin: '5000',
        budgetMax: '7500',
        timeline: '4 weeks',
        status: 'completed' as const,
      },
      {
        buyerZerobiasUserId: 'buyer-enterprise-005',
        buyerZerobiasOrgId: 'org-enterprise-co',
        title: 'Security Training Program Development',
        description: 'Create custom security awareness training program tailored to healthcare industry (HIPAA focus). Need 8-10 modules with assessments, phishing simulations, and completion tracking.',
        category: 'Training',
        budgetType: 'fixed' as const,
        budgetMin: '15000',
        budgetMax: '20000',
        timeline: '10 weeks',
        status: 'open' as const,
      },
    ];

    const insertedRequests = await db.insert(schema.workRequests)
      .values(workRequestsData)
      .returning();

    console.log(`  Created ${insertedRequests.length} work requests`);

    // --- Seed Proposals ---
    console.log('\nSeeding proposals...');

    // Get provider profiles for linking proposals
    const ginaProfile = await db.query.providerProfiles.findFirst({
      where: eq(schema.providerProfiles.slug, 'a3-gina-auditor'),
    });
    const jamesProfile = await db.query.providerProfiles.findFirst({
      where: eq(schema.providerProfiles.slug, 'james-okafor'),
    });
    const bobProfile = await db.query.providerProfiles.findFirst({
      where: eq(schema.providerProfiles.slug, 'a1-bob-it'),
    });
    const alexProfile = await db.query.providerProfiles.findFirst({
      where: eq(schema.providerProfiles.slug, 'alex-nguyen'),
    });
    const carlosProfile = await db.query.providerProfiles.findFirst({
      where: eq(schema.providerProfiles.slug, 'carlos-rivera'),
    });

    if (ginaProfile && jamesProfile && bobProfile && alexProfile) {
      const proposalsData = [
        // Request 1: SOC 2 (open) - 2 proposals
        {
          requestId: insertedRequests[0].id,
          providerId: ginaProfile.id,
          coverLetter: 'I have 10+ years of SOC 2 assessment experience, including Big 4 background. I\'ve led over 40 SOC 2 Type II assessments for SaaS companies similar to yours. My approach focuses on practical control implementation and clear evidence documentation.',
          proposedPrice: '10000',
          proposedTimeline: '7 weeks',
          status: 'pending' as const,
        },
        {
          requestId: insertedRequests[0].id,
          providerId: jamesProfile.id,
          coverLetter: 'While my primary expertise is GRC strategy, I have extensive SOC 2 advisory experience. I can guide your team through the entire process with a focus on building sustainable compliance practices.',
          proposedPrice: '11500',
          proposedTimeline: '8 weeks',
          status: 'pending' as const,
        },

        // Request 2: NIST CSF (in_progress) - 1 accepted proposal
        {
          requestId: insertedRequests[1].id,
          providerId: jamesProfile.id,
          coverLetter: 'NIST CSF implementation is my specialty. I have extensive experience in financial services and can help you build a risk-based security program aligned with your business objectives. I use a phased approach to ensure sustainable adoption.',
          proposedPrice: '200',
          proposedTimeline: '3 months',
          status: 'accepted' as const,
        },

        // Request 3: AI Agent (open) - 3 proposals
        {
          requestId: insertedRequests[2].id,
          providerId: bobProfile.id,
          coverLetter: 'This is exactly what I specialize in! I\'ve built multiple AI agents for compliance automation on the ZeroBias platform. I have deep experience with AWS, GitHub, and Jira APIs. Can provide demos of similar work.',
          proposedPrice: '15000',
          proposedTimeline: '10 weeks',
          status: 'pending' as const,
        },
        {
          requestId: insertedRequests[2].id,
          providerId: carlosProfile?.id || bobProfile.id,
          coverLetter: 'While my focus is SecOps, I have experience building automation tools and can collaborate on the security aspects of this agent. Can ensure proper security controls are built in.',
          proposedPrice: '18000',
          proposedTimeline: '12 weeks',
          status: 'withdrawn' as const,
        },

        // Request 4: ISO 27001 (completed) - 1 accepted proposal
        {
          requestId: insertedRequests[3].id,
          providerId: ginaProfile.id,
          coverLetter: 'I\'ve conducted over 20 ISO 27001 gap assessments for healthcare organizations. My deliverable includes detailed gap analysis, prioritized remediation roadmap, and implementation guidance. I also have HIPAA expertise which is relevant for your needs.',
          proposedPrice: '6500',
          proposedTimeline: '4 weeks',
          status: 'accepted' as const,
        },

        // Request 5: Training (open) - 2 proposals
        {
          requestId: insertedRequests[4].id,
          providerId: alexProfile.id,
          coverLetter: 'Security awareness training is my core expertise. I\'ve developed HIPAA-specific programs for 20+ healthcare organizations. My approach includes interactive scenarios, phishing simulations, and comprehensive assessment tracking.',
          proposedPrice: '17500',
          proposedTimeline: '10 weeks',
          status: 'pending' as const,
        },
        {
          requestId: insertedRequests[4].id,
          providerId: jamesProfile.id,
          coverLetter: 'I can develop the policy and governance framework alongside training content. My GRC background ensures the training aligns with your broader compliance objectives.',
          proposedPrice: '19000',
          proposedTimeline: '12 weeks',
          status: 'pending' as const,
        },
      ];

      const insertedProposals = await db.insert(schema.proposals)
        .values(proposalsData)
        .returning();

      console.log(`  Created ${insertedProposals.length} proposals`);
    } else {
      console.log('  Could not find all required provider profiles for proposals — skipping');
    }
  }

  // --- Seed App Settings ---
  console.log('\nSeeding app settings...');

  const existingSettings = await db.query.appSettings.findMany();
  if (existingSettings.length > 0) {
    console.log(`  Skipping app settings — ${existingSettings.length} already exist`);
  } else {
    const defaultSettings = [
      // Registration settings
      {
        key: 'registration.allowNewUsers',
        value: JSON.stringify(true),
        description: 'Allow new user registration via ZeroBias',
        category: 'registration',
      },
      {
        key: 'registration.requireEmailVerification',
        value: JSON.stringify(true),
        description: 'Require email verification for new users',
        category: 'registration',
      },
      {
        key: 'registration.requireAdminApproval',
        value: JSON.stringify(false),
        description: 'Require admin approval for new provider profiles',
        category: 'registration',
      },

      // Notification settings
      {
        key: 'notifications.emailEnabled',
        value: JSON.stringify(true),
        description: 'Send email notifications for marketplace events',
        category: 'notifications',
      },
      {
        key: 'notifications.newUserAlerts',
        value: JSON.stringify(true),
        description: 'Alert admins when new users register',
        category: 'notifications',
      },
      {
        key: 'notifications.weeklyDigest',
        value: JSON.stringify(false),
        description: 'Send weekly marketplace activity digest',
        category: 'notifications',
      },

      // Security settings
      {
        key: 'security.enforce2FAForAdmins',
        value: JSON.stringify(true),
        description: 'Require 2FA for admin users (handled by ZeroBias)',
        category: 'security',
      },
      {
        key: 'security.sessionTimeoutMinutes',
        value: JSON.stringify(30),
        description: 'Session timeout in minutes (handled by ZeroBias)',
        category: 'security',
      },
      {
        key: 'security.ipAllowlistEnabled',
        value: JSON.stringify(false),
        description: 'Enable IP allowlisting for admin access',
        category: 'security',
      },

      // Marketplace settings
      {
        key: 'marketplace.enabled',
        value: JSON.stringify(true),
        description: 'Enable marketplace functionality',
        category: 'marketplace',
      },
      {
        key: 'marketplace.allowReviews',
        value: JSON.stringify(true),
        description: 'Allow users to submit reviews for providers',
        category: 'marketplace',
      },
      {
        key: 'marketplace.autoApproveReviews',
        value: JSON.stringify(false),
        description: 'Auto-approve reviews (skip moderation)',
        category: 'marketplace',
      },
      {
        key: 'marketplace.requireVerificationBadge',
        value: JSON.stringify(false),
        description: 'Require provider verification badge to list services',
        category: 'marketplace',
      },
      {
        key: 'marketplace.maxHourlyRate',
        value: JSON.stringify(500),
        description: 'Maximum hourly rate providers can set',
        category: 'marketplace',
      },
      {
        key: 'marketplace.maxBudget',
        value: JSON.stringify(100000),
        description: 'Maximum budget for work requests',
        category: 'marketplace',
      },
    ];

    const insertedSettings = await db.insert(schema.appSettings)
      .values(defaultSettings)
      .returning();

    console.log(`  Created ${insertedSettings.length} app settings`);
  }

  console.log('\nSeed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
