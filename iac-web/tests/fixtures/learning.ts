// Contract-shaped synthetic API fixtures. These do not claim real database evidence.
import type {
  Learning,
  LearningCycle,
  LearningDrill,
  LearningSession,
} from '../../src/features/study-plan/learning-api'

export const stamp = '2026-10-24T09:00:00Z'
export function cycleFixture(
  id = 'cycle-reading',
  section: LearningCycle['section'] = 'reading',
): LearningCycle {
  return {
    id,
    revision: 1,
    skillId:
      section === 'reading'
        ? 'ms-r-tfng'
        : section === 'writing'
          ? 'ms-w1-overview'
          : 'ms-s-part2-turn',
    section,
    status: 'needs-practice',
    source: {
      attemptId: `attempt-${section}`,
      questionId: section === 'writing' ? 'task-2' : 'question-7',
      materialId: `material-${section}`,
      versionId: 'source-v1',
      familyId: 'source-family',
      familyKnown: true,
      questionType:
        section === 'reading' ? 'true_false_not_given' : 'task_response',
      prompt:
        section === 'reading'
          ? 'All city gardens are open at night.'
          : 'Describe the main trends in the supplied data.',
      stimulus:
        section === 'reading'
          ? 'Most city gardens close at sunset. Two experimental gardens remain open after dark.'
          : 'Year | North | South\n2000 | 20 | 40\n2020 | 60 | 45',
      originalAnswer:
        section === 'reading' ? 'TRUE' : 'The North was very big.',
      feedback: 'Distinguish a general claim from the evidence in the source.',
      occurredAt: '2026-10-21T08:00:00Z',
      modality: section === 'reading' ? 'objective' : 'typed',
      provenance: {
        model: section === 'reading' ? null : 'test-evaluator',
        promptVersion: 'p1',
        rubricVersion: 'r1',
      },
    },
    viewedAt: null,
    correction: null,
    checks: [],
    skippedAt: null,
    nextDrillId: section === 'reading' ? 'drill-reading' : `drill-${section}`,
    nextCheckDate: null,
    remainingChecks: 2,
    limitations: [],
  }
}
export function drillFixture(
  section: LearningDrill['section'] = 'reading',
): LearningDrill {
  return {
    id: `drill-${section}`,
    skillId:
      section === 'reading'
        ? 'ms-r-tfng'
        : section === 'writing'
          ? 'ms-w1-overview'
          : 'ms-s-part2-turn',
    section,
    title:
      section === 'reading'
        ? 'Garden access: evidence on a new text'
        : section === 'writing'
          ? 'Task 1: write your own overview'
          : 'Speaking: develop a response',
    durationMinutes: 8,
    modality: section === 'reading' ? 'objective' : 'typed',
    familyId: 'new-family',
    version: 'drill-v1',
    introduction: 'Read the supplied material and respond in your own words.',
    stimulus:
      section === 'reading'
        ? 'The new ferry operates every day, including Sunday.'
        : 'Year | North | South\n2000 | 20 | 40\n2020 | 60 | 45',
    task:
      section === 'reading'
        ? 'The ferry operates on Sundays. TRUE / FALSE / NOT GIVEN'
        : 'Write a two-sentence overview of the supplied table.',
    rightsProvenance:
      'Original IAC synthetic test material; reviewed fixture only, not a claim of editorial approval in production.',
    editorialStatus: section === 'reading' ? 'reviewed' : 'draft',
    masteryEligible: section === 'reading',
  }
}
export function learningFixture(): Learning {
  return {
    revision: 4,
    today: '2026-10-24',
    examDate: '2026-12-12',
    readOnly: false,
    overallBand: null,
    taskPerformance: [],
    skills: [
      {
        id: 'ms-r-tfng',
        section: 'reading',
        title: 'True / False / Not Given evidence',
      },
      { id: 'ms-w1-overview', section: 'writing', title: 'Task 1 overview' },
      {
        id: 'ms-s-part2-turn',
        section: 'speaking',
        title: 'Part 2 developed response',
      },
    ],
    profiles: [
      {
        skillId: 'ms-r-tfng',
        section: 'reading',
        status: 'needs-practice',
        sourceIds: ['attempt-reading:question-7'],
        rationale:
          'A general claim was confused with source evidence in your saved answer.',
        updatedAt: stamp,
        independentFamilies: 0,
        delayedCheckPassed: false,
        remainingChecks: 2,
      },
    ],
    cycles: [cycleFixture()],
    drills: [drillFixture(), drillFixture('writing'), drillFixture('speaking')],
    inventory: {
      dailyMinutes: 45,
      sections: ['reading', 'listening', 'writing', 'speaking'].map(
        (section) => ({
          section: section as LearningDrill['section'],
          fullMaterials: 1,
          fittingMaterials: section === 'writing' ? 0 : 1,
          shortDrills: section === 'listening' ? 0 : 1,
          reviewedDrills: section === 'reading' ? 1 : 0,
          independentFamilies: section === 'reading' ? 1 : 0,
          available: section !== 'listening',
          limitations:
            section === 'reading'
              ? []
              : ['Независимая проверка сейчас недоступна.'],
        }),
      ),
      limitations: ['Counts describe practice events, never an IELTS band.'],
    },
    limitations: ['Internal practice rule; not an IELTS prediction.'],
  }
}
export function sessionFixture(
  drill = drillFixture(),
  id = 'session-reading',
): LearningSession {
  return {
    id,
    revision: 1,
    drill,
    cycleId: 'cycle-reading',
    assignmentId: null,
    status: 'in-progress',
    startedAt: stamp,
    submittedAt: null,
    text: null,
    explanation: null,
    assisted: false,
    audioAttemptId: null,
    verdict: null,
    feedback: null,
    independent: false,
    independenceReason: 'Independence is checked on submission.',
  }
}
