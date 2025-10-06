// Debug runner: load surveystrikes.js text and evaluate evaluateStrikes against a mock participant
const fs = require('fs');
const path = require('path');
const strikesPath = path.join(__dirname, '..', 'src', 'survey', 'surveystrikes.js');
const strikesSrc = fs.readFileSync(strikesPath, 'utf8');

// Shim a minimal module environment and export Strikes
// Convert ES module export to CommonJS for eval
const transformed = strikesSrc.replace(/export\s+default\s+Strikes\s*;?/g, 'exports.default = Strikes;');
const moduleWrapper = `(function(exports, require){\n${transformed}\nreturn exports.default || exports.Strikes || Strikes;\n})`;
const fn = eval(moduleWrapper);
const Strikes = fn({}, require);

// Create mock participant where day 1 is survey day 1 (index 0) etc.
function makeParticipant({ days = 14, submitDates = {} }) {
  const data = { columns: [] };
  const participant = {
    data,
    dataDict: { isBranched: () => false, getQuestion: () => 'Q' },
    setupCycles: () => {},
    percentComplete: Array(days).fill(1),
    dates: Array(days).fill(null).map((_, i) => {
      const d = new Date(2025, 9, 5 + i); // Oct 5 + i
      return `${d.getFullYear()}-${('0'+(d.getMonth()+1)).slice(-2)}-${('0'+d.getDate()).slice(-2)}`;
    }),
    submitTimes: Array(days).fill('--:--'),
    submitDateTimes: Array(days).fill(null),
    durationDeltas: Array(days).fill(1000*60*10),
    cyclePassed: (i) => true,
    constructor: { getDays: () => days },
  };

  for (const [idx, dt] of Object.entries(submitDates)) {
    const i = parseInt(idx, 10);
    participant.submitDateTimes[i] = dt;
    participant.submitTimes[i] = `${('0'+dt.getHours()).slice(-2)}:${('0'+dt.getMinutes()).slice(-2)}`;
  }
  return participant;
}

// Test: user should do survey on Oct 5 (index 0). They submit at 01:27 on Oct 6 (index 1) and Oct5 has no submission.
const submitDate = new Date(2025, 9, 6, 1, 27); // Oct 6 01:27
const p = makeParticipant({ days: 14, submitDates: { 1: submitDate } });

const strikes = new Strikes({ mapEarlyToPrevDay: true, graceEndHour: 8 });
strikes.evaluateStrikes(p);
console.log('Strikes map:', strikes.strikes);
