# Plan 020: Adaptive Assessments

**Status:** ~~Cancelled~~ — ZB platform feature, not SME Mart
**Phase:** N/A
**Depends on:** N/A
**Source:** Joe Llamas feedback (2026-02-25) — Joe's team built adaptive assessment quizzes for provider vetting.

> **Cancelled (2026-02-25):** Joe clarified that assessments should live in the **ZB user profile** as a platform-level feature, not in SME Mart. Joe wants to extend the ZB user profile to include assessments, credentials (Credly), avatar (Ready Player Me), and activity history/memory. SME Mart will **consume** assessment data from the ZB platform, not build its own assessment system. Pending discussion with Kevin at standup (2026-02-26).

---

## Purpose

Provider vetting via adaptive quizzes that scale difficulty based on correct answers. Buyers need confidence that providers actually have the expertise they claim. Self-declared skills on a profile aren't enough — assessments provide verified competency signals.

## What We Know (from Joe's Feedback)

1. **Adaptive difficulty** — quizzes increase difficulty when answers are correct, decrease when wrong
2. **Used for provider vetting** — not general-purpose quizzes, specifically for validating SME competency
3. **Tied to expertise areas** — assessments validate specific skills/roles/frameworks (maps to ZeroBias Catalog items)
4. **Results displayed on profiles** — assessment pass/score visible to buyers on provider cards and detail pages
5. **Joe's team has built this** — he's sending implementation details so we can recreate in Angular

## Architecture

### Data Model (new Neon tables)

```sql
-- Assessment templates: what gets assessed
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  -- Link to ZeroBias Catalog for what this assesses
  catalog_type VARCHAR(50),           -- 'role', 'skill', 'framework', 'product'
  catalog_item_id VARCHAR(255),       -- ZeroBias catalog ID
  catalog_item_name VARCHAR(255),     -- Display name (denormalized)
  -- Assessment config
  time_limit_minutes INT,             -- NULL = no limit
  passing_score DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  max_attempts INT DEFAULT 3,
  cooldown_hours INT DEFAULT 24,      -- Wait time between re-attempts
  -- Difficulty config
  initial_difficulty INT DEFAULT 2,   -- 1-5 scale, start at medium
  difficulty_increment INT DEFAULT 1, -- How much to increase on correct
  difficulty_decrement INT DEFAULT 1, -- How much to decrease on wrong
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Question bank: pool of questions per assessment
CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL DEFAULT 'multiple_choice',
    -- 'multiple_choice', 'multi_select', 'true_false', 'short_answer'
  difficulty INT NOT NULL DEFAULT 3,  -- 1-5 scale
  -- Options stored as JSON array
  -- [{"id": "a", "text": "...", "isCorrect": true}, ...]
  options JSONB,
  -- For short_answer: acceptable answers
  acceptable_answers JSONB,           -- ["answer1", "answer2"]
  explanation TEXT,                    -- Shown after answering
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assessment attempts: provider taking an assessment
CREATE TABLE assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id),
  -- Progress
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    -- 'in_progress', 'completed', 'timed_out', 'abandoned'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  -- Adaptive state
  current_difficulty INT DEFAULT 2,
  questions_answered INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  -- Results
  score DECIMAL(5,2),                 -- Percentage
  passed BOOLEAN,
  -- Responses stored as JSON array
  -- [{"questionId": "...", "selectedOption": "a", "isCorrect": true, "difficulty": 3, "timeSpent": 45}]
  responses JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Provider assessment results: latest result per provider per assessment (denormalized for display)
CREATE TABLE provider_assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id),
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  -- Latest result
  best_score DECIMAL(5,2),
  latest_score DECIMAL(5,2),
  passed BOOLEAN DEFAULT false,
  attempts_used INT DEFAULT 0,
  first_passed_at TIMESTAMP,
  last_attempted_at TIMESTAMP,
  -- Display
  badge_label VARCHAR(100),           -- e.g., "SOC 2 Certified", "NIST Expert"
  UNIQUE(provider_id, assessment_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Neon VIEWs

```sql
-- For provider cards/directory: assessment badges
CREATE VIEW v_provider_assessments AS
SELECT
  par.provider_id,
  COALESCE(
    json_agg(json_build_object(
      'assessmentId', par.assessment_id,
      'title', a.title,
      'catalogType', a.catalog_type,
      'catalogItemName', a.catalog_item_name,
      'passed', par.passed,
      'bestScore', par.best_score,
      'badgeLabel', par.badge_label,
      'firstPassedAt', par.first_passed_at
    )) FILTER (WHERE par.passed = true),
    '[]'
  ) AS passed_assessments,
  COUNT(*) FILTER (WHERE par.passed = true) AS passed_count
