// HIRED: the jobs and the offer (owner, 2026-11-25). Each day is an interview
// for ONE job, the same for everyone ("one job a day"; "they can be very niche,
// like Excel tutor. Or a Chef."). Twenty questions in that job's field, five
// rounds of four, climbing from the Phone Screen to the Final Round. A miss ends
// its round, not the interview. The ending is an offer letter for the day's job,
// at a level set by the total right, with a salary from right answers and speed.
// Only a fast, perfect run gets the corner office. No question data here: this
// file is safe in a client bundle, and scripts/gen-hired.mjs reads JOBS too.

export const ROUND_NAMES = ['Phone Screen', 'Technical', 'Case Study', 'Panel', 'Final Round'];
export const ROUNDS = 5;
export const PER_ROUND = 4;
export const TOTAL_Q = ROUNDS * PER_ROUND;
export const LEVEL_NAMES = ['Entry level', 'Early career', 'Mid level', 'Senior', 'Executive'];

// key: stable id. field: the question pool, and the Careers Database topic.
// ladder: five rungs, entry to the top job. pay: [floor, ceiling] of the offer.
export const JOBS = {
  accountant: { name: 'Accountant', field: 'Accounting', ladder: ['Accounting Intern', 'Staff Accountant', 'Senior Accountant', 'Controller', 'Chief Financial Officer'], pay: [38000, 240000] },
  developer: { name: 'Software Developer', field: 'Coding', ladder: ['Coding Intern', 'Junior Developer', 'Software Engineer', 'Senior Engineer', 'Principal Engineer'], pay: [45000, 280000] },
  chef: { name: 'Chef', field: 'Culinary', ladder: ['Dishwasher', 'Line Cook', 'Sous Chef', 'Head Chef', 'Executive Chef'], pay: [30000, 140000] },
  physician: { name: 'Physician', field: 'Medicine', ladder: ['Medical Student', 'Resident', 'Attending Physician', 'Department Chief', 'Chief Medical Officer'], pay: [60000, 420000] },
  exceltutor: { name: 'Excel Tutor', field: 'Excel', ladder: ['Teaching Assistant', 'Excel Tutor', 'Senior Tutor', 'Lead Instructor', 'Head of Training'], pay: [32000, 130000] },
  analyst: { name: 'Financial Analyst', field: 'Finance', ladder: ['Finance Intern', 'Financial Analyst', 'Investment Associate', 'Vice President', 'Managing Director'], pay: [50000, 350000] },
  engineer: { name: 'Engineer', field: 'Engineering', ladder: ['Engineering Intern', 'Engineer in Training', 'Project Engineer', 'Senior Engineer, PE', 'Chief Engineer'], pay: [45000, 220000] },
  bartender: { name: 'Bartender', field: 'Bartending', ladder: ['Barback', 'Bartender', 'Head Bartender', 'Bar Manager', 'Beverage Director'], pay: [28000, 120000] },
  marketer: { name: 'Marketing Manager', field: 'Marketing', ladder: ['Marketing Intern', 'Marketing Coordinator', 'Marketing Manager', 'Brand Director', 'Chief Marketing Officer'], pay: [38000, 260000] },
  chemist: { name: 'Lab Chemist', field: 'Chemistry', ladder: ['Lab Assistant', 'Lab Technician', 'Chemist', 'Senior Scientist', 'Head of Research'], pay: [36000, 200000] },
  contractor: { name: 'General Contractor', field: 'Trades', ladder: ['Apprentice', 'Journeyman', 'Crew Lead', 'Master Builder', 'General Contractor, Own Shop'], pay: [34000, 180000] },
  pilot: { name: 'Pilot', field: 'Aviation', ladder: ['Student Pilot', 'Flight Instructor', 'First Officer', 'Captain', 'Chief Pilot'], pay: [40000, 350000] },
};

// res: per question 1 right, 0 missed, -1 skipped (a miss ends its round), null not reached.
export function rightByRound(res) {
  return Array.from({ length: ROUNDS }, (_, r) => (res || []).slice(r * PER_ROUND, r * PER_ROUND + PER_ROUND).filter((x) => x === 1).length);
}
export function levelFor(right) {
  if (right >= TOTAL_Q) return 4;
  if (right >= 15) return 3;
  if (right >= 10) return 2;
  if (right >= 5) return 1;
  return 0;
}
// Pay climbs from the job's floor to its ceiling with the score, plus up to a
// tenth more for speed once a run is at least half right. Rounded to $500.
export function salaryFor(job, right, ms) {
  const [lo, hi] = (JOBS[job] || JOBS.accountant).pay;
  const secs = Math.max(0, (ms || 0) / 1000);
  const base = lo + ((hi - lo) * 0.9 * Math.pow(right / TOTAL_Q, 1.6));
  const speed = right >= 10 ? Math.max(0, Math.min(1, (420 - secs) / 300)) * (hi - lo) * 0.1 * (right / TOTAL_Q) : 0;
  return Math.round((base + speed) / 500) * 500;
}
export function offerFor(job, res, ms) {
  const J = JOBS[job] || JOBS.accountant;
  const right = (res || []).filter((x) => x === 1).length;
  const level = levelFor(right);
  return {
    job, jobName: J.name, field: J.field, right, per: rightByRound(res), level,
    title: J.ladder[level],
    salary: right > 0 ? salaryFor(job, right, ms) : 0,
    corner: right >= TOTAL_Q,
    rejected: right === 0,
  };
}
export const fmtMoney = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
