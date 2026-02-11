/**
 * Explore ZeroBias Role Categories and Roles
 *
 * Run with: npx tsx scripts/explore-role-categories.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_API_HOSTNAME - ZeroBias API host
 *   NEXT_PUBLIC_API_KEY - API key for auth
 */

import axios from 'axios';

const API_HOST = process.env.NEXT_PUBLIC_API_HOSTNAME || process.env.NEXT_PUBLIC_ZEROBIAS_HOST;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;

if (!API_HOST || !API_KEY) {
  console.error('Missing required env vars: NEXT_PUBLIC_API_HOSTNAME (or NEXT_PUBLIC_ZEROBIAS_HOST) and NEXT_PUBLIC_API_KEY');
  process.exit(1);
}

if (!ORG_ID) {
  console.error('Missing NEXT_PUBLIC_DEFAULT_ORG_ID env var');
  process.exit(1);
}

const api = axios.create({
  baseURL: API_HOST.includes('/api') ? API_HOST : `${API_HOST}/api`,
  headers: {
    'Authorization': `APIKey ${API_KEY}`,
    'Content-Type': 'application/json',
    'Dana-Org-Id': ORG_ID,
  },
});

interface RoleCategory {
  id: string;
  ownerId: string;
  name: string;
  code: string;
  externalCode: string;
  description?: string;
  packageCode?: string;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  roleCategoryId?: string;
  packageCode?: string;
}

interface Qualification {
  id: string;
  name: string;
  description?: string;
  code: string;
  qualificationType: 'knowledge' | 'skill';
  packageCode?: string;
}

interface PagedResults<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
}

async function explore() {
  console.log('Fetching Role Categories from ZeroBias...\n');
  console.log(`API Host: ${API_HOST}\n`);

  try {
    // Fetch all role categories
    const categoriesRes = await api.get<PagedResults<RoleCategory>>('/platform/catalog/roleCategories', {
      params: { pageSize: 100 }
    });

    const categories = categoriesRes.data.items || categoriesRes.data;
    console.log(`Found ${Array.isArray(categories) ? categories.length : 'unknown'} Role Categories\n`);
    console.log('='.repeat(80));

    // Filter to NICE categories if packageCode is available
    const niceCategories = Array.isArray(categories)
      ? categories.filter(c => c.packageCode === 'nist.nice.role')
      : [];

    const otherCategories = Array.isArray(categories)
      ? categories.filter(c => c.packageCode !== 'nist.nice.role')
      : [];

    if (niceCategories.length > 0) {
      console.log('\n📋 NIST NICE Role Categories:\n');
      for (const cat of niceCategories) {
        console.log(`  [${cat.code}] ${cat.name}`);
        console.log(`      ID: ${cat.id}`);
        if (cat.description) {
          console.log(`      Description: ${cat.description.substring(0, 100)}${cat.description.length > 100 ? '...' : ''}`);
        }
        console.log('');
      }
    }

    if (otherCategories.length > 0) {
      console.log('\n📋 Other Role Categories:\n');
      for (const cat of otherCategories) {
        console.log(`  [${cat.code || 'no-code'}] ${cat.name}`);
        console.log(`      ID: ${cat.id}`);
        console.log(`      Package: ${cat.packageCode || 'none'}`);
        console.log('');
      }
    }

    // Now fetch roles for each NICE category to see the granularity
    if (niceCategories.length > 0) {
      console.log('='.repeat(80));
      console.log('\n🔍 Roles within each NICE Category:\n');

      for (const cat of niceCategories) { // Show all categories
        console.log(`\n━━━ ${cat.name} (${cat.code}) ━━━\n`);

        try {
          const rolesRes = await api.get<PagedResults<Role>>('/platform/catalog/roles', {
            params: {
              roleCategoryId: cat.id,
              pageSize: 50
            }
          });

          const roles = rolesRes.data.items || rolesRes.data;
          if (Array.isArray(roles) && roles.length > 0) {
            for (const role of roles) {
              console.log(`    • [${role.code}] ${role.name}`);
              if (role.description) {
                console.log(`      ${role.description.substring(0, 120)}${role.description.length > 120 ? '...' : ''}`);
              }
            }
            console.log(`\n    Total: ${roles.length} roles`);
          } else {
            console.log('    (no roles found)');
          }
        } catch (err: any) {
          console.log(`    Error fetching roles: ${err.message}`);
        }
      }

    }

    // Fetch NICE Skills (Qualifications with type 'skill')
    console.log('='.repeat(80));
    console.log('\n🎯 NICE Skills (Qualifications - type: skill):\n');

    try {
      const skillsRes = await api.get<PagedResults<Qualification>>('/platform/catalog/roleQualifications', {
        params: {
          qualificationType: 'skill',
          pageSize: 200
        }
      });

      const skills = skillsRes.data.items || skillsRes.data;
      if (Array.isArray(skills) && skills.length > 0) {
        console.log(`  Found ${skills.length} NICE Skills:\n`);

        // Show first 30 as sample
        for (const skill of skills.slice(0, 30)) {
          const displayText = skill.description || skill.name;
          console.log(`    [${skill.code}] ${displayText.substring(0, 100)}${displayText.length > 100 ? '...' : ''}`);
        }

        if (skills.length > 30) {
          console.log(`\n    ... and ${skills.length - 30} more skills`);
        }
      } else {
        console.log('  No skills found');
      }
    } catch (err: any) {
      console.log(`  Error fetching skills: ${err.message}`);
    }

    // Fetch NICE Knowledge
    console.log('\n' + '='.repeat(80));
    console.log('\n📚 NICE Knowledge (Qualifications - type: knowledge):\n');

    try {
      const knowledgeRes = await api.get<PagedResults<Qualification>>('/platform/catalog/roleQualifications', {
        params: {
          qualificationType: 'knowledge',
          pageSize: 200
        }
      });

      const knowledge = knowledgeRes.data.items || knowledgeRes.data;
      if (Array.isArray(knowledge) && knowledge.length > 0) {
        console.log(`  Found ${knowledge.length} NICE Knowledge items:\n`);

        // Show first 20 as sample
        for (const k of knowledge.slice(0, 20)) {
          const displayText = k.description || k.name;
          console.log(`    [${k.code}] ${displayText.substring(0, 100)}${displayText.length > 100 ? '...' : ''}`);
        }

        if (knowledge.length > 20) {
          console.log(`\n    ... and ${knowledge.length - 20} more knowledge items`);
        }
      } else {
        console.log('  No knowledge found');
      }
    } catch (err: any) {
      console.log(`  Error fetching knowledge: ${err.message}`);
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary:\n');
    console.log(`  Total Role Categories: ${Array.isArray(categories) ? categories.length : 'N/A'}`);
    console.log(`  NICE Categories: ${niceCategories.length}`);
    console.log(`  Other Categories: ${otherCategories.length}`);
    console.log('\nNICE Framework Structure:');
    console.log('  - Role Categories = high-level groupings (e.g., "Oversight and Governance")');
    console.log('  - Roles = work role titles (e.g., "Security Architect", "Incident Response")');
    console.log('  - Skills (S####) = actual skills/abilities');
    console.log('  - Knowledge (K####) = knowledge areas');

  } catch (error: any) {
    console.error('Error fetching data:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('\nAuthentication failed. Check your API key.');
    }
  }
}

explore();