FROM provider_assessment_results par
JOIN assessments a ON par.assessment_id = a.id
GROUP BY par.provider_id;
```

### Services

```typescript
// assessment.service.ts
@Injectable({ providedIn: 'root' })
export class AssessmentService {
  // Assessment catalog
  listAssessments(filters?: { catalogType?: string; isActive?: boolean }): Observable<Assessment[]>
  getAssessment(id: string): Observable<Assessment>

  // Taking assessments (provider flow)
  startAttempt(assessmentId: string, providerId: string): Observable<AssessmentAttempt>
  getNextQuestion(attemptId: string): Observable<AssessmentQuestion>  // Adaptive selection
  submitAnswer(attemptId: string, questionId: string, answer: string | string[]): Observable<AnswerResult>
  completeAttempt(attemptId: string): Observable<AttemptResult>

  // Results (display on profiles)
  getProviderResults(providerId: string): Observable<ProviderAssessmentResult[]>
  getProviderBadges(providerId: string): Observable<AssessmentBadge[]>  // Passed only

  // Admin
  createAssessment(data: CreateAssessmentDto): Observable<Assessment>
  updateAssessment(id: string, data: UpdateAssessmentDto): Observable<Assessment>
  addQuestion(assessmentId: string, data: CreateQuestionDto): Observable<AssessmentQuestion>
  updateQuestion(id: string, data: UpdateQuestionDto): Observable<AssessmentQuestion>
  deleteQuestion(id: string): Observable<void>
  getAssessmentStats(assessmentId: string): Observable<AssessmentStats>
}
```

### Adaptive Algorithm (Client-Side)

```typescript
// Core adaptive logic
function selectNextQuestion(
  questionPool: AssessmentQuestion[],
  currentDifficulty: number,
  answeredIds: Set<string>
): AssessmentQuestion | null {
  // Filter out already-answered questions
  const available = questionPool.filter(q => !answeredIds.has(q.id) && q.isActive);
  if (available.length === 0) return null;

  // Find questions at current difficulty level
  let candidates = available.filter(q => q.difficulty === currentDifficulty);

  // If none at exact level, expand search ±1
  if (candidates.length === 0) {
    candidates = available.filter(q =>
      Math.abs(q.difficulty - currentDifficulty) <= 1
    );
  }

  // If still none, take any remaining
  if (candidates.length === 0) candidates = available;

  // Random selection from candidates
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function adjustDifficulty(
  current: number,
  isCorrect: boolean,
  increment: number,
  decrement: number
): number {
  const next = isCorrect ? current + increment : current - decrement;
  return Math.max(1, Math.min(5, next));  // Clamp to 1-5
}
```

### UI Components

#### Provider-Facing

| Component | Purpose |
|-----------|---------|
| `AssessmentListComponent` | Browse available assessments for the provider to take |
| `AssessmentTakeComponent` | The quiz-taking UI: question display, answer selection, timer, progress bar |
| `AssessmentResultComponent` | Result summary after completing: score, pass/fail, breakdown by difficulty |
| `AssessmentBadgeComponent` | Small badge chip displayed on provider cards/profiles (passed assessments) |
| `MyAssessmentsComponent` | Provider's assessment history (attempts, scores, next retake available) |

#### Admin-Facing

| Component | Purpose |
|-----------|---------|
| `AdminAssessmentsComponent` | List all assessments with stats (attempts, pass rate, avg score) |
| `AdminAssessmentEditorComponent` | Create/edit assessment: title, description, config, catalog link |
| `AdminQuestionEditorComponent` | Add/edit questions: text, options, difficulty, explanation |
| `AdminQuestionBankComponent` | Manage question pool for an assessment with difficulty distribution chart |

#### Integration Points (Existing Components)

| Existing Component | Change |
|-------------------|--------|
| `ProviderCard` | Add assessment badge chips (passed assessments) |
| `ProviderDetail` | Add "Verified Expertise" section showing passed assessments with scores |
| `ProfileSidebar` | Add "My Assessments" nav item |
| `AdminPanel` | Add "Assessments" tab |
| `v_provider_directory` | Update to include assessment data from `v_provider_assessments` |

### Routes

```typescript
// New routes
{ path: 'assessments', component: AssessmentListComponent },            // Browse assessments
{ path: 'assessments/:id/take', component: AssessmentTakeComponent },   // Take quiz
{ path: 'assessments/:id/result', component: AssessmentResultComponent }, // View result

// My profile sub-routes
{ path: 'my-profile/assessments', component: MyAssessmentsComponent },  // My assessment history

// Admin sub-routes
{ path: 'admin/assessments', component: AdminAssessmentsComponent },
{ path: 'admin/assessments/:id', component: AdminAssessmentEditorComponent },
```

### Assessment-Taking Flow

```
Provider browses assessments
  → Clicks "Take Assessment" on a relevant one
  → System checks: attempts remaining? cooldown expired?
  → Creates new attempt record (status: in_progress)
  → Loads question pool for the assessment
  → Selects first question at initial_difficulty level

Quiz loop:
  → Display question + options + timer (if time-limited)
  → Provider selects answer → Submit
  → System grades answer (client-side for speed, server records)
  → Adjust difficulty: correct → harder, wrong → easier
  → Select next question at new difficulty
  → Repeat until: question pool exhausted OR time limit hit

Completion:
  → Calculate final score (correct / total × 100)
  → Determine pass/fail against passing_score
  → Update provider_assessment_results (best_score, passed, badge_label)
  → Show result summary with breakdown
  → If passed: badge appears on provider profile immediately
```

## Open Questions (Awaiting Joe's Doc)

1. **Question count per assessment** — fixed (e.g., always 20 questions) or until pool exhausted?
2. **Difficulty scale** — 1-5 sufficient or finer granularity (1-10)?
3. **Question types** — just multiple choice, or also multi-select, true/false, short answer, scenario-based?
4. **Scoring model** — simple percentage, or weighted by difficulty level (harder questions worth more)?
5. **Badge display** — just pass/fail, or show actual score? Tiers (Bronze/Silver/Gold)?
6. **Question authoring** — who creates questions? Admin only, or can community contribute?
7. **Assessment catalog** — one assessment per NICE skill/role, or custom groupings?
8. **Proctoring** — any anti-cheat measures (tab-switch detection, time-per-question limits)?
9. **Expiration** — do passed assessments expire and need re-certification?

## Verification

1. Admin can create an assessment linked to a ZB Catalog skill
2. Admin can add questions with varying difficulty levels (1-5)
3. Provider can browse available assessments
4. Provider can take a quiz — questions adapt difficulty based on answers
5. Score calculated correctly, pass/fail determined
6. Passed assessment shows as badge on provider card and detail page
7. Cooldown period enforced between re-attempts
8. Admin can see assessment stats (attempts, pass rate, avg score)

---

## Dependencies

- Joe's LLM doc with implementation details (AWAITING)
- New Neon tables (4 tables, 1 VIEW)
- Assessment question content (need to seed with real compliance/security questions)
