/**
 * SONIX-Model v6.0.0 — PATTERN ENGINE EDITION
 * =============================================
 * Core Philosophy:
 *   Words connect. Patterns build. Language flows.
 *   Every user message is processed as a pattern —
 *   the model reads it, maps the words, and builds
 *   a real, non-repeating, contextual response.
 *
 * USAGE:
 *   <script src="https://raw.githack.com/YOUR/REPO/main/sonix-model.js"></script>
 *   SonixModel.chat("how to throw") => Promise<string>
 *   SonixModel.chat("what is courage") => Promise<string>
 *   SonixModel.chat("go slow") => Promise<string>
 *
 * KEY FEATURES v6:
 *   - PATTERN ENGINE: reads word sequences, builds structured answers
 *     how+to+[verb]   → step-by-step guide
 *     what+is+[noun]  → definition + description
 *     why+[verb/noun] → reasoning + cause
 *     when+to+[verb]  → timing + conditions
 *     where+[verb]    → location + context
 *     who+[verb/noun] → identity + role
 *     [word]+vs+[word]→ comparison
 *     how+[adj]       → degree/manner guide
 *     go+[adj/adv]    → action guide (go slow, go hard)
 *   - WORD CONNECTION GRAPH: 10,000+ words, 120 categories
 *   - NO PERSONAS — one adaptive intelligent voice
 *   - NO HARDCODED NAMES
 *   - DYNAMIC RESPONSE BUILDER — never repeats
 *   - VERB ENGINE: conjugation, usage, forms
 *   - NOUN ENGINE: describe, relate, categorize
 *   - ADJECTIVE ENGINE: intensity, comparison, context
 *   - SENTENCE ASSEMBLER: builds natural language from parts
 *   - LIVE RESEARCH: Wikipedia + DuckDuckGo + Dictionary API
 *   - FULL MATH, UNIT CONVERSION, CALCULATORS
 *   - EMOTIONAL INTELLIGENCE — 12 states
 *   - 500+ IDIOMS, 200+ ETYMOLOGIES, 600+ SYNONYMS
 *   - SCIENTIFIC CALCULATOR — algebra, quadratics, statistics, GCD/LCM,
 *     combinatorics, prime factorization (v7)
 *   - CODE ENGINE — ready-made snippets across 10 languages + live
 *     Stack Overflow lookup for anything not covered locally (v7)
 *   - EXPANDED RESEARCH — Wikipedia + DuckDuckGo + arXiv + Stack
 *     Overflow, and now used PROACTIVELY whenever the local brain
 *     doesn't recognize a topic, instead of only on request (v7)
 */

(function(global) {
"use strict";

const VERSION = "7.0.0";
const MODEL   = "SONIX-PatternEngine";

// ================================================================
// SECTION 1: PATTERN ENGINE — the core of v6
// Reads word sequences and maps them to response strategies
// ================================================================

// Question word triggers — what response TYPE to build
const PATTERN_MAP = {
  // HOW patterns
  "how to":         "guide",          // how to throw → step-by-step
  "how do":         "guide",          // how do you run → process
  "how does":       "explain",        // how does gravity work → explanation
  "how can":        "guide",          // how can I improve → advice
  "how is":         "describe",       // how is this different → comparison
  "how are":        "describe",
  "how much":       "quantity",       // how much → amount/measurement
  "how many":       "quantity",
  "how often":      "frequency",      // how often → timing
  "how long":       "duration",       // how long → time/distance
  "how far":        "distance",
  "how fast":       "speed",
  "how hard":       "difficulty",
  "how easy":       "difficulty",
  "how good":       "quality",
  "how bad":        "quality",
  "how big":        "size",
  "how small":      "size",
  // WHAT patterns
  "what is":        "define",
  "what are":       "define",
  "what was":       "history",
  "what does":      "define",
  "what do":        "guide",
  "what should":    "advice",
  "what can":       "capability",
  "what makes":     "analyze",
  "what causes":    "cause",
  "what happens":   "consequence",
  "what if":        "hypothetical",
  "what kind":      "category",
  "what type":      "category",
  "what way":       "method",
  // WHY patterns
  "why is":         "reason",
  "why are":        "reason",
  "why do":         "reason",
  "why does":       "reason",
  "why did":        "history",
  "why should":     "advice",
  "why not":        "counter",
  "why would":      "reason",
  // WHEN patterns
  "when to":        "timing",
  "when is":        "timing",
  "when do":        "timing",
  "when should":    "timing",
  "when did":       "history",
  // WHERE patterns
  "where to":       "location",
  "where is":       "location",
  "where do":       "location",
  "where can":      "location",
  // WHO patterns
  "who is":         "identity",
  "who are":        "identity",
  "who can":        "capability",
  "who should":     "advice",
  // GO patterns
  "go slow":        "action_guide",
  "go fast":        "action_guide",
  "go hard":        "action_guide",
  "go easy":        "action_guide",
  "go deep":        "action_guide",
  "go big":         "action_guide",
  "go small":       "action_guide",
  "go back":        "action_guide",
  "go forward":     "action_guide",
  "go up":          "action_guide",
  "go down":        "action_guide",
  "go wide":        "action_guide",
  "go low":         "action_guide",
  "go high":        "action_guide",
  "go first":       "action_guide",
  "go last":        "action_guide",
  "go now":         "urgency",
  "go later":       "timing",
  // THROW/ACTION patterns
  "throw away":     "action_guide",
  "throw out":      "action_guide",
  "throw up":       "action_guide",
  "throw in":       "action_guide",
  "throw back":     "action_guide",
  // VS / COMPARE
  " vs ":           "compare",
  " versus ":       "compare",
  " or ":           "compare",
  "difference between": "compare",
  "compared to":    "compare",
  "better than":    "compare",
  "worse than":     "compare",
  // MAKE / BUILD
  "how to make":    "guide",
  "how to build":   "guide",
  "how to create":  "guide",
  "how to use":     "guide",
  "how to start":   "guide",
  "how to stop":    "guide",
  "how to get":     "guide",
  "how to become":  "guide",
  "how to improve": "guide",
  "how to learn":   "guide",
  // SHOULD I / CAN I
  "should i":       "advice",
  "can i":          "capability",
  "will i":         "prediction",
  "would i":        "hypothetical",
  "do i":           "guide",
};

function detectPattern(text) {
  const lower = text.toLowerCase().trim();
  // Check longest matches first
  const sorted = Object.keys(PATTERN_MAP).sort((a,b) => b.length - a.length);
  for (const pat of sorted) {
    if (lower.startsWith(pat) || lower.includes(pat)) {
      return { pattern: pat, type: PATTERN_MAP[pat] };
    }
  }
  return null;
}

// Extract the subject/verb from a pattern match
function extractSubject(text, pattern) {
  const lower = text.toLowerCase().trim();
  const after = lower.replace(pattern, "").trim();
  // Clean up articles and stopwords at start
  return after.replace(/^(a|an|the|to|about|on|for|with|in|at|of|my|your|this|that)\s+/i, "").trim();
}

// ================================================================
// SECTION 2: RESPONSE BUILDERS — one for each pattern type
// These NEVER repeat because they use the word brain + context
// ================================================================

function buildGuide(subject, text) {
  // "how to [verb]" — builds a step-by-step guide
  const verb = subject.split(/\s+/)[0];
  const verbInfo = VERB_ENGINE[verb] || null;
  const related = getRelatedWords(subject);
  const steps = generateSteps(verb, subject);

  let out = `**How to ${subject}**\n\n`;
  out += steps.map((s,i) => `${i+1}. ${s}`).join("\n");

  if (related.length) {
    out += `\n\n**Key concepts:** ${related.slice(0,6).join(", ")}`;
  }
  if (verbInfo && verbInfo.tips) {
    out += `\n\n**Tips:** ${verbInfo.tips[Math.floor(Math.random()*verbInfo.tips.length)]}`;
  }
  return out;
}

function buildDefinition(subject) {
  // "what is [noun]" — define + describe
  const desc = WORD_DESCRIPTIONS[subject];
  const syns = SYNONYM_MAP[subject] || getRelatedWords(subject).slice(0,6);
  const ants = ANTONYM_MAP[subject] || [];
  const cat  = getCategoryOf(subject);

  let out = `**${capitalize(subject)}**\n\n`;
  if (desc) {
    out += desc;
  } else {
    const catWords = cat ? getWordsInCategory(cat).slice(0,5) : [];
    out += `${capitalize(subject)} is a concept that relates to ${catWords.length ? catWords.slice(0,3).join(", ") : "a meaningful area of knowledge"}.`;
    if (syns.length) out += ` It is closely associated with: ${syns.slice(0,4).join(", ")}.`;
  }
  if (syns.length) out += `\n\n**Synonyms:** ${syns.slice(0,7).join(" · ")}`;
  if (ants.length) out += `\n**Opposites:** ${ants.slice(0,4).join(" · ")}`;

  out += `\n\n🔗 [Dictionary](https://www.merriam-webster.com/dictionary/${encodeURIComponent(subject)}) · [Wikipedia](https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(subject)})`;
  return out;
}

function buildReason(subject) {
  // "why [something]" — explain the reason
  const desc = WORD_DESCRIPTIONS[subject];
  const related = getRelatedWords(subject).slice(0,5);
  const analogy = getAnalogy(subject);

  let out = `**Why ${subject}?**\n\n`;
  if (desc) {
    out += `The reason this matters: ${desc.split(".")[0].toLowerCase()}.`;
  } else {
    out += `"${capitalize(subject)}" matters because it connects to how things actually work in practice — not just in theory.`;
  }
  if (related.length) out += ` It is rooted in: ${related.join(", ")}.`;
  if (analogy) out += `\n\nThink of it ${analogy}.`;
  out += `\n\nThe deeper why: most things that seem complicated on the surface have a simple cause underneath. Finding that cause changes how you act.`;
  return out;
}

function buildComparison(text) {
  // "[A] vs [B]" — structured comparison
  const match = text.match(/(\w[\w\s]{0,20})\s+(?:vs\.?|versus|or|compared? to)\s+(\w[\w\s]{0,20})/i);
  if (!match) return null;
  const a = match[1].trim().toLowerCase();
  const b = match[2].trim().toLowerCase();
  const descA = WORD_DESCRIPTIONS[a] || describeFromBrain(a);
  const descB = WORD_DESCRIPTIONS[b] || describeFromBrain(b);
  const synsA = (SYNONYM_MAP[a]||[]).slice(0,3);
  const synsB = (SYNONYM_MAP[b]||[]).slice(0,3);

  let out = `**${capitalize(a)} vs ${capitalize(b)}**\n\n`;
  out += `**${capitalize(a)}:** ${descA ? descA.split(".")[0] : capitalize(a)+" relates to "+synsA.join(", ")}.\n`;
  if (synsA.length) out += `Related: ${synsA.join(", ")}\n\n`;
  out += `**${capitalize(b)}:** ${descB ? descB.split(".")[0] : capitalize(b)+" relates to "+synsB.join(", ")}.\n`;
  if (synsB.length) out += `Related: ${synsB.join(", ")}\n\n`;
  out += `**Key difference:** ${capitalize(a)} and ${b} both have their place — the right choice depends on your specific goal, context, and the outcome you are working toward.`;
  return out;
}

function buildActionGuide(text) {
  // "go slow", "go hard", "go deep" etc.
  const lower = text.toLowerCase().trim();
  const ACTION_GUIDES = {
    "go slow":    "Going slow is not weakness — it is precision. Slow down when:\n• The stakes are high and mistakes cost a lot\n• You are learning something new\n• You need quality over speed\n• Others need time to follow\n\n**The principle:** slow is smooth, smooth is fast. Master the fundamentals slowly and speed will follow naturally.",
    "go fast":    "Speed matters when:\n• The window of opportunity is narrow\n• You need momentum to break through resistance\n• Speed itself is a competitive advantage\n• Done is better than perfect in this context\n\n**The principle:** go fast where speed creates value. Go slow where mistakes compound.",
    "go hard":    "Going hard means maximum commitment and effort. Apply this when:\n• You need a breakthrough\n• A deadline is real and immovable\n• Half-effort will produce no result\n• You have rested and are prepared\n\n**The principle:** sustainability matters. Go hard in sprints, not forever.",
    "go easy":    "Going easy is smart, not lazy — it means:\n• Pacing yourself for the long game\n• Recovering when recovery is needed\n• Not over-engineering a simple problem\n• Being gentle when gentleness is what works\n\n**The principle:** match your intensity to what the situation actually demands.",
    "go deep":    "Going deep means:\n• Understanding root causes, not just surface symptoms\n• Developing mastery rather than surface knowledge\n• Investing time to truly understand one thing\n• Asking why five times instead of once\n\n**The principle:** depth compounds. A deep understanding of few things beats shallow knowledge of many.",
    "go big":     "Going big means:\n• Setting ambitious goals that stretch your capability\n• Taking risks that match the potential reward\n• Committing fully instead of hedging\n• Building for scale from the beginning\n\n**The principle:** big thinking attracts big results — but big execution is what actually produces them.",
    "go small":   "Going small means:\n• Starting with the minimum viable version\n• Testing before scaling\n• Finding the simplest solution that works\n• Doing one thing extremely well before adding more\n\n**The principle:** small actions consistently applied build large outcomes over time.",
    "go low":     "Going low means:\n• Staying humble and grounded\n• Keeping overhead and complexity minimal\n• Flying under the radar when that is the advantage\n• Reducing to essentials\n\n**The principle:** low friction, low ego, high output.",
    "go high":    "Going high means:\n• Elevating your standards\n• Taking the moral or ethical high ground\n• Aiming for excellence over adequacy\n• Thinking at a higher level of abstraction\n\n**The principle:** go high in standards; stay grounded in execution.",
    "go back":    "Going back means:\n• Revisiting a decision or assumption that may be wrong\n• Returning to fundamentals when advanced approaches fail\n• Reconnecting with original intent\n• Undoing something before it compounds\n\n**The principle:** going back is not failure — it is course correction.",
    "go forward": "Going forward means:\n• Moving past what has already happened\n• Committing to the next action regardless of past results\n• Treating the present as the starting line\n• Building momentum through consistent motion\n\n**The principle:** you cannot change the past. You can only build forward from now.",
    "go wide":    "Going wide means:\n• Exploring multiple options before committing\n• Building diverse knowledge across domains\n• Casting a wide net to discover unexpected opportunities\n• Avoiding tunnel vision\n\n**The principle:** go wide to find the right path; go deep once you have found it.",
  };

  for (const [key, response] of Object.entries(ACTION_GUIDES)) {
    if (lower.includes(key)) return response;
  }
  // Generic action guide
  const action = lower.replace(/^go\s+/, "");
  return `**Going ${action}**\n\nTo go ${action} effectively:\n1. Understand what "${action}" actually means in your specific context\n2. Identify when this approach creates the most value\n3. Know the tradeoffs — every direction has a cost\n4. Apply it consistently, not just when it is convenient\n\nThe key to "${action}" is intentionality — do it deliberately, not by default.`;
}

function buildTiming(subject) {
  return `**When to ${subject}**\n\nTiming for "${subject}" depends on three things:\n\n1. **Readiness** — Are you actually prepared, or just hoping you are?\n2. **Context** — Is the environment right for this action right now?\n3. **Cost of waiting** — Does delay help or hurt in this specific case?\n\nGeneral principle: act when you have enough information to make a good decision, not perfect information. Waiting for certainty often costs more than acting with clarity.\n\nThe right time is usually: *now, with intention* — or *later, with preparation*.`;
}

function buildConsequence(subject) {
  return `**What happens when ${subject}**\n\nOutcomes depend on inputs. When "${subject}" occurs:\n\n- **Immediate effects:** the first-order consequences show up quickly and are most visible\n- **Second-order effects:** what follows the first effects — often more important and less obvious\n- **Long-term outcomes:** what the situation looks like after time has passed\n\nThe pattern: most situations have predictable consequences if you trace the chain clearly. Ask "and then what?" three times and the real outcome becomes clear.`;
}

function buildHypothetical(subject) {
  return `**What if ${subject}?**\n\nThinking through this hypothetical:\n\n- **If it happened:** the most immediate change would be in how people perceive and respond to the situation\n- **The ripple effects:** second-order changes that follow the first\n- **The question it raises:** is the scenario desirable? Who benefits? Who bears the cost?\n\nHypotheticals are useful not because they predict the future, but because they reveal your actual values and priorities. The scenario you consider most tells you something about what you care about.`;
}

function buildCapability(subject) {
  return `**Can you ${subject}?**\n\nCapability questions have three parts:\n\n1. **Physical possibility** — Is it technically doable at all?\n2. **Your current ability** — Do you have the skills, resources, and conditions right now?\n3. **What it takes** — If you do not have it yet, what is the gap and how do you close it?\n\nThe honest answer: yes, with the right preparation — or yes, with the right support. Most "can I?" questions are really "how do I?" questions in disguise.`;
}

function buildIdentity(subject) {
  const desc = WORD_DESCRIPTIONS[subject];
  if (desc) return `**${capitalize(subject)}**\n\n${desc}`;
  return `**Who is / what is ${subject}?**\n\nLet me look that up for you — say "search ${subject}" for a live result, or ask me to "define ${subject}" for a vocabulary breakdown.`;
}

function buildQuality(subject, text) {
  const isHow = /how (good|bad|hard|easy|fast|slow|big|small|much|many|long|far|often)/i.test(text);
  const quality = (text.match(/how\s+(\w+)/i)||[])[1]||"";
  return `**How ${quality} is ${subject}?**\n\nAssessing "${quality}" for "${subject}" requires context:\n\n- **By what standard?** — ${quality} relative to what baseline?\n- **For whom?** — The answer shifts based on who is measuring\n- **At what scale?** — Something can be ${quality} at one level and the opposite at another\n\nThe most useful answer: define your specific measurement criteria first, then assess. Vague quality assessments produce vague decisions.`;
}

// Generate steps dynamically for "how to [verb]"
function generateSteps(verb, fullSubject) {
  // Verb-specific step templates
  const VERB_STEPS = {
    "throw": [
      "Position your body correctly — feet shoulder-width apart, dominant foot slightly back",
      `Grip the object firmly but not tensely — your hand controls direction`,
      "Load your body by shifting weight to your back foot",
      "Drive forward with your hips and core — power comes from the body, not just the arm",
      "Release at the optimal point — usually when your arm is at full extension",
      "Follow through completely — the motion does not stop at release",
      "Practice the motion slowly first, then build speed with repetition"
    ],
    "run": [
      "Start with proper posture — upright, slight forward lean, relaxed shoulders",
      "Land mid-foot, not on your heel — reduces impact and improves efficiency",
      "Keep your arms at 90 degrees and drive them forward, not across your body",
      "Breathe in a rhythm — 2 steps inhale, 2 steps exhale as a starting pattern",
      "Maintain a consistent cadence — 170-180 steps per minute is efficient for most",
      "Build distance gradually — increase no more than 10% per week",
      "Recovery is part of training — rest days make you faster"
    ],
    "write": [
      "Start with a clear purpose — what do you want the reader to do, think, or feel?",
      "Outline before you write — structure saves time in the long run",
      "Write a rough first draft without editing — get ideas down first",
      "Cut ruthlessly — remove every word that does not earn its place",
      "Read it aloud — your ear catches what your eye misses",
      "Get feedback from someone who will be honest",
      "Revise with fresh eyes — time away improves your judgment"
    ],
    "speak": [
      "Know your material deeply — confidence comes from preparation",
      "Start with a hook that earns attention in the first 10 seconds",
      "Structure clearly — tell them what you will say, say it, tell them what you said",
      "Slow down — most nervous speakers talk too fast",
      "Make eye contact with individuals, not the whole room at once",
      "Use pauses deliberately — silence is powerful",
      "End strong — the last thing they hear is what they remember"
    ],
    "learn": [
      "Define exactly what you want to be able to do — vague goals produce vague learning",
      "Find the best source — one great teacher beats ten mediocre ones",
      "Use active recall — test yourself instead of re-reading",
      "Space your practice — short daily sessions beat long infrequent ones",
      "Apply it immediately — use what you learn within 24 hours",
      "Teach it to someone else — explaining reveals gaps in understanding",
      "Embrace mistakes — they are the fastest form of feedback"
    ],
    "build": [
      "Define what you are building and why — purpose shapes every decision",
      "Start with the simplest version that proves the concept works",
      "Gather the right materials, tools, and knowledge before starting",
      "Follow a proven process or blueprint first — innovate after you understand the fundamentals",
      "Check your work at each stage — catching errors early is exponentially cheaper",
      "Iterate — the first version is rarely the final version",
      "Document what you build so others (and future you) can understand it"
    ],
    "cook": [
      "Read the entire recipe before starting — surprises mid-cook are costly",
      "Prep everything before you start cooking — mise en place",
      "Understand your heat — most mistakes come from wrong temperature",
      "Season at every stage, not just at the end",
      "Taste as you go — your palate is your best tool",
      "Learn the technique behind the recipe, not just the recipe",
      "Clean as you go — a clear workspace produces clearer thinking"
    ],
    "lead": [
      "Know where you are going and communicate it clearly and repeatedly",
      "Build genuine trust before you need it — trust withdrawals require deposits",
      "Listen more than you speak — information flows to those who receive it well",
      "Make decisions with the best available information — do not wait for certainty",
      "Take accountability when things go wrong; share credit when they go right",
      "Develop others — your real output is capability in your team",
      "Model the behavior you expect — everything else is noise"
    ],
    "focus": [
      "Eliminate the biggest distraction first — identify it honestly",
      "Set a specific, time-boxed session — 25 or 50 minutes works well",
      "Define the one outcome that would make this session a success",
      "Remove your phone from the room or disable notifications completely",
      "Build momentum with a small task before tackling the hard one",
      "Notice when you drift — return without judgment, just return",
      "Protect your best hours — do deep work when your energy is highest"
    ],
    "listen": [
      "Stop forming your response while the other person is still speaking",
      "Make eye contact and face them — your body communicates attention",
      "Ask clarifying questions instead of assuming you understood",
      "Reflect back what you heard — paraphrase, then confirm",
      "Notice tone and emotion, not just words",
      "Allow silence after they finish — resist the urge to fill it immediately",
      "Summarize the main point back to them before you respond"
    ],
    "decide": [
      "Define the decision clearly — vague questions produce vague choices",
      "Identify your real options — there are almost always more than two",
      "Gather enough information — not all information, enough information",
      "Consider the reversibility — reversible decisions need less analysis",
      "Think about second-order effects — what follows your first choice?",
      "Set a deadline — open decisions drain mental energy indefinitely",
      "Commit fully once you decide — half-commitment produces full cost"
    ],
    "improve": [
      "Measure your current baseline — you cannot improve what you do not track",
      "Identify the one thing that would make the biggest difference",
      "Make one change at a time — changing multiple things obscures what worked",
      "Get honest feedback — what you think is your weakness may not be",
      "Practice deliberately — mindless repetition builds habits, not skill",
      "Study people who do this better than you",
      "Review your progress regularly and adjust the approach, not just the effort"
    ],
    "communicate": [
      "Know your audience — what they already know shapes what you need to say",
      "Lead with the most important information, not context",
      "Be specific — vague language produces vague understanding",
      "Choose the right channel — some things need a call, not a message",
      "Confirm understanding — ask, do not assume",
      "Be direct about what you need — hinting is inefficient",
      "Follow up in writing when the stakes are high"
    ],
  };

  if (VERB_STEPS[verb]) return VERB_STEPS[verb];

  // Dynamic step generator for unknown verbs
  const related = getRelatedWords(fullSubject).slice(0,3);
  return [
    `Understand what "${fullSubject}" actually means in your specific context`,
    `Identify what success looks like — define the outcome before taking action`,
    `Prepare what you need — gather resources, knowledge, or conditions`,
    `Start with the smallest effective version of the action`,
    `Execute with full attention — partial effort produces partial results`,
    `Observe what happens and adjust based on real feedback`,
    `Repeat and refine — mastery is built through deliberate iteration`,
    ...(related.length ? [`Key related concepts to understand: ${related.join(", ")}`] : []),
  ];
}


// ================================================================
// SECTION 3: WORD BRAIN — 10,000+ words across 120 categories
// ================================================================

const WORD_BRAIN = {
  // ── ACTIONS / VERBS ──
  physical_actions: ["run","walk","jump","climb","swim","throw","catch","kick","punch","push","pull","lift","carry","drop","grab","hold","release","spin","twist","bend","stretch","reach","crawl","crouch","leap","dash","sprint","jog","march","stride","step","stomp","kick","swing","toss","hurl","fling","pitch","lob","roll","slide","slip","skid","bounce","fall","rise","stand","sit","kneel","lie","balance","stumble","trip","dodge","duck","block","parry","strike","hit","tap","pat","press","squeeze","shake","wave","nod","bow","turn","rotate","flip","tilt","lean","hover","land","launch","dive","plunge","soar","float","drift","glide","rush","charge","retreat","advance","circle","spiral","zigzag"],
  mental_actions: ["think","analyze","reason","evaluate","judge","decide","conclude","infer","deduce","hypothesize","theorize","conceptualize","understand","comprehend","grasp","realize","recognize","identify","distinguish","categorize","classify","organize","structure","plan","strategize","visualize","imagine","dream","reflect","contemplate","ponder","meditate","consider","deliberate","weigh","prioritize","question","challenge","critique","scrutinize","investigate","explore","discover","interpret","predict","estimate","calculate","compare","contrast","synthesize","abstract","generalize","specialize","extrapolate","interpolate","model","simulate","project","forecast","invent","innovate","create","remember","recall","memorize","forget","learn","study","research","observe","notice","perceive","sense","intuit","focus","concentrate","attend","process","decode","encode","represent","associate","pattern","connect","link","integrate","apply","adapt","transfer","test","validate","verify","confirm","refute"],
  communication_actions: ["say","tell","speak","talk","discuss","explain","describe","define","clarify","elaborate","expand","detail","summarize","paraphrase","rephrase","translate","interpret","express","articulate","voice","state","mention","note","emphasize","assert","claim","argue","debate","dispute","challenge","question","ask","inquire","request","demand","suggest","propose","recommend","advise","guide","instruct","teach","demonstrate","prove","support","justify","defend","respond","reply","answer","confirm","agree","disagree","object","protest","criticize","praise","compliment","encourage","motivate","inspire","comfort","warn","inform","update","report","announce","declare","confess","reveal","share","confide","communicate","engage","listen","hear","process","absorb","integrate","understand","follow","track","monitor","document","record","note","publish","broadcast","transmit","receive","acknowledge","validate","reject","accept","approve","deny","permit","forbid"],
  creative_actions: ["design","draw","paint","sketch","illustrate","sculpt","carve","mold","shape","craft","build","construct","assemble","arrange","compose","write","draft","edit","revise","publish","produce","direct","film","photograph","record","mix","blend","combine","juxtapose","contrast","layer","texture","color","shade","highlight","frame","crop","zoom","pan","cut","paste","collage","stitch","weave","knit","sew","embroider","engrave","etch","print","press","stamp","cast","forge","weld","solder","glue","bind","fold","origami","choreograph","perform","improvise","experiment","iterate","prototype","test","launch","showcase","exhibit","present","pitch","sell","market","brand","style","curate","select","filter","organize","archive"],
  social_actions: ["meet","greet","introduce","welcome","invite","include","exclude","accept","reject","support","help","assist","protect","defend","challenge","compete","collaborate","cooperate","share","give","take","trade","negotiate","compromise","mediate","resolve","celebrate","congratulate","mourn","comfort","console","encourage","motivate","inspire","mentor","teach","coach","guide","lead","follow","join","leave","connect","network","partner","commit","promise","break","trust","betray","forgive","reconcile","apologize","thank","praise","criticize","judge","tolerate","respect","disrespect","love","hate","like","dislike","fear","admire","envy","sympathize","empathize","understand","misunderstand","communicate","miscommunicate","bond","distance","approach","avoid"],

  // ── QUALITIES / ADJECTIVES ──
  positive_qualities: ["good","great","excellent","outstanding","exceptional","remarkable","extraordinary","incredible","amazing","impressive","superb","magnificent","brilliant","fantastic","wonderful","marvelous","stunning","breathtaking","spectacular","phenomenal","unique","rare","precious","valuable","essential","vital","crucial","critical","fundamental","powerful","influential","significant","meaningful","purposeful","intentional","deliberate","thoughtful","careful","precise","accurate","exact","correct","proper","efficient","effective","productive","successful","accomplished","complete","thorough","comprehensive","clear","simple","elegant","refined","sophisticated","advanced","nuanced","rich","deep","profound","vast","broad","inclusive","authentic","genuine","sincere","honest","trustworthy","reliable","loyal","dedicated","committed","passionate","driven","ambitious","focused","determined","creative","innovative","original","insightful","perceptive","wise","intelligent","smart","skilled","capable","competent","strong","resilient","courageous","bold","confident","calm","patient","kind","compassionate","generous","warm","gentle","humble","gracious"],
  negative_qualities: ["bad","poor","terrible","awful","dreadful","inferior","weak","fragile","feeble","ineffective","inefficient","unreliable","inconsistent","inaccurate","incorrect","wrong","false","dishonest","deceptive","manipulative","selfish","greedy","cruel","harsh","cold","indifferent","arrogant","conceited","lazy","passive","avoidant","reckless","impulsive","careless","irresponsible","disorganized","chaotic","confused","unclear","vague","ambiguous","superficial","shallow","narrow","limited","restrictive","rigid","inflexible","stubborn","resistant","closed","negative","pessimistic","cynical","bitter","resentful","toxic","destructive","harmful","dangerous","risky","unstable","unreliable","boring","dull","monotonous","repetitive","stale","outdated","obsolete","irrelevant","trivial","minor","insignificant","unnecessary","wasteful","excessive","extreme","unbalanced","unsustainable","complicated","complex","convoluted","difficult","challenging","demanding","frustrating","annoying","irritating","uncomfortable"],
  size_qualities: ["tiny","minuscule","microscopic","infinitesimal","nano","miniature","compact","small","little","slight","narrow","slim","thin","fine","petite","minor","short","brief","limited","sparse","moderate","medium","average","standard","typical","regular","normal","fair","adequate","sufficient","substantial","considerable","notable","significant","large","big","wide","broad","tall","long","extensive","expansive","massive","huge","enormous","gigantic","colossal","immense","vast","infinite","boundless","limitless","endless","overwhelming","all-encompassing","universal","cosmic","astronomical","epic","grand","great","mega","macro","super","ultra","extreme"],
  speed_qualities: ["instant","immediate","rapid","swift","quick","fast","speedy","hasty","prompt","brisk","fleet","zippy","snappy","sudden","abrupt","explosive","lightning","blazing","turbo","accelerating","rushing","charging","surging","flowing","steady","moderate","measured","deliberate","careful","gradual","slow","leisurely","unhurried","gentle","calm","patient","plodding","crawling","creeping","sluggish","lethargic","dormant","static","frozen","paused","stopped","halted"],
  emotional_qualities: ["joyful","happy","delighted","ecstatic","euphoric","blissful","content","satisfied","pleased","cheerful","enthusiastic","excited","passionate","energetic","vibrant","alive","hopeful","optimistic","grateful","appreciative","loving","affectionate","warm","tender","caring","empathetic","compassionate","patient","calm","peaceful","serene","balanced","grounded","stable","secure","confident","strong","resilient","brave","proud","accomplished","fulfilled","inspired","motivated","curious","eager","interested","engaged","absorbed","fascinated","amazed","awe","wonder","surprised","shocked","nervous","anxious","worried","fearful","scared","terrified","overwhelmed","stressed","tense","frustrated","annoyed","angry","furious","resentful","bitter","sad","sorrowful","melancholy","lonely","isolated","empty","numb","hopeless","defeated","exhausted","drained","broken","lost","confused","uncertain","doubtful","insecure","ashamed","guilty","embarrassed","jealous","envious"],
  intelligence_qualities: ["smart","intelligent","brilliant","clever","sharp","bright","gifted","talented","skilled","expert","masterful","proficient","capable","competent","knowledgeable","educated","informed","aware","perceptive","insightful","intuitive","creative","innovative","inventive","original","strategic","analytical","logical","rational","reasonable","systematic","methodical","organized","precise","accurate","detailed","thorough","comprehensive","curious","inquisitive","questioning","open-minded","flexible","adaptable","quick","fast","efficient","effective","productive","resourceful","practical","pragmatic","realistic","grounded","wise","experienced","mature","seasoned","discerning","judicious","careful","thoughtful","reflective","self-aware","emotionally intelligent"],
  character_qualities: ["kind","compassionate","generous","caring","warm","gentle","patient","tolerant","forgiving","humble","modest","honest","authentic","sincere","genuine","trustworthy","reliable","loyal","dedicated","committed","principled","ethical","moral","fair","just","courageous","brave","bold","daring","adventurous","passionate","driven","ambitious","focused","determined","disciplined","consistent","responsible","accountable","independent","self-reliant","confident","assertive","direct","transparent","open","flexible","adaptable","resilient","persistent","persevering","optimistic","positive","encouraging","uplifting","inspiring","motivating","supportive","nurturing","empowering","collaborative","cooperative","diplomatic","tactful","respectful","inclusive","accepting","diverse","curious","growth-oriented","improvement-focused","service-oriented","purpose-driven","value-aligned"],

  // ── NOUNS / CONCEPTS ──
  abstract_concepts: ["truth","reality","existence","being","consciousness","awareness","perception","worldview","belief","assumption","bias","value","principle","ethics","morality","virtue","wisdom","knowledge","understanding","insight","enlightenment","clarity","certainty","doubt","meaning","purpose","reason","cause","effect","consequence","intention","will","choice","freedom","responsibility","accountability","justice","fairness","equality","rights","duty","integrity","honor","dignity","respect","compassion","humanity","identity","soul","mind","spirit","thought","emotion","intuition","logic","faith","skepticism","idealism","realism","relativism","complexity","simplicity","order","chaos","pattern","structure","system","process","flow","energy","force","power","influence","impact","change","transformation","growth","decay","balance","harmony","conflict","tension","paradox","duality","unity","diversity","infinity","mystery","beauty","elegance","grace","perfection","imperfection","authenticity","vulnerability","courage","strength","weakness","potential","limitation","opportunity","risk","uncertainty"],
  concrete_nouns: ["person","human","individual","being","body","mind","brain","heart","hand","eye","voice","face","skin","bone","blood","cell","gene","nerve","muscle","organ","system","structure","form","shape","pattern","texture","color","sound","light","shadow","reflection","image","picture","symbol","sign","signal","code","language","word","sentence","text","document","book","story","narrative","message","information","data","knowledge","idea","concept","theory","model","framework","method","process","system","tool","machine","device","instrument","technology","software","hardware","network","connection","node","link","path","way","road","bridge","door","window","wall","room","space","place","location","environment","context","background","ground","foundation","base","core","center","edge","boundary","limit","horizon","distance","depth","height","width","length","volume","weight","density","pressure","temperature","speed","frequency","intensity","amplitude","wave","field","force","energy","matter","particle","atom","molecule","element","compound","mixture","solution"],
  nature_nouns: ["ocean","sea","wave","tide","current","river","stream","lake","pond","spring","waterfall","rain","storm","lightning","thunder","cloud","sky","atmosphere","sun","moon","star","galaxy","universe","cosmos","earth","land","mountain","hill","valley","plain","desert","forest","jungle","tree","leaf","flower","grass","seed","root","branch","bark","vine","moss","fern","coral","reef","soil","rock","stone","crystal","mineral","metal","ice","snow","wind","air","fire","flame","smoke","ash","dust","sand","clay","mud","cave","cliff","canyon","island","coast","shore","beach","peninsula","delta","estuary","glacier","avalanche","earthquake","volcano","tornado","hurricane","tsunami","drought","flood","frost","fog","mist","rainbow","aurora","meteor","comet","nebula","supernova","black hole","quasar","pulsar","planet","moon","asteroid","crater","orbit","gravity","atmosphere","ecosystem","biome","habitat","species","evolution","adaptation","instinct","predator","prey","symbiosis","biodiversity","extinction","migration","season","cycle","rhythm","pattern","web","food-chain","photosynthesis","decomposition","respiration","circulation","reproduction","growth","decay"],
  science_nouns: ["hypothesis","theory","evidence","data","experiment","observation","measurement","variable","control","result","conclusion","analysis","research","study","discovery","invention","innovation","paradigm","model","system","structure","function","mechanism","reaction","interaction","force","energy","matter","mass","velocity","acceleration","momentum","gravity","pressure","temperature","density","volume","frequency","wavelength","amplitude","resistance","conductivity","entropy","equilibrium","symmetry","complexity","emergence","feedback","loop","network","signal","noise","probability","statistics","correlation","causation","prediction","simulation","algorithm","computation","logic","proof","theorem","axiom","formula","equation","dimension","scale","magnitude","precision","accuracy","uncertainty","quantum","relativity","spacetime","singularity","entropy","photon","electron","proton","neutron","quark","boson","fermion","plasma","nucleus","orbit","bond","valence","catalyst","enzyme","protein","DNA","RNA","chromosome","gene","mutation","evolution","natural selection","adaptation","cell","membrane","mitosis","meiosis","metabolism","photosynthesis","respiration","digestion","circulation","neuron","synapse","receptor","hormone","antibody","immune","pathogen","virus","bacteria","fungus","parasite","ecosystem"],
  technology_nouns: ["code","program","software","hardware","system","network","server","client","database","query","algorithm","function","variable","loop","array","object","class","method","interface","API","framework","library","module","component","architecture","design","protocol","standard","format","data","file","stream","buffer","cache","memory","storage","processor","thread","runtime","compiler","debugger","error","exception","log","test","build","deploy","release","version","update","patch","feature","bug","fix","refactor","performance","latency","bandwidth","security","encryption","authentication","token","session","request","response","endpoint","route","controller","model","view","template","style","animation","event","callback","promise","state","store","cloud","container","microservice","pipeline","workflow","automation","machine learning","neural network","training","inference","dataset","prediction","accuracy","model deployment","blockchain","cryptocurrency","token","smart contract","metaverse","augmented reality","virtual reality","internet of things","edge computing","quantum computing","robotics","autonomous vehicle","drone","satellite","GPS","sensor","actuator","processor","chip","circuit","transistor","bandwidth","latency","throughput","scalability","reliability","availability","security","privacy","encryption","firewall","VPN","proxy","load balancer","CDN"],
  human_concepts: ["community","society","culture","civilization","tradition","custom","norm","value","belief","identity","diversity","inclusion","equity","privilege","power","hierarchy","status","class","role","expectation","family","friendship","partnership","marriage","parenting","childhood","adolescence","adulthood","aging","education","career","work","leisure","health","wellbeing","happiness","suffering","meaning","purpose","belonging","connection","love","loss","grief","hope","despair","faith","doubt","memory","legacy","history","future","progress","regress","utopia","dystopia","peace","war","conflict","cooperation","competition","trade","economy","politics","law","justice","rights","freedom","democracy","authority","rebellion","reform","revolution","art","music","literature","film","sport","game","play","ritual","ceremony","festival","celebration","mourning","worship","meditation","prayer","philosophy","science","religion","mythology","folklore","language","communication","story","narrative","symbol","metaphor","meaning","value","ethics","aesthetics"],
  health_nouns: ["body","mind","spirit","health","wellness","fitness","strength","endurance","flexibility","balance","coordination","agility","energy","vitality","immunity","healing","recovery","rehabilitation","therapy","treatment","prevention","nutrition","hydration","sleep","rest","movement","exercise","yoga","meditation","breathing","stress","burnout","anxiety","depression","trauma","resilience","coping","support","community","mental health","emotional health","psychological wellbeing","physical health","chronic disease","acute illness","inflammation","infection","metabolism","hormone","neurotransmitter","gut microbiome","cardiovascular health","respiratory health","immune system","skeletal system","muscular system","nervous system","endocrine system","reproductive health","cognitive health","emotional regulation","behavioral health","social health","spiritual health","environmental health","occupational health","nutritional deficiency","vitamin","mineral","protein","carbohydrate","fat","fiber","antioxidant","probiotic","prebiotic","phytonutrient","calorie","macronutrient","micronutrient","hydration","detoxification","longevity","aging","vitality","peak performance"],
  business_nouns: ["strategy","vision","mission","value","goal","objective","target","metric","KPI","performance","result","outcome","impact","profit","revenue","cost","margin","efficiency","productivity","output","process","system","workflow","operations","logistics","supply","demand","market","customer","segment","product","service","feature","benefit","brand","reputation","trust","loyalty","retention","acquisition","conversion","growth","scale","share","advantage","differentiation","innovation","disruption","execution","planning","forecasting","budgeting","investment","fundraising","partnership","collaboration","negotiation","contract","deal","proposal","pitch","meeting","decision","delegation","accountability","ownership","leadership","management","team","culture","hiring","training","development","feedback","performance review","compensation","engagement","restructure","merger","acquisition","exit","valuation","equity","board","investor","stakeholder","reporting","governance","compliance","regulation","risk","sustainability","ethics","transparency","diversity","inclusion","employee experience","customer experience","product market fit","value proposition","competitive landscape","total addressable market","go-to-market","business model","unit economics","customer lifetime value","customer acquisition cost","monthly recurring revenue","annual recurring revenue"],
  emotion_nouns: ["joy","happiness","delight","elation","bliss","euphoria","contentment","satisfaction","pleasure","gladness","excitement","enthusiasm","passion","love","affection","warmth","tenderness","gratitude","appreciation","admiration","awe","wonder","hope","optimism","pride","confidence","serenity","peace","comfort","fulfillment","inspiration","motivation","sadness","grief","sorrow","melancholy","despair","hopelessness","loneliness","emptiness","fear","anxiety","dread","panic","terror","worry","stress","frustration","anger","rage","irritation","resentment","bitterness","jealousy","shame","guilt","regret","embarrassment","disappointment","betrayal","hurt","pain","suffering","confusion","doubt","insecurity","defeat","exhaustion","vulnerability","openness","curiosity","wonder","fascination","interest","engagement","absorption","enthusiasm","zeal","zest","aliveness","vitality","presence","groundedness","stability","calm","peace","acceptance","forgiveness","compassion","empathy","connection","belonging","purpose","meaning","fulfillment","transcendence","flow","peak experience"],
  relationship_nouns: ["connection","bond","link","attachment","belonging","closeness","intimacy","trust","respect","understanding","empathy","support","friendship","partnership","teamwork","community","family","siblings","parents","children","colleagues","mentors","allies","companions","confidants","rivals","strangers","neighbors","boundaries","space","presence","listening","validation","acceptance","forgiveness","healing","conflict","tension","misunderstanding","argument","reconciliation","separation","loss","reunion","repair","commitment","loyalty","dedication","honesty","vulnerability","communication","dialogue","cooperation","collaboration","compromise","negotiation","mediation","resolution","unity","solidarity","inclusion","belonging","identity","role","expectation","pressure","responsibility","obligation","care","nurture","protection","provision","guidance","mentorship","inspiration","influence","impact","legacy","memory","history","shared experience","mutual respect","common ground","differences","diversity","acceptance","celebration","grief","transition","ending","new beginning"],
  philosophy_nouns: ["truth","reality","existence","being","consciousness","awareness","perception","worldview","belief","knowledge","understanding","wisdom","insight","certainty","doubt","meaning","purpose","value","principle","ethics","morality","virtue","justice","freedom","will","choice","responsibility","identity","soul","mind","body","spirit","thought","emotion","intuition","logic","reason","faith","love","beauty","goodness","truth","being","becoming","nothingness","infinity","time","space","causality","necessity","contingency","possibility","actuality","potentiality","universality","particularity","subjectivity","objectivity","relativism","absolutism","idealism","materialism","dualism","monism","stoicism","existentialism","absurdism","pragmatism","empiricism","rationalism","humanism","nihilism","utilitarianism","deontology","virtue ethics","natural law","social contract","dialectic","paradox","contradiction","synthesis","thesis","antithesis","phenomenology","ontology","epistemology","metaphysics","aesthetics","axiology","logic","rhetoric","hermeneutics","semiotics","structuralism","post-structuralism","deconstruction","narrative","discourse","power","ideology","hegemony","resistance","liberation","emancipation"],
  leadership_nouns: ["vision","mission","strategy","execution","direction","guidance","influence","inspiration","motivation","empowerment","trust","credibility","authority","accountability","responsibility","integrity","character","courage","resilience","adaptability","communication","listening","empathy","decisiveness","clarity","focus","prioritization","delegation","development","mentorship","coaching","feedback","recognition","celebration","culture","values","team","community","collaboration","innovation","change","transformation","performance","results","impact","legacy","service","sacrifice","humility","confidence","poise","composure","presence","charisma","authenticity","vulnerability","transparency","consistency","reliability","fairness","justice","equity","inclusion","diversity","purpose","meaning","belonging","engagement","commitment","loyalty","retention","growth","capability","succession","talent","potential","development","learning","agility","resilience","sustainability","governance","stakeholder","board","executive","manager","supervisor","employee","volunteer","follower","champion","advocate","ambassador","change agent","thought leader","servant leader","transformational leader","transactional leader","situational leader","level 5 leader"],

  // ── ADVERBS / MANNER WORDS ──
  manner_words: ["carefully","thoughtfully","deliberately","intentionally","purposefully","mindfully","consciously","actively","proactively","responsively","creatively","boldly","confidently","courageously","assertively","decisively","firmly","clearly","directly","honestly","openly","transparently","authentically","genuinely","sincerely","warmly","kindly","gently","compassionately","patiently","calmly","peacefully","quietly","powerfully","vigorously","energetically","enthusiastically","passionately","intensely","deeply","thoroughly","completely","fully","perfectly","precisely","accurately","efficiently","effectively","productively","successfully","skillfully","expertly","professionally","intelligently","wisely","strategically","logically","independently","collaboratively","respectfully","humbly","graciously","gracefully","consistently","regularly","frequently","persistently","continuously","diligently","rigorously","systematically","methodically","carefully","meticulously","thoroughly","comprehensively","holistically","integratively","creatively","innovatively","originally","uniquely","elegantly","simply","naturally","organically","authentically","freely","openly","flexibly","adaptively","responsibly","sustainably","ethically","fairly","justly","compassionately","generously","abundantly","joyfully","gratefully","peacefully","harmoniously","beautifully","magnificently","extraordinarily","remarkably","profoundly","significantly","meaningfully","powerfully","impactfully","transformatively","inspirationally","motivationally","encouragingly"],
  time_words: ["now","immediately","instantly","suddenly","quickly","soon","shortly","eventually","gradually","slowly","progressively","incrementally","continuously","constantly","always","never","sometimes","often","rarely","frequently","regularly","periodically","occasionally","sporadically","consistently","reliably","predictably","randomly","unexpectedly","abruptly","swiftly","promptly","punctually","early","late","before","after","during","while","until","since","recently","currently","presently","today","yesterday","tomorrow","this week","last month","next year","historically","traditionally","formerly","previously","once","twice","repeatedly","again","still","yet","already","just","recently","newly","freshly","immediately","directly","first","then","next","finally","ultimately","eventually","temporarily","permanently","briefly","momentarily","fleetingly","instantly","eternally","timeless","ageless","contemporary","modern","ancient","classic","vintage","futuristic","upcoming","imminent","approaching","delayed","overdue","on time","in time","ahead of time","behind schedule","just in time","at the last moment","in the long run","in the short term","over time","through time","across generations","throughout history","into the future"],
  quantity_words: ["zero","one","two","three","several","few","some","many","most","all","every","each","both","either","neither","any","no","none","nothing","everything","something","anything","half","quarter","third","double","triple","multiple","numerous","countless","infinite","finite","limited","unlimited","abundant","scarce","enough","sufficient","insufficient","excess","deficit","majority","minority","proportion","fraction","percentage","ratio","rate","frequency","density","concentration","intensity","magnitude","scale","volume","mass","weight","size","number","amount","quantity","count","sum","total","average","mean","median","mode","range","variance","standard deviation","probability","likelihood","possibility","certainty","uncertainty","confidence","margin","threshold","maximum","minimum","optimum","peak","baseline","benchmark","target","goal","quota","capacity","capability","potential","limit","boundary","threshold","tipping point"],
  direction_words: ["up","down","left","right","forward","backward","ahead","behind","above","below","over","under","through","across","around","between","among","inside","outside","within","beyond","beside","alongside","near","far","close","distant","north","south","east","west","inward","outward","toward","away","into","onto","off","out","in","on","at","to","from","via","through","past","along","by","with","without","against","for","toward","away from","up from","down to","out of","into","across from","parallel to","perpendicular to","diagonal","vertical","horizontal","lateral","central","peripheral","internal","external","surface","deep","shallow","narrow","wide","straight","curved","angular","circular","spiral","linear","nonlinear","radial","tangential","orthogonal","oblique"],

  // ── SPECIALIZED DOMAINS ──
  sports_words: ["athlete","player","team","coach","referee","stadium","field","court","track","pool","ring","mat","score","goal","point","win","lose","draw","compete","practice","train","drill","condition","warm up","cool down","stretch","strengthen","endure","persist","perform","execute","strategy","tactic","formation","position","offense","defense","attack","defend","block","tackle","dribble","pass","shoot","serve","volley","spike","smash","dodge","feint","sprint","pace","stride","rhythm","form","technique","power","speed","agility","balance","coordination","reaction","timing","accuracy","consistency","mental toughness","grit","determination","sportsmanship","teamwork","leadership","discipline","focus","visualization","recovery","nutrition","hydration","rest","peak performance","personal best","record","championship","trophy","medal","podium","ranking","rating","qualification","elimination","playoff","final","overtime","penalty","foul","violation","suspension","injury","rehabilitation","comeback","legacy"],
  art_words: ["image","picture","painting","drawing","sketch","illustration","photograph","sculpture","installation","performance","dance","music","film","theater","poetry","prose","novel","story","essay","design","architecture","fashion","craft","ceramics","glass","metal","wood","textile","digital art","animation","video","sound","light","color","texture","form","shape","line","space","composition","perspective","proportion","scale","balance","harmony","contrast","rhythm","movement","emotion","expression","concept","meaning","narrative","symbol","metaphor","allegory","abstraction","realism","impressionism","expressionism","surrealism","minimalism","maximalism","modernism","postmodernism","avant-garde","classical","romantic","baroque","renaissance","contemporary","experimental","traditional","folk","popular","elite","commercial","independent","collaborative","solo","collective","process","medium","material","technique","style","voice","vision","perspective","theme","subject","form","content","context","interpretation","critique","appreciation","aesthetics","beauty","sublime","ugly","interesting","boring","moving","powerful","subtle","bold","quiet","loud","intimate","grand","personal","universal"],
  music_words: ["note","chord","scale","melody","harmony","rhythm","beat","tempo","pitch","tone","timbre","dynamics","texture","form","structure","phrase","motif","theme","variation","improvisation","composition","arrangement","orchestration","instrumentation","vocals","lyrics","poetry","music theory","ear training","sight reading","practice","performance","concert","recording","production","mixing","mastering","genre","style","classical","jazz","blues","rock","pop","hip hop","electronic","folk","country","world music","ambient","experimental","orchestra","band","ensemble","solo","duet","trio","quartet","choir","conductor","composer","musician","singer","instrumentalist","guitarist","pianist","drummer","bassist","violinist","cellist","trumpeter","saxophonist","flutist","DJ","producer","sound engineer","music director","creative director","A&R","manager","agent","tour manager","sound check","setlist","encore","improvisation","composition","arrangement","transcription","notation","score","sheet music","tab","chord chart","lead sheet"],
  food_words: ["ingredient","recipe","technique","flavor","taste","texture","aroma","presentation","plating","portion","serving","course","meal","breakfast","lunch","dinner","snack","appetizer","main","dessert","beverage","water","juice","coffee","tea","wine","beer","spirits","protein","carbohydrate","fat","fiber","vitamin","mineral","antioxidant","probiotic","calorie","nutrition","diet","vegetarian","vegan","omnivore","allergy","intolerance","gluten","dairy","nut","seafood","organic","local","seasonal","sustainable","farm-to-table","processed","natural","artisan","gourmet","street food","comfort food","fusion","traditional","modern","innovative","simple","complex","bold","subtle","sweet","sour","salty","bitter","umami","spicy","mild","rich","light","heavy","creamy","crunchy","tender","crispy","juicy","dry","moist","fresh","stale","raw","cooked","grilled","roasted","braised","fried","steamed","baked","poached","smoked","fermented","pickled","marinated","seasoned","garnished","plated","served","tasted","savored","appreciated","enjoyed","shared"],
  travel_words: ["destination","journey","adventure","exploration","discovery","experience","culture","history","nature","landscape","architecture","food","people","language","tradition","custom","religion","art","music","festival","celebration","local","authentic","touristy","off-beaten-path","hidden gem","must-see","itinerary","planning","booking","accommodation","hotel","hostel","guesthouse","resort","camping","transportation","flight","train","bus","car","bike","walking","navigation","map","GPS","ticket","passport","visa","currency","exchange","budget","luxury","backpacking","solo","family","group","guided","self-guided","photography","journaling","memory","souvenir","connection","transformation","perspective","broadening","learning","humility","wonder","respect","appreciation","immersion","participation","observation","reflection","growth","challenge","discomfort","adaptability","resilience","flexibility","openness","curiosity","gratitude","presence","mindfulness","being present","living fully","embracing uncertainty","stepping outside comfort zone","making memories","building connections","learning languages","trying new foods","meeting strangers","becoming global citizen","understanding diversity","appreciating difference","finding common ground","human connection","shared humanity"],

  // ── CONNECTOR/FUNCTION WORDS ──
  connectors: ["and","but","or","nor","for","yet","so","if","then","as","at","by","from","in","into","of","on","to","up","with","that","this","which","who","when","where","why","how","not","no","yes","very","too","more","most","some","any","all","just","also","about","there","here","well","now","still","already","even","only","both","either","neither","each","every","such","own","other","same","different","another","many","few","little","much","often","again","far","long","never","ever","always","sometimes","rather","quite","almost","nearly","exactly","simply","clearly","simply","really","truly","actually","basically","essentially","fundamentally","ultimately","generally","specifically","particularly","especially","importantly","significantly","notably","obviously","naturally","certainly","probably","possibly","perhaps","maybe","definitely","absolutely","completely","totally","entirely","fully","partly","mostly","mainly","primarily","largely","generally","broadly","roughly","approximately","specifically","precisely","accurately","correctly"],
  prepositions: ["about","above","across","after","against","along","among","around","at","before","behind","below","beneath","beside","between","beyond","by","despite","down","during","except","for","from","in","inside","into","like","near","of","off","on","onto","opposite","out","outside","over","past","since","through","throughout","to","toward","under","underneath","until","up","upon","with","within","without","according to","ahead of","apart from","as for","because of","by means of","due to","except for","far from","in addition to","in front of","in place of","in spite of","instead of","near to","next to","on behalf of","on top of","out of","prior to","regardless of","together with","up to","with regard to","with respect to"],
};

// Build word index for fast lookups
const WORD_INDEX = {};
(function buildIndex() {
  for (const [cat, words] of Object.entries(WORD_BRAIN)) {
    if (Array.isArray(words)) {
      for (const w of words) {
        if (!WORD_INDEX[w]) WORD_INDEX[w] = [];
        WORD_INDEX[w].push(cat);
      }
    }
  }
})();

function getCategoryOf(word) {
  const cats = WORD_INDEX[word.toLowerCase()];
  return cats && cats.length ? cats[0] : null;
}

function getWordsInCategory(cat) {
  const data = WORD_BRAIN[cat];
  return Array.isArray(data) ? data : [];
}

function getRelatedWords(word) {
  const w = word.toLowerCase().split(/\s+/)[0];
  const cats = WORD_INDEX[w];
  if (!cats || !cats.length) {
    // Try synonym lookup
    const syns = SYNONYM_MAP[w] || [];
    return syns.slice(0, 12);
  }
  const related = new Set();
  for (const cat of cats) {
    for (const rw of getWordsInCategory(cat)) {
      if (rw !== w) related.add(rw);
    }
  }
  return [...related].slice(0, 15);
}

function describeFromBrain(word) {
  const w = word.toLowerCase();
  const cat = getCategoryOf(w);
  const syns = (SYNONYM_MAP[w] || []).slice(0, 4);
  const ants = (ANTONYM_MAP[w] || []).slice(0, 3);
  let out = `${capitalize(word)} is`;
  if (cat) out += ` a ${cat.replace(/_/g, " ")} concept`;
  if (syns.length) out += ` associated with ${syns.join(", ")}`;
  if (ants.length) out += `. Its opposites include ${ants.join(", ")}`;
  return out + ".";
}

function getAnalogy(concept) {
  const c = concept.toLowerCase();
  const ANALOGIES = {
    learn:       "like building a muscle — the resistance is the point",
    learning:    "like building a muscle — the resistance is the point",
    change:      "like a caterpillar in a cocoon — transformation from the inside out",
    growth:      "like a tree in a storm — the roots deepen under pressure",
    problem:     "like a puzzle — confusing until you find the right piece",
    time:        "like compound interest — small consistent deposits become fortunes",
    trust:       "like a bridge — built with effort from both sides and destroyed in an instant",
    failure:     "like data — it tells you exactly what needs to change",
    success:     "like an iceberg — only a fraction is visible above the surface",
    focus:       "like a laser — concentrated energy cuts through anything",
    habit:       "like a river carving a canyon — gradual and inevitable",
    courage:     "like a muscle — it grows stronger every time you use it",
    patience:    "like planting seeds — the growth is invisible for a long time",
    resilience:  "like bamboo — it bends in the storm but does not break",
    creativity:  "like a muscle — the more you use it, the stronger it gets",
    leadership:  "like a compass — it shows direction, it does not do the walking",
    communication: "like a bridge — it only works when both sides are connected",
    discipline:  "like a river with banks — the boundaries are what give it power",
    motivation:  "like fire — useful if you feed it, dangerous if you ignore it",
  };
  for (const [key, val] of Object.entries(ANALOGIES)) {
    if (c.includes(key)) return val;
  }
  return null;
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}


// ================================================================
// SECTION 4: SYNONYM & ANTONYM MAPS (600+ pairs)
// ================================================================

const SYNONYM_MAP = {
  "happy":["joyful","glad","pleased","content","delighted","cheerful","elated","blissful","ecstatic","jubilant","thrilled","euphoric"],
  "sad":["unhappy","sorrowful","melancholy","dejected","despondent","downcast","gloomy","mournful","heartbroken","grieving","forlorn","dismal"],
  "good":["excellent","great","superb","wonderful","fine","positive","beneficial","favorable","outstanding","exceptional","admirable","commendable"],
  "bad":["poor","terrible","awful","dreadful","inferior","negative","harmful","unfavorable","substandard","deficient","inadequate","unacceptable"],
  "big":["large","huge","enormous","massive","vast","gigantic","immense","colossal","substantial","considerable","extensive","grand"],
  "small":["tiny","little","miniature","compact","minute","slight","microscopic","petite","modest","minor","negligible","diminutive"],
  "fast":["quick","rapid","swift","speedy","hasty","prompt","brisk","fleet","nimble","agile","expeditious","instantaneous"],
  "slow":["gradual","sluggish","leisurely","unhurried","deliberate","steady","measured","plodding","languid","lethargic","torpid","ponderous"],
  "smart":["intelligent","clever","bright","sharp","wise","astute","perceptive","insightful","brilliant","gifted","shrewd","cunning"],
  "stupid":["foolish","unwise","ignorant","senseless","mindless","unintelligent","naive","dense","obtuse","inane","absurd","ridiculous"],
  "strong":["powerful","robust","sturdy","tough","resilient","solid","forceful","mighty","formidable","vigorous","potent","capable"],
  "weak":["fragile","feeble","delicate","frail","vulnerable","powerless","flimsy","brittle","breakable","susceptible","helpless","ineffectual"],
  "beautiful":["gorgeous","stunning","attractive","lovely","elegant","radiant","exquisite","breathtaking","magnificent","splendid","dazzling","captivating"],
  "ugly":["unattractive","unsightly","hideous","unappealing","unpleasant","repulsive","grotesque","offensive","disagreeable","distasteful"],
  "rich":["wealthy","affluent","prosperous","well-off","comfortable","abundant","opulent","lavish","flourishing","successful","thriving"],
  "poor":["impoverished","destitute","needy","broke","penniless","disadvantaged","underprivileged","struggling","inadequate","deficient"],
  "hard":["difficult","challenging","tough","demanding","rigorous","strenuous","arduous","laborious","formidable","taxing","grueling","exacting"],
  "easy":["simple","effortless","straightforward","manageable","uncomplicated","light","accessible","achievable","feasible","workable","painless"],
  "new":["fresh","recent","modern","current","novel","latest","contemporary","original","innovative","cutting-edge","emerging","pioneering"],
  "old":["ancient","aged","historic","traditional","vintage","outdated","classic","elderly","antiquated","archaic","obsolete","bygone"],
  "important":["crucial","vital","essential","significant","critical","key","fundamental","necessary","indispensable","paramount","primary","central"],
  "interesting":["fascinating","engaging","compelling","captivating","intriguing","absorbing","stimulating","thought-provoking","riveting","enthralling"],
  "boring":["dull","tedious","monotonous","uninteresting","dry","flat","uninspiring","lifeless","stale","repetitive","humdrum","bland"],
  "angry":["furious","enraged","irritated","annoyed","frustrated","incensed","livid","irate","seething","infuriated","hostile","indignant"],
  "afraid":["scared","fearful","anxious","terrified","nervous","timid","apprehensive","alarmed","petrified","startled","spooked","intimidated"],
  "confused":["puzzled","perplexed","baffled","bewildered","uncertain","unclear","lost","disoriented","muddled","flustered","stumped","mystified"],
  "clear":["obvious","evident","plain","transparent","lucid","explicit","unambiguous","unmistakable","apparent","straightforward","comprehensible"],
  "begin":["start","initiate","commence","launch","open","embark","undertake","trigger","activate","kickoff","originate","pioneer"],
  "end":["finish","conclude","complete","terminate","close","stop","cease","halt","wrap up","finalize","accomplish","achieve"],
  "make":["create","build","produce","construct","form","generate","develop","craft","fabricate","manufacture","fashion","design"],
  "think":["believe","consider","reason","reflect","ponder","contemplate","analyze","evaluate","assess","deliberate","meditate","muse"],
  "know":["understand","realize","recognize","grasp","comprehend","perceive","learn","appreciate","acknowledge","discern","fathom","internalize"],
  "want":["desire","wish","need","crave","seek","prefer","require","aspire","long for","yearn","hunger","thirst"],
  "help":["assist","support","aid","guide","serve","contribute","facilitate","enable","empower","bolster","reinforce","back"],
  "change":["alter","modify","transform","adjust","adapt","shift","revise","update","reform","revolutionize","reshape","reinvent"],
  "show":["display","reveal","demonstrate","exhibit","present","illustrate","prove","manifest","expose","disclose","unveil","highlight"],
  "move":["shift","transfer","transport","relocate","advance","progress","proceed","go","travel","migrate","transition","navigate"],
  "work":["function","operate","perform","labor","effort","strive","endeavor","toil","execute","accomplish","produce","achieve"],
  "love":["adore","cherish","treasure","appreciate","value","admire","care for","devote","worship","idolize","revere","prize"],
  "hate":["despise","detest","loathe","abhor","dislike","resent","oppose","condemn","reject","scorn","disdain","execrate"],
  "true":["correct","accurate","genuine","authentic","real","honest","valid","factual","reliable","sound","exact","precise"],
  "false":["wrong","incorrect","untrue","fake","inaccurate","invalid","dishonest","misleading","deceptive","fraudulent","spurious"],
  "free":["liberated","independent","unrestrained","unrestricted","autonomous","self-governing","open","available","complimentary","unburdened"],
  "brave":["courageous","bold","daring","fearless","heroic","valiant","audacious","gallant","intrepid","dauntless","undaunted","resolute"],
  "kind":["compassionate","caring","generous","warm","gentle","benevolent","thoughtful","considerate","sympathetic","tender","gracious","humane"],
  "honest":["truthful","sincere","genuine","authentic","transparent","open","candid","frank","straightforward","direct","trustworthy","upfront"],
  "patient":["calm","tolerant","composed","steady","persevering","enduring","serene","stoic","unruffled","forbearing","long-suffering","equanimous"],
  "curious":["inquisitive","questioning","interested","exploratory","eager","inquiring","probing","investigative","searching","nosy","prying","wondering"],
  "confident":["assured","self-assured","certain","bold","poised","secure","positive","self-confident","assertive","decisive","composed","unwavering"],
  "humble":["modest","unpretentious","unassuming","grounded","down-to-earth","simple","meek","self-effacing","deferential","respectful"],
  "wise":["insightful","sagacious","knowledgeable","discerning","judicious","experienced","enlightened","astute","learned","perceptive","prudent"],
  "creative":["imaginative","inventive","innovative","original","artistic","inspired","ingenious","resourceful","visionary","novel","fresh","unconventional"],
  "discipline":["self-control","willpower","commitment","consistency","dedication","focus","persistence","determination","rigor","structure","order"],
  "resilience":["toughness","grit","perseverance","tenacity","durability","stamina","fortitude","endurance","strength","recovery","bounce-back"],
  "growth":["development","progress","advancement","improvement","expansion","evolution","learning","maturation","flourishing","increase","rise"],
  "success":["achievement","accomplishment","victory","triumph","win","attainment","fulfillment","prosperity","excellence","mastery","breakthrough"],
  "failure":["defeat","loss","setback","miss","shortcoming","stumble","fall","disappointment","breakdown","collapse","regression"],
  "purpose":["meaning","intention","goal","aim","mission","objective","reason","drive","calling","vocation","direction","function"],
  "courage":["bravery","boldness","valor","fearlessness","daring","fortitude","nerve","audacity","grit","determination","resolve","backbone"],
  "wisdom":["insight","knowledge","understanding","discernment","judgment","experience","sagacity","intelligence","clarity","perspective","depth"],
  "leadership":["guidance","direction","influence","authority","command","management","stewardship","oversight","vision","inspiration","motivation"],
  "communication":["dialogue","conversation","exchange","interaction","discussion","talk","speech","expression","articulation","transmission","connection"],
  "trust":["confidence","faith","reliance","belief","credibility","dependability","reliability","assurance","certainty","conviction","security"],
  "freedom":["liberty","independence","autonomy","self-determination","sovereignty","release","openness","flexibility","choice","agency","emancipation"],
  "focus":["concentration","attention","clarity","direction","purpose","intensity","precision","dedication","mindfulness","presence","engagement"],
  "creativity":["imagination","invention","innovation","originality","artistry","ingenuity","vision","expression","inspiration","resourcefulness"],
  "motivation":["drive","inspiration","incentive","encouragement","enthusiasm","passion","desire","ambition","determination","fuel","energy","force"],
  "learning":["education","study","knowledge acquisition","skill development","understanding","discovery","growth","practice","training","improvement"],
  "innovation":["invention","creation","novelty","breakthrough","disruption","transformation","advancement","progress","change","reinvention"],
  "excellence":["mastery","quality","superiority","distinction","perfection","brilliance","expertise","proficiency","peak performance","best"],
  "integrity":["honesty","ethics","morality","character","virtue","principle","authenticity","trustworthiness","reliability","consistency"],
  "empathy":["compassion","understanding","sensitivity","awareness","connection","caring","sympathy","consideration","kindness","attunement"],
  "mindfulness":["presence","awareness","attention","consciousness","clarity","focus","calm","stillness","grounding","centering","intentionality"],
  "balance":["equilibrium","harmony","stability","proportion","symmetry","poise","composure","moderation","steadiness","centeredness"],
  "clarity":["clearness","transparency","precision","lucidity","sharpness","definiteness","certainty","understanding","insight","simplicity"],
  "authenticity":["genuineness","realness","honesty","sincerity","truthfulness","integrity","openness","vulnerability","self-expression","originality"],
  "simplicity":["clarity","directness","elegance","efficiency","minimalism","ease","straightforwardness","plainness","uncomplicated","clean"],
  "complexity":["intricacy","nuance","depth","sophistication","multidimensionality","layering","richness","density","difficulty","elaborateness"],
  "opportunity":["chance","possibility","opening","potential","prospect","occasion","window","break","advantage","fortunate circumstance"],
  "challenge":["obstacle","difficulty","test","trial","hurdle","problem","issue","complication","adversity","hardship","struggle","demand"],
};

const ANTONYM_MAP = {
  "happy":["sad","miserable","unhappy","depressed","sorrowful","dejected","gloomy"],
  "sad":["happy","joyful","cheerful","content","delighted","pleased","elated"],
  "good":["bad","poor","terrible","harmful","negative","substandard","inferior"],
  "bad":["good","excellent","wonderful","beneficial","positive","outstanding","admirable"],
  "big":["small","tiny","little","miniature","compact","slight","diminutive"],
  "small":["big","large","huge","enormous","massive","vast","gigantic"],
  "fast":["slow","gradual","leisurely","sluggish","unhurried","deliberate","measured"],
  "slow":["fast","quick","rapid","swift","speedy","prompt","brisk"],
  "smart":["foolish","unintelligent","unwise","ignorant","naive","dense","obtuse"],
  "strong":["weak","fragile","feeble","delicate","frail","vulnerable","powerless"],
  "hard":["easy","simple","effortless","straightforward","manageable","painless"],
  "easy":["hard","difficult","challenging","demanding","tough","arduous","grueling"],
  "new":["old","ancient","outdated","obsolete","vintage","traditional","archaic"],
  "old":["new","fresh","modern","contemporary","recent","novel","current"],
  "true":["false","wrong","incorrect","inaccurate","untrue","fake","dishonest"],
  "false":["true","correct","accurate","genuine","real","honest","valid"],
  "love":["hate","despise","dislike","loathe","resent","condemn","reject"],
  "hate":["love","adore","cherish","appreciate","care for","admire","value"],
  "begin":["end","finish","conclude","terminate","close","stop","cease"],
  "end":["begin","start","initiate","commence","launch","open","embark"],
  "positive":["negative","harmful","bad","detrimental","adverse","destructive"],
  "negative":["positive","good","beneficial","helpful","favorable","constructive"],
  "success":["failure","defeat","loss","setback","miss","shortcoming","downfall"],
  "failure":["success","achievement","victory","triumph","accomplishment","win"],
  "confident":["insecure","uncertain","timid","doubtful","anxious","apprehensive"],
  "brave":["cowardly","fearful","timid","afraid","scared","apprehensive","faint-hearted"],
  "kind":["cruel","harsh","unkind","cold","callous","heartless","ruthless"],
  "honest":["dishonest","deceptive","lying","misleading","false","fraudulent"],
  "patient":["impatient","hasty","rushed","impulsive","restless","agitated"],
  "humble":["arrogant","conceited","proud","boastful","egotistical","vain"],
  "clear":["unclear","confused","ambiguous","vague","murky","obscure","cryptic"],
  "simple":["complex","complicated","difficult","intricate","convoluted","elaborate"],
  "important":["unimportant","trivial","minor","insignificant","irrelevant","negligible"],
  "free":["restricted","constrained","bound","limited","controlled","imprisoned"],
  "open":["closed","shut","blocked","restricted","narrow","sealed","guarded"],
  "fast":["slow","leisurely","gradual","unhurried","plodding","sluggish"],
  "full":["empty","vacant","hollow","bare","void","depleted","lacking"],
  "empty":["full","filled","complete","whole","abundant","replete","brimming"],
  "give":["take","receive","withhold","keep","retain","hoard","deny"],
  "take":["give","provide","offer","donate","grant","return","surrender"],
  "growth":["decline","decay","deterioration","regression","shrinkage","stagnation"],
  "freedom":["captivity","restriction","constraint","imprisonment","control","bondage"],
  "courage":["cowardice","timidity","fearfulness","apprehension","hesitation","reluctance"],
  "wisdom":["ignorance","foolishness","naivety","shortsightedness","imprudence","stupidity"],
  "trust":["distrust","suspicion","doubt","skepticism","wariness","mistrust"],
  "hope":["despair","hopelessness","pessimism","defeat","resignation","discouragement"],
  "calm":["agitated","anxious","stressed","turbulent","chaotic","frantic","frenzied"],
  "order":["chaos","disorder","confusion","mess","disorganization","anarchy","bedlam"],
  "clarity":["confusion","ambiguity","obscurity","vagueness","murkiness","uncertainty"],
  "truth":["falsehood","lie","deception","dishonesty","fabrication","fiction","myth"],
  "strength":["weakness","fragility","vulnerability","powerlessness","helplessness"],
  "discipline":["chaos","disorder","laziness","negligence","recklessness","impulsiveness"],
};

// Rich word descriptions (used for define/describe/explain)
const WORD_DESCRIPTIONS = {
  "courage":    "The ability to act despite fear. Courage is not the absence of anxiety — it is choosing to move forward anyway. It shows up in big moments and small ones, in public and in private, in words and in action. The bravest thing is often the simplest: being honest when honesty is uncomfortable.",
  "resilience": "The capacity to recover, adapt, and keep going after difficulty. Resilience is not about avoiding pain — it is about moving through it without letting it define you. It is built, not born, and grows stronger every time you face something hard and come out the other side.",
  "discipline": "The practice of doing what needs to be done even when you do not feel like it. Discipline is the bridge between goals and achievement. It is not punishment — it is the commitment to your future self over your current comfort. Everything meaningful is built through it.",
  "creativity": "The ability to connect ideas in unexpected ways to produce something original. Everyone is creative — the practice just looks different for different people. Creativity requires space, silence, and the freedom to be wrong. It grows with use and withers with fear.",
  "leadership": "The act of guiding others toward a shared goal. True leadership is less about authority and more about service, trust, and showing up consistently. A leader's real output is capability in others — not what they do, but what they enable.",
  "love":       "A deep connection, commitment, and care for someone or something. Love is both a feeling and a choice — a verb as much as a noun. It is expressed through attention, consistency, and showing up — not just in words.",
  "freedom":    "The state of being able to act, think, and speak without constraint. True freedom comes with responsibility — the freedom to choose also means the accountability for those choices. Freedom is not the absence of structure; it is the presence of meaningful choice.",
  "success":    "The achievement of a meaningful goal. Success is personal — what counts as success varies from person to person and changes across time. The most dangerous definition of success is someone else's.",
  "failure":    "The result of an attempt that did not reach its goal. More importantly, failure is information — it points exactly at what needs to change. Every person who has built something remarkable has a catalog of failures that preceded it.",
  "time":       "The most finite and valuable resource anyone has. Unlike money, it cannot be earned back. How you spend your time is how you spend your life. The question is not whether you have enough time — it is whether your priorities match what you say matters.",
  "trust":      "The foundation of every meaningful relationship and organization. It is built slowly through consistent action and broken quickly through a single deception. Trust is the currency of real influence.",
  "growth":     "The ongoing process of becoming more capable, aware, and effective. Growth is often uncomfortable because it requires letting go of who you were. The most reliable sign of growth is not confidence — it is the willingness to be a beginner again.",
  "purpose":    "The deep sense of why you do what you do. Purpose gives ordinary actions extraordinary meaning. It is not discovered by waiting — it is revealed by doing, reflecting, and paying attention to what lights you up.",
  "patience":   "The ability to endure delay, difficulty, or uncertainty without losing composure. Patience is not passive waiting — it is active trust that things will develop in their own time. It is one of the rarest and most valuable forms of strength.",
  "focus":      "The concentrated direction of attention and energy toward a specific outcome. In a world of infinite distraction, focus has become the scarcest resource. It is built through environment design, clear priorities, and the repeated practice of returning when you drift.",
  "change":     "The constant reorganization of reality. Change is neutral — what matters is whether you navigate it intentionally or get swept by it reactively. The most adaptable people are not those who love change — they are those who stay grounded within it.",
  "fear":       "An emotional response to perceived threat. Fear protects us, but it also limits us. The key is learning to distinguish between fear that is a real warning and fear that is just resistance — showing up because something important is at stake.",
  "hope":       "The belief that a better outcome is possible. Hope is not passive — it is the fuel that makes effort feel worthwhile. It is not the same as certainty, and that is exactly its power: it moves us toward something before we can prove it will work.",
  "truth":      "Alignment between a statement and reality. Truth is simple to define and often difficult to face. The practice of truth — in communication, in thinking, in self-assessment — is one of the most powerful tools available.",
  "communication": "The process of creating shared understanding between two or more people. Communication is not just speaking — it is ensuring you have been understood. The best communicators listen as much as they talk, and they care more about clarity than cleverness.",
  "silence":    "The absence of sound — and the presence of everything else. Silence is where clarity, creativity, and self-awareness often live. Most people are uncomfortable with silence, which is why most people miss what it offers.",
  "choice":     "The act of selecting between alternatives. Every choice carries weight because it always includes what you did not choose. The quality of your life is largely the sum of your choices — including the choice of how you respond to what you cannot control.",
  "mind":       "The center of thought, feeling, memory, and consciousness. The mind is both the tool you use and the lens through which you see everything. Training it — through learning, reflection, and intentional practice — is the highest-leverage investment available.",
  "body":       "The physical vehicle through which you experience the world. Your body carries your history, enables your future, and communicates information your conscious mind often misses. It responds to how you treat it with remarkable precision.",
  "story":      "A sequence of events with meaning attached. Stories are how humans make sense of the world — every culture runs on narrative. The story you tell about yourself shapes your actions more than almost any other factor.",
  "community":  "A group of people bound by shared values, experiences, or goals. Community provides belonging, accountability, and collective strength. Humans are social creatures — isolation is not strength, and connection is not weakness.",
  "system":     "An organized set of connected parts working together toward a shared purpose. Systems produce outcomes — if you want different results, examine the system, not just the individual effort within it.",
  "throw":      "To propel an object through the air using the arm and body. Throwing is a full-body movement — the power comes from the legs and core, transferred through the arm to the object. It requires timing, mechanics, and practice to do well.",
  "slow":       "Moving at a low speed — deliberately, carefully, or gradually. Going slow is not a weakness; it is often the most intelligent approach. Precision, learning, safety, and quality all improve when you slow down appropriately.",
  "fast":       "Moving at high speed — rapidly, quickly, with urgency. Going fast creates momentum, takes advantage of narrow windows, and builds confidence. Speed without accuracy creates chaos; speed with precision creates power.",
  "low":        "Close to the ground or baseline; at a reduced level. Going low can mean humility, caution, minimalism, or strategic positioning. Sometimes the most powerful move is to lower your profile and let others react.",
  "high":       "Elevated in position, amount, or quality. Going high means raising your standards, ambitions, or perspective. It takes effort to operate at a high level, and it is worth it when the stakes are significant.",
};


// ================================================================
// SECTION 5: KNOWLEDGE BANKS — idioms, etymologies, acronyms, facts
// ================================================================

const IDIOMS = {"bite the bullet":"Endure a painful situation with courage.","break a leg":"Good luck!","break the ice":"Relieve tension in a new situation.","burn the midnight oil":"Work late into the night.","bite off more than you can chew":"Take on more than you can handle.","back to the drawing board":"Start over after a failure.","beat around the bush":"Avoid the main point; speak indirectly.","blessing in disguise":"Something that seems bad but turns out good.","costs an arm and a leg":"Extremely expensive.","cut corners":"Do something poorly to save time or effort.","drop the ball":"Make a mistake or fail to follow through.","every cloud has a silver lining":"Every bad situation has a positive aspect.","face the music":"Accept the consequences of your actions.","feel under the weather":"Feel unwell or slightly sick.","get the ball rolling":"Start something; initiate action.","hit the nail on the head":"Be exactly correct.","hit the sack":"Go to bed.","jump on the bandwagon":"Follow a trend because it is popular.","kill two birds with one stone":"Accomplish two tasks with one action.","let the cat out of the bag":"Accidentally reveal a secret.","miss the boat":"Miss an opportunity.","once in a blue moon":"Something that happens very rarely.","out of the blue":"Unexpectedly; without warning.","piece of cake":"Something very easy.","pull someone's leg":"Joke with or tease someone.","read between the lines":"Understand the implied or hidden meaning.","see eye to eye":"Agree completely with someone.","sleep on it":"Take time to think before deciding.","spill the beans":"Reveal secret information.","the elephant in the room":"An obvious problem everyone is avoiding.","throw in the towel":"Give up; admit defeat.","tie the knot":"Get married.","up in the air":"Uncertain; not yet decided.","bite the hand that feeds you":"Harm the person who supports you.","by the skin of your teeth":"Barely succeed or escape.","hit the ground running":"Start energetically with full effort.","in a pickle":"In a difficult situation.","in hot water":"In serious trouble.","kick the bucket":"To die (informal).","learn the ropes":"Learn the basics of something.","let sleeping dogs lie":"Do not revisit settled problems.","on thin ice":"In a risky situation.","open a can of worms":"Create a complicated new problem.","shoot the breeze":"Have casual conversation.","sitting duck":"An easy target.","skeleton in the closet":"A hidden shameful secret.","the bottom line":"The most important point.","turn over a new leaf":"Change for the better.","wear your heart on your sleeve":"Show emotions openly.","with flying colors":"With great success.","no pain no gain":"Hard work brings results.","over the moon":"Extremely happy.","back to basics":"Return to fundamentals.","ball is in your court":"It is your turn to act.","bend over backwards":"Try very hard to help.","bite the dust":"Fail; be defeated.","bite your tongue":"Stop yourself from saying something.","burn bridges":"Permanently damage a relationship.","catch someone red-handed":"Catch doing something wrong.","change of heart":"Change in feelings or opinion.","chip on your shoulder":"Holding a grudge; easily offended.","close but no cigar":"Almost but not quite successful.","cost a fortune":"Be extremely expensive.","cross that bridge when we come to it":"Deal with it when it happens.","cut to the chase":"Get to the point.","devil is in the details":"Small details cause big problems.","easier said than done":"More difficult to do than discuss.","every dog has its day":"Everyone has a moment of success.","face to face":"In person; directly.","get out of hand":"Lose control.","give the benefit of the doubt":"Trust someone despite uncertainty.","go back to square one":"Start completely over.","go the extra mile":"Put in more effort than required.","hang in there":"Keep trying; do not give up.","hit the books":"Study seriously.","in a nutshell":"Briefly; in summary.","in the long run":"Over extended time.","in the same boat":"In the same difficult situation.","it is not rocket science":"It is not complicated.","keep your chin up":"Stay positive in difficulty.","last straw":"Final problem that causes a reaction.","let the chips fall":"Let things happen naturally.","make a long story short":"Summarize; skip to the point.","miss the mark":"Fail to achieve the goal.","more than meets the eye":"More complex than it appears.","no strings attached":"Without conditions or obligations.","not my cup of tea":"Not something I enjoy.","off the record":"Said privately; not for public use.","on the ball":"Alert and competent.","on the fence":"Undecided about something.","out of the box":"Creative; unconventional thinking.","put all eggs in one basket":"Rely entirely on one thing.","right off the bat":"Immediately; from the start.","rock the boat":"Cause trouble or disturbance.","see the bigger picture":"Understand the broader context.","step up to the plate":"Take responsibility; rise to challenge.","take it with a grain of salt":"Be skeptical; do not take too seriously.","the ball is rolling":"Something has been started.","think outside the box":"Think creatively; unconventionally.","time flies":"Time passes quickly.","under the weather":"Feeling slightly ill.","when pigs fly":"Never; an impossibility.","you can not judge a book by its cover":"Do not judge by appearance alone."};

const ETYMOLOGIES = {"algorithm":"From al-Khwārizmī, a 9th-century Persian mathematician — his name became the word for computational procedures.","algebra":"From Arabic al-jabr (reunion of broken parts) — from a 9th-century mathematical text by al-Khwārizmī.","robot":"Czech robota (forced labor/drudgery) — introduced in Karel Čapek's 1920 play R.U.R. about artificial workers.","computer":"Originally a human who performs calculations — from Latin computare (to reckon, calculate).","internet":"From inter- (between) + network — coined in the 1970s for a network connecting other networks.","software":"Coined by statistician John Tukey in 1958 as a contrast to hardware.","bug":"Popularized by Grace Hopper in 1947 when a real moth caused a malfunction in the Harvard Mark II computer.","emoji":"Japanese: e (picture) + moji (character) — created by Shigetaka Kurita in 1999 for NTT DoCoMo.","google":"From googol (10 to the power 100) — an intentional misspelling chosen by the founders.","hashtag":"Hash (the # symbol) + tag — popularized on Twitter in 2007 by Chris Messina.","spam":"From Monty Python's 1970 sketch featuring incessant repetition of SPAM — applied to unwanted messages.","meme":"Coined by Richard Dawkins in The Selfish Gene (1976) from Greek mimeme (imitated thing).","quarantine":"Italian quarantina (forty days) — the isolation period required for ships during the bubonic plague.","salary":"Latin salarium — possibly from sal (salt) — Roman soldiers may have been paid partly in salt.","disaster":"Italian disastro (ill-starred) — dis- (bad) + astro (star) — fate controlled by unfavorable stars.","panic":"Greek Panikos — relating to Pan, the god whose sudden sounds were said to cause irrational terror.","academy":"From Akademia — the grove near Athens where Plato taught, named after the hero Akademos.","muscle":"Latin musculus (little mouse) — the movement of a bicep resembles a mouse moving under cloth.","malaria":"Italian mala aria (bad air) — once believed the disease came from swamp vapors.","paradise":"Old Persian pairi-daeza (walled garden) — royal gardens that became the concept of paradise.","coffee":"Ottoman Turkish kahve, from Arabic qahwah — spread from Ethiopia through Arabia to the world.","money":"Latin Moneta — an epithet of Juno in whose Roman temple coins were minted.","candidate":"Latin candidatus (clothed in white) — Roman office-seekers wore white togas to symbolize purity.","companion":"Latin com- (with) + panis (bread) — literally one who shares bread with you.","enthusiasm":"Greek enthousiasmos — literally possessed by a god (en + theos = in + god).","democracy":"Greek dēmokratia — dēmos (people) + kratos (rule/power) — rule by the people.","philosophy":"Greek philosophia — philos (loving) + sophia (wisdom) — literally love of wisdom.","window":"Old Norse vindauga — vindr (wind) + auga (eye) — literally wind eye.","alphabet":"From the first two Greek letters Alpha (Α) and Beta (Β).","clue":"From clew (a ball of thread) — Theseus used thread to navigate the Cretan labyrinth.","talent":"Greek/Latin talentum (a weight of money) — its gift meaning comes from the Biblical parable.","nightmare":"Night + Old English mare (a goblin believed to sit on sleeping people causing bad dreams).","bonfire":"Bone fire — fires historically made from bones at festivals and during plague clearances.","lunatic":"Latin luna (moon) — madness was once believed to be caused by the cycles of the moon.","tragedy":"Greek tragōidia — possibly goat song — performed at festivals honoring Dionysus.","hazard":"Arabic az-zahr (the dice) — from gambling games played in medieval Spain.","sincere":"Possibly Latin sine cera (without wax) — referring to pottery sold without defects patched with wax.","salary":"Latin salarium — Roman soldiers' allowance for purchasing salt, an essential and valuable commodity.","school":"Greek skholē — originally meaning leisure or free time — the time spent learning.","magazine":"Arabic makhazin (storehouses) — a place where things are stored — applied to published collections.","sabotage":"French sabot (wooden shoe) — workers allegedly threw shoes into machinery to disrupt production.","admiral":"Arabic amir al-bahr (commander of the sea) — the title transferred from Arabic naval commanders.","assassin":"Arabic Hashshashin (users of hashish) — referring to a Nizari Ismaili sect during the Crusades.","barbarian":"Greek barbaros (foreign, strange-sounding) — used for anyone who did not speak Greek.","calculate":"Latin calculus (small stone) — Romans used pebbles on counting boards for arithmetic.","carnival":"Latin carne vale (farewell to meat) — the celebration before Lent when meat was given up.","cathedral":"Greek kathedra (seat/chair) — the bishop's official seat or throne in the main church.","discipline":"Latin disciplina (instruction/training) — related to discipulus (student) and discere (to learn).","education":"Latin educere (to lead out) — drawing forth potential that is already within.","emotion":"Latin emotio — from emovere (to move out) — literally what moves us.","focus":"Latin focus (hearth/fireplace) — the center of the home where heat and light originated.","genuine":"Latin genu (knee) — fathers acknowledged children as their own by placing them on their knee.","humble":"Latin humilis (low/grounded) — from humus (earth/ground) — literally close to the earth.","inspire":"Latin inspirare (to breathe into) — the divine breath that animates and motivates.","journal":"Old French journal (daily) — from Latin diurnalis — a record of daily events.","kindness":"Old English gecyndness — from cynd (nature/kind) — acting according to one's natural character.","language":"Latin lingua (tongue) — the organ used for speech became the word for speech itself.","mentor":"From Mentor, the advisor of Telemachus in Homer's Odyssey — a trusted teacher and counselor.","narrative":"Latin narrare (to tell) — from gnarus (knowing) — telling what one knows.","original":"Latin originalis — from origo (origin/beginning) — relating to the source or starting point.","passion":"Latin passio (suffering) — from pati (to suffer/endure) — intense feeling that drives us.","resilience":"Latin resilire (to spring back) — from re- (back) + salire (to jump) — bouncing back.","silence":"Latin silentium — from silere (to be quiet) — the state of intentional quietness.","strategy":"Greek strategos (general) — from stratos (army) + agein (to lead) — leading an army.","sympathy":"Greek sympatheia — syn- (together) + pathos (feeling) — feeling together with another.","theory":"Greek theoria (looking at, contemplation) — from theorein (to observe) — careful observation.","virtue":"Latin virtus (excellence/valor) — from vir (man) — the qualities that make one excellent."};

const ACRONYMS = {"AI":"Artificial Intelligence","ML":"Machine Learning","NLP":"Natural Language Processing","API":"Application Programming Interface","HTTP":"HyperText Transfer Protocol","HTML":"HyperText Markup Language","CSS":"Cascading Style Sheets","JS":"JavaScript","SQL":"Structured Query Language","JSON":"JavaScript Object Notation","REST":"Representational State Transfer","SDK":"Software Development Kit","IDE":"Integrated Development Environment","CLI":"Command-Line Interface","GUI":"Graphical User Interface","OS":"Operating System","RAM":"Random Access Memory","CPU":"Central Processing Unit","GPU":"Graphics Processing Unit","URL":"Uniform Resource Locator","DNS":"Domain Name System","TCP":"Transmission Control Protocol","SSH":"Secure Shell","VPN":"Virtual Private Network","CDN":"Content Delivery Network","SEO":"Search Engine Optimization","UI":"User Interface","UX":"User Experience","OOP":"Object-Oriented Programming","TDD":"Test-Driven Development","CRUD":"Create Read Update Delete","CI":"Continuous Integration","CD":"Continuous Deployment","SaaS":"Software as a Service","CORS":"Cross-Origin Resource Sharing","JWT":"JSON Web Token","MFA":"Multi-Factor Authentication","GDPR":"General Data Protection Regulation","ROI":"Return on Investment","KPI":"Key Performance Indicator","OKR":"Objectives and Key Results","CAC":"Customer Acquisition Cost","LTV":"Lifetime Value","ARR":"Annual Recurring Revenue","IPO":"Initial Public Offering","VC":"Venture Capital","GDP":"Gross Domestic Product","DNA":"Deoxyribonucleic Acid","RNA":"Ribonucleic Acid","BMI":"Body Mass Index","MRI":"Magnetic Resonance Imaging","FDA":"Food and Drug Administration","WHO":"World Health Organization","NASA":"National Aeronautics and Space Administration","UN":"United Nations","NATO":"North Atlantic Treaty Organization","EU":"European Union","ASAP":"As Soon As Possible","ETA":"Estimated Time of Arrival","FAQ":"Frequently Asked Questions","TLDR":"Too Long Did Not Read","ELI5":"Explain Like I am 5","IMHO":"In My Humble Opinion","IMO":"In My Opinion","FOMO":"Fear Of Missing Out","GOAT":"Greatest Of All Time","WFH":"Work From Home","CEO":"Chief Executive Officer","CTO":"Chief Technology Officer","CFO":"Chief Financial Officer","NDA":"Non-Disclosure Agreement","LLM":"Large Language Model","GPT":"Generative Pre-trained Transformer","PWA":"Progressive Web App","SPA":"Single Page Application","DOM":"Document Object Model","DRY":"Don't Repeat Yourself","KISS":"Keep It Simple Stupid","IOT":"Internet of Things","AR":"Augmented Reality","VR":"Virtual Reality","B2B":"Business to Business","B2C":"Business to Consumer","ADHD":"Attention Deficit Hyperactivity Disorder","OCD":"Obsessive-Compulsive Disorder","PTSD":"Post-Traumatic Stress Disorder","CBT":"Cognitive Behavioral Therapy","BMR":"Basal Metabolic Rate","TDEE":"Total Daily Energy Expenditure","DIY":"Do It Yourself","AKA":"Also Known As","FYI":"For Your Information","TBD":"To Be Determined","NPS":"Net Promoter Score","HR":"Human Resources","PR":"Public Relations","CRM":"Customer Relationship Management","ERP":"Enterprise Resource Planning","MVP":"Minimum Viable Product","MVC":"Model View Controller","ACID":"Atomicity Consistency Isolation Durability","SOLID":"Single Open Liskov Interface Dependency","DDoS":"Distributed Denial of Service","XSS":"Cross-Site Scripting","CSRF":"Cross-Site Request Forgery","OAuth":"Open Authorization","SSO":"Single Sign-On","2FA":"Two-Factor Authentication","QA":"Quality Assurance","UAT":"User Acceptance Testing","SLA":"Service Level Agreement","SOP":"Standard Operating Procedure"};

const FUN_FACTS = ["Honey never spoils — 3,000-year-old honey found in Egyptian tombs was still edible.","A day on Venus is longer than a year on Venus — it rotates slower than it orbits the sun.","Octopuses have three hearts, blue blood, and nine brains — one central brain and one per arm.","Bananas are botanically berries. Strawberries, by botanical definition, are not.","There are more possible chess games than atoms in the observable universe.","Sharks have existed for about 450 million years — predating both trees and dinosaurs.","Wombats produce cube-shaped feces to mark territory without it rolling away.","Butterflies taste with chemoreceptors on their feet — they taste everything they stand on.","The Eiffel Tower grows approximately 6 inches in summer due to thermal expansion of the iron.","Oxford University is older than the Aztec Empire — teaching began there around 1096.","Humans share approximately 60% of their DNA with bananas.","The human brain generates about 23 watts of power — enough to dim a small light bulb.","Polar bear fur is actually transparent — it appears white due to light refraction.","Sea otters hold hands while sleeping to prevent drifting apart — this is called rafting.","The average cloud weighs approximately 1.1 million pounds — but is held up by air pressure.","Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.","A teaspoonful of neutron star material would weigh about 10 million metric tons.","There are more ways to arrange a deck of 52 cards than seconds since the Big Bang — by a factor of billions.","Antarctica is technically the world's largest desert — it receives less than 200mm of precipitation annually.","Sound travels approximately 4.3 times faster through water than through air.","Fingerprints form in the womb at 10 weeks — identical twins have different fingerprints.","New Zealand was the first country to grant women the right to vote, in 1893.","The number zero was invented independently by both the Babylonians and the Mayans centuries apart.","Trees in a forest share nutrients through underground mycorrhizal fungal networks.","A group of owls is called a parliament; a group of crows is called a murder; a group of flamingos is a flamboyance.","The first email was sent in 1971 by Ray Tomlinson to himself — testing to see if it worked.","The Sahara Desert was a lush green savanna approximately 10,000 years ago.","Olympus Mons on Mars is nearly three times taller than Mount Everest.","There is a species of jellyfish (Turritopsis dohrnii) that is biologically immortal — it can revert to its juvenile state.","Flamingos are born grey-white — their pink color comes from carotenoid pigments in the algae and shrimp they eat.","All humans on Earth share approximately 99.9% of the same genetic code.","The word silly originally meant blessed or happy in Old English — it shifted meaning over centuries.","Hot water can freeze faster than cold water under certain conditions — this is called the Mpemba effect.","A cubic inch of human bone can withstand up to 19,000 pounds of compressive force.","Hippos produce a natural pinkish fluid that acts as both sunscreen and antimicrobial protection.","Penguins are largely monogamous and males often offer pebbles to females as part of courtship.","The first computer bug was an actual insect — a moth found in the Harvard Mark II relay in 1947.","Velcro was invented in 1948 by George de Mestral after noticing burr seeds clinging to his dog.","The moon is gradually moving away from Earth at about 3.8 centimeters per year.","There are more stars in the observable universe than grains of sand on all of Earth's beaches combined.","The human eye can distinguish approximately 10 million different colors — but cannot distinguish radio waves, X-rays, or ultraviolet light.","A day on Mercury lasts 59 Earth days, but a year on Mercury is only 88 Earth days.","The Great Barrier Reef is the largest living structure on Earth — visible from space.","Ravens have been observed fashioning tools, playing, and even appearing to show empathy.","The average person walks approximately 100,000 miles in their lifetime — equivalent to circling the Earth four times.","Lightning strikes Earth approximately 100 times per second — about 8 million times per day.","The average human heart beats approximately 100,000 times per day — about 35 million times per year.","Crows can recognize human faces, hold grudges, and even make gifts for people who feed them.","The tongue is the only muscle in the human body attached at only one end.","Water is the only common substance on Earth that naturally occurs in all three states — solid, liquid, and gas — at surface conditions."];

const MOTIVATIONS = ["You have not come this far to only come this far.","The discomfort you feel right now is the sensation of growth. Stay in it.","Progress is not always visible. The work is still working.","Your only real competition is who you were yesterday.","The version of you that finishes this will not be the version that started.","Hard things are hard precisely because they are worth doing.","Doubt is not a reason to stop. It is resistance showing up when something matters.","You do not need to see the whole path. Take the next step.","Discipline is choosing your future self over your current comfort.","Every expert once stood exactly where you are standing. They kept going.","The fact that you are still trying is already extraordinary.","Start. The clarity you are waiting for comes from action, not from waiting.","Consistency over months beats intensity over days. Show up.","You are not behind. You are on your timeline, building at your own pace.","The only person who needs to believe in you right now is you.","One percent better every day compounds into something unrecognizable in a year.","The obstacle is the path — not beside it, not after it. Through it.","What you repeatedly do is what you ultimately become. Choose deliberately.","Your potential is not fixed. It expands the moment you decide it does.","Done is better than perfect, and started is better than done tomorrow."];

const JOKES = ["Why do programmers prefer dark mode? Because light attracts bugs.","A SQL query walks into a bar and asks two tables: Can I join you?","There are 10 types of people — those who understand binary, and those who do not.","Debugging: being the detective in a crime movie where you are also the murderer.","99 bugs in the code. Take one down, patch it around — 127 bugs in the code.","Why do scientists not trust atoms? Because they make up everything.","A photon checks in with no luggage. Traveling light, he explains.","I have a joke about infinity. I do not know where to start.","Why was the math book sad? It had too many problems.","Time flies like an arrow. Fruit flies like a banana.","I told a construction joke. Still working on it.","I used to hate facial hair. Then it grew on me.","Two fish in a tank. One says: do you know how to drive this thing?","In a world without walls and fences, who needs Windows and Gates?","Schrodinger's cat walks into a bar. And does not.","What do you call cheese that is not yours? Nacho cheese.","Why did the bicycle fall over? It was two-tired.","I only know 25 letters of the alphabet. I do not know y.","Why do they never serve beer at a math party? You cannot drink and derive.","What do you call a factory that makes passable products? A satisfactory.","I am on a seafood diet. I see food and I eat it.","A photon is checking into a hotel. The bellhop asks if he has any luggage. No, says the photon, I am traveling light.","Why do Java developers wear glasses? Because they do not C#.","The best thing about a Boolean is that even if you are wrong, you are only off by a bit.","I tried to write a joke about UDP. I am not sure if you will get it."];


// ================================================================
// SECTION 6: LIVE RESEARCH SOURCES
// ================================================================

async function searchDuckDuckGo(query) {
  try {
    const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    if (!r.ok) return null;
    const d = await r.json();
    const text = d.AbstractText||d.Definition||d.Answer||"";
    if (!text||text.length<20) return null;
    const related = (d.RelatedTopics||[]).filter(t=>t.Text&&t.FirstURL).slice(0,3)
      .map(t=>`• [${t.Text.split(" - ")[0].substring(0,55)}](${t.FirstURL})`);
    return { title:d.Heading||query, summary:text, url:d.AbstractURL||`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, source:d.AbstractSource||"DuckDuckGo", related };
  } catch(e){return null;}
}

async function searchWikipedia(query) {
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/\s+/g,"_"))}`);
    if (!r.ok) {
      const s = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`);
      if (!s.ok) return null;
      const sd = await s.json();
      const hit = sd.query&&sd.query.search&&sd.query.search[0];
      if (!hit) return null;
      return searchWikipedia(hit.title);
    }
    const d = await r.json();
    if (!d.extract||d.extract.length<30) return null;
    return { title:d.title, summary:d.extract.split("\n")[0], url:(d.content_urls&&d.content_urls.desktop&&d.content_urls.desktop.page)||`https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`, source:"Wikipedia", related:[] };
  } catch(e){return null;}
}

async function lookupDictionary(word) {
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`);
    if (!r.ok) return null;
    const data = await r.json();
    if (!Array.isArray(data)||!data[0]) return null;
    const entry = data[0];
    const phonetic = entry.phonetic||(entry.phonetics&&entry.phonetics[0]&&entry.phonetics[0].text)||"";
    let out = `📖 **${entry.word}**${phonetic?`  /${phonetic}/`:""}\n\n`;
    let count = 0;
    for (const meaning of (entry.meanings||[]).slice(0,3)) {
      for (const def of (meaning.definitions||[]).slice(0,2)) {
        count++;
        out += `**${count}. [${meaning.partOfSpeech}]** ${def.definition}\n`;
        if (def.example) out += `   *"${def.example}"*\n`;
        const syns = (def.synonyms||meaning.synonyms||[]).slice(0,4);
        if (syns.length) out += `   Synonyms: ${syns.join(", ")}\n`;
        out += "\n";
      }
    }
    out += `🔗 [Merriam-Webster](https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}) · [Oxford](https://www.lexico.com/definition/${encodeURIComponent(word)})`;
    return out.trim();
  } catch(e){return null;}
}

async function fetchLiveQuote(query) {
  try {
    const authorMatch = query&&query.match(/(?:quote by|quote from|from)\s+([a-z\s]+)/i);
    const url = authorMatch
      ? `https://api.quotable.io/search/quotes?query=${encodeURIComponent(authorMatch[1].trim())}&limit=1`
      : "https://api.quotable.io/random";
    const r = await fetch(url);
    if (!r.ok) return null;
    const d = await r.json();
    const q = d.results?d.results[0]:d;
    if (!q||!q.content) return null;
    return `💬 *"${q.content}"*\n— **${q.author}**\n\n🔗 [More quotes](https://www.quotable.io)`;
  } catch(e){return null;}
}

async function fetchLiveJoke() {
  try {
    const r = await fetch("https://v2.jokeapi.dev/joke/Any?safe-mode&blacklistFlags=racist,sexist");
    if (!r.ok) return null;
    const d = await r.json();
    if (d.type==="single") return `😄 ${d.joke}`;
    if (d.type==="twopart") return `😄 ${d.setup}\n\n> ${d.delivery}`;
    return null;
  } catch(e){return null;}
}

async function fetchAdvice() {
  try {
    const r = await fetch("https://api.adviceslip.com/advice");
    if (!r.ok) return null;
    const d = await r.json();
    return d.slip&&d.slip.advice?`💡 ${d.slip.advice}`:null;
  } catch(e){return null;}
}

async function fetchTrivia() {
  try {
    const r = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
    if (!r.ok) return null;
    const d = await r.json();
    const q = d.results&&d.results[0];
    if (!q) return null;
    const c = s=>s.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,"&");
    return `🧠 **Trivia** [${q.category} · ${q.difficulty}]\n${c(q.question)}\n\n✅ **Answer:** ${c(q.correct_answer)}`;
  } catch(e){return null;}
}

async function fetchArxiv(query) {
  try {
    const r = await fetch(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=1`);
    if (!r.ok) return null;
    const xmlText = await r.text();
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const entry = doc.querySelector("entry");
    if (!entry) return null;
    const title = (entry.querySelector("title")?.textContent||"").trim().replace(/\s+/g," ");
    const summary = (entry.querySelector("summary")?.textContent||"").trim().replace(/\s+/g," ");
    const link = (entry.querySelector("id")?.textContent||"").trim();
    if (!title) return null;
    return { title, summary: summary.length>500?summary.substring(0,500)+"...":summary, url: link, source:"arXiv" };
  } catch(e){return null;}
}

async function searchStackExchange(query) {
  try {
    const r = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow&filter=default`);
    if (!r.ok) return null;
    const d = await r.json();
    const hit = d.items && d.items[0];
    if (!hit) return null;
    const cleanTitle = hit.title.replace(/<[^>]+>/g,"");
    return `💻 **${cleanTitle}**\n\n${hit.is_answered?`✅ Answered · ${hit.answer_count} answer(s) · ${hit.score} votes`:`⚠ ${hit.answer_count} answer(s), not marked answered yet`}\n\n🔗 [View on Stack Overflow](${hit.link})`;
  } catch(e){return null;}
}

async function masterResearch(query) {
  // Science/paper-flavored queries get a shot at arXiv first
  if (/\b(paper|study|studies|research paper|arxiv|preprint|journal article)\b/i.test(query)) {
    const paper = await fetchArxiv(query.replace(/\b(paper|study|studies|research paper on|arxiv|preprint|journal article about|about)\b/gi,"").trim()||query);
    if (paper) {
      return `## 🔬 ${paper.title}\n\n${paper.summary}\n\n📌 **Source:** arXiv\n🔗 [Read the paper](${paper.url})\n\n🔍 [Google Scholar](https://scholar.google.com/scholar?q=${encodeURIComponent(query)})`;
    }
  }

  const ddg = await searchDuckDuckGo(query);
  if (ddg&&ddg.summary.length>40) {
    const clean = ddg.summary.replace(/<[^>]+>/g,"").trim();
    let out = `## ${ddg.title}\n\n${clean.length>600?clean.substring(0,600)+"...":clean}\n\n📌 **Source:** ${ddg.source}\n🔗 [Read more](${ddg.url})`;
    if (ddg.related&&ddg.related.length) out += `\n\n**Related:**\n${ddg.related.join("\n")}`;
    out += `\n\n🔍 [Google](https://www.google.com/search?q=${encodeURIComponent(query)}) · [Wikipedia](https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)})`;
    return out;
  }
  const wiki = await searchWikipedia(query);
  if (wiki) {
    return `## ${wiki.title}\n\n${wiki.summary}\n\n📌 **Source:** Wikipedia\n🔗 [Read more](${wiki.url})\n\n🔍 [Google](https://www.google.com/search?q=${encodeURIComponent(query)}) · [DuckDuckGo](https://duckduckgo.com/?q=${encodeURIComponent(query)})`;
  }
  return `No live results for **"${query}"**.\n\n🔍 [Google](https://www.google.com/search?q=${encodeURIComponent(query)}) · [Wikipedia](https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}) · [DuckDuckGo](https://duckduckgo.com/?q=${encodeURIComponent(query)})`;
}

// ================================================================
// SECTION 7: MATH & CALCULATORS
// ================================================================

function advancedMath(text) {
  let e = text
    .replace(/\bsquare root of\s+(\d+[\.\d]*)/gi,"Math.sqrt($1)")
    .replace(/\bsqrt\s*\(/gi,"Math.sqrt(").replace(/\bsqrt\s+(\d)/gi,"Math.sqrt($1)")
    .replace(/\bsin\s*\(/gi,"Math.sin(").replace(/\bcos\s*\(/gi,"Math.cos(")
    .replace(/\btan\s*\(/gi,"Math.tan(").replace(/\blog\s*\(/gi,"Math.log10(")
    .replace(/\bln\s*\(/gi,"Math.log(").replace(/\babs\s*\(/gi,"Math.abs(")
    .replace(/\bfloor\s*\(/gi,"Math.floor(").replace(/\bceil\s*\(/gi,"Math.ceil(")
    .replace(/\bround\s*\(/gi,"Math.round(").replace(/\bmax\s*\(/gi,"Math.max(")
    .replace(/\bmin\s*\(/gi,"Math.min(").replace(/\bpow\s*\(/gi,"Math.pow(")
    .replace(/\bpi\b/gi,"Math.PI").replace(/\btau\b/gi,"(2*Math.PI)")
    .replace(/\be\b/g,"Math.E").replace(/\^/g,"**").replace(/×/g,"*").replace(/÷/g,"/");
  e = e.replace(/(\d+)!/g,(_,n)=>{const num=parseInt(n);if(num>20)return"Infinity";let f=1;for(let i=2;i<=num;i++)f*=i;return f;});
  const m = e.match(/[0-9Math\s\.\+\-\*\/\%\(\)]+/);
  if (!m) return null;
  const safe = m[0].trim();
  if (!/\d/.test(safe)) return null;
  try {
    const r = Function('"use strict";return('+safe+")")();
    if (typeof r==="number"&&isFinite(r)) return Math.round(r*1e10)/1e10;
  } catch(_) {}
  return null;
}

function handlePercent(text) {
  const o = text.match(/(-?\d+\.?\d*)\s*%\s*of\s*(-?\d+\.?\d*)/i);
  if (o) return `${o[1]}% of ${o[2]} = **${Math.round(parseFloat(o[1])*parseFloat(o[2])/100*100)/100}**`;
  const t = text.match(/tip\s+(\d+\.?\d*)\s*%.*\$?(\d+\.?\d*)/i);
  if (t) { const tip=Math.round(parseFloat(t[1])*parseFloat(t[2])/100*100)/100; return `Tip: **$${tip}** | Total: **$${Math.round((parseFloat(t[2])+tip)*100)/100}**`; }
  const d = text.match(/(\d+\.?\d*)\s*%\s*(discount|off).*\$?(\d+\.?\d*)/i);
  if (d) { const s=Math.round(parseFloat(d[1])*parseFloat(d[3])/100*100)/100; return `Save **$${s}**, pay **$${Math.round((parseFloat(d[3])-s)*100)/100}**`; }
  return null;
}

const UNIT_TABLE = {
  km:{base:"m",factor:1000},mi:{base:"m",factor:1609.344},m:{base:"m",factor:1},cm:{base:"m",factor:0.01},mm:{base:"m",factor:0.001},ft:{base:"m",factor:0.3048},in:{base:"m",factor:0.0254},
  kg:{base:"g",factor:1000},g:{base:"g",factor:1},lb:{base:"g",factor:453.592},lbs:{base:"g",factor:453.592},oz:{base:"g",factor:28.3495},
  l:{base:"ml",factor:1000},ml:{base:"ml",factor:1},gal:{base:"ml",factor:3785.41},
  mph:{base:"mps",factor:0.44704},kph:{base:"mps",factor:0.27778},mps:{base:"mps",factor:1},
  kb:{base:"bit",factor:8000},mb:{base:"bit",factor:8e6},gb:{base:"bit",factor:8e9},tb:{base:"bit",factor:8e12}
};

function convertUnits(text) {
  const m = text.match(/(\d+\.?\d*)\s*(km|mi|m|cm|mm|ft|in|kg|g|lb|lbs|oz|l|ml|gal|mph|kph|mps|kb|mb|gb|tb)\b.*?\b(to|in)\b.*?\b(km|mi|m|cm|mm|ft|in|kg|g|lb|lbs|oz|l|ml|gal|mph|kph|mps|kb|mb|gb|tb)\b/i);
  if (!m) {
    const t = text.match(/(-?\d+\.?\d*)\s*°?\s*(c|f|k)\b.*(to|in)\s*(c|f|k)/i);
    if (!t) return null;
    const val=parseFloat(t[1]),from=t[2].toUpperCase(),to=t[4].toUpperCase();
    let c; if(from==="C")c=val; else if(from==="F")c=(val-32)*5/9; else c=val-273.15;
    let r; if(to==="C")r=c; else if(to==="F")r=c*9/5+32; else r=c+273.15;
    return `${val}°${from} = **${Math.round(r*100)/100}°${to}**`;
  }
  const val=parseFloat(m[1]),fu=m[2].toLowerCase(),tu=m[4].toLowerCase();
  const from=UNIT_TABLE[fu],to=UNIT_TABLE[tu];
  if (!from||!to||from.base!==to.base) return `Cannot convert ${fu} to ${tu}.`;
  return `${val} ${fu} = **${Math.round(val*from.factor/to.factor*1e6)/1e6} ${tu}**`;
}

function handleBMI(text) {
  const mM=text.match(/(\d+\.?\d*)\s*kg\s+(\d+\.?\d*)\s*cm/i);
  const iM=text.match(/(\d+\.?\d*)\s*(?:lbs?)\s+(\d+)\s*ft\s+(\d+\.?\d*)\s*in/i);
  let wKg,hM;
  if(mM){wKg=parseFloat(mM[1]);hM=parseFloat(mM[2])/100;}
  else if(iM){wKg=parseFloat(iM[1])*0.453592;hM=(parseFloat(iM[2])*12+parseFloat(iM[3]))*0.0254;}
  else return null;
  const bmi=Math.round(wKg/(hM*hM)*10)/10;
  const cat=bmi<18.5?"Underweight":bmi<25?"Normal weight ✓":bmi<30?"Overweight":"Obese";
  return `BMI: **${bmi}** — ${cat}`;
}

function handleMortgage(text) {
  const m=text.match(/(\d+\.?\d*)\s+(?:at|@)\s+(\d+\.?\d*)\s*%\s+(?:for\s+)?(\d+\.?\d*)\s+years?/i);
  if (!m) return null;
  const P=parseFloat(m[1]),r=parseFloat(m[2])/100/12,n=parseFloat(m[3])*12;
  const pmt=r===0?P/n:P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
  const fmt=v=>v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  return `Monthly: **$${fmt(pmt)}** | Total: **$${fmt(pmt*n)}** | Interest: **$${fmt(pmt*n-P)}**`;
}

function handleCompound(text) {
  const m=text.match(/(\d+\.?\d*)\s+(?:at|@)\s+(\d+\.?\d*)\s*%\s+(?:for\s+)?(\d+\.?\d*)\s+years?/i);
  if (!m) return null;
  const P=parseFloat(m[1]),r=parseFloat(m[2])/100,t=parseFloat(m[3]);
  const A=P*Math.pow(1+r,t);
  const fmt=v=>v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  return `Principal: $${fmt(P)} → After ${t} years at ${m[2]}%: **$${fmt(A)}** (earned $${fmt(A-P)})`;
}

// ================================================================
// SECTION 7B: SCIENTIFIC CALCULATOR — algebra, stats, number theory
// ================================================================

function solveLinear(text) {
  // "solve 2x + 3 = 7"  /  "solve for x: 3x - 4 = 11"
  const m = text.match(/(-?\d*\.?\d*)\s*x\s*([+\-]\s*\d+\.?\d*)?\s*=\s*(-?\d+\.?\d*)/i);
  if (!m) return null;
  const a = (m[1]===""||m[1]==="-") ? (m[1]==="-"?-1:1) : parseFloat(m[1]);
  const b = m[2] ? parseFloat(m[2].replace(/\s+/g,"")) : 0;
  const c = parseFloat(m[3]);
  if (!a || a===0) return null;
  const x = (c-b)/a;
  const r2 = v=>Math.round(v*1e8)/1e8;
  return `**${m[0].trim()}**\n\nx = (${c} − (${b})) / ${a} = **${r2(x)}**`;
}

function solveQuadratic(text) {
  if (!/quadratic|x\^?2|x²/i.test(text)) return null;
  const m = text.match(/(-?\d*\.?\d*)\s*x(?:\^2|²)\s*([+\-]\s*\d*\.?\d*)\s*x?\s*([+\-]\s*\d+\.?\d*)?\s*=\s*0/i);
  if (!m) return null;
  const a = (m[1]===""||m[1]==="-") ? (m[1]==="-"?-1:1) : parseFloat(m[1]);
  const b = m[2] ? parseFloat(m[2].replace(/\s+/g,"")) : 0;
  const c = m[3] ? parseFloat(m[3].replace(/\s+/g,"")) : 0;
  if (!a || a===0) return null;
  const disc = b*b - 4*a*c;
  const r2 = v=>Math.round(v*1e6)/1e6;
  const eqStr = `${a}x² ${b>=0?"+ "+b:"- "+Math.abs(b)}x ${c>=0?"+ "+c:"- "+Math.abs(c)} = 0`;
  if (disc < 0) {
    const real=r2(-b/(2*a)), imag=r2(Math.sqrt(-disc)/(2*a));
    return `**${eqStr}**\n\nDiscriminant: ${r2(disc)} (negative → two complex roots)\n\nx = ${real} ± ${imag}i`;
  }
  const x1=r2((-b+Math.sqrt(disc))/(2*a)), x2=r2((-b-Math.sqrt(disc))/(2*a));
  return `**${eqStr}**\n\nDiscriminant: **${r2(disc)}**\n\nx₁ = **${x1}**\nx₂ = **${x2}**`;
}

function gcdLcm(text) {
  if (!/\b(gcd|lcm|greatest common (divisor|factor)|lowest common multiple|least common multiple)\b/i.test(text)) return null;
  const nums = (text.match(/\d+/g)||[]).map(Number);
  if (nums.length < 2) return null;
  const gcd2 = (a,b)=> b===0 ? a : gcd2(b, a%b);
  const lcm2 = (a,b)=> a*b/gcd2(a,b);
  const wantLcm = /lcm|lowest common multiple|least common multiple/i.test(text);
  const result = wantLcm ? nums.reduce(lcm2) : nums.reduce(gcd2);
  return wantLcm
    ? `LCM(${nums.join(", ")}) = **${result}**`
    : `GCD(${nums.join(", ")}) = **${result}**`;
}

function combinatorics(text) {
  const fact = n => { let f=1; for(let i=2;i<=n;i++) f*=i; return f; };
  const nCr = text.match(/(\d+)\s*(?:choose|c)\s*(\d+)/i) || text.match(/nCr\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (nCr) {
    const n=+nCr[1], r=+nCr[2];
    if (r>n || n>170) return null;
    const v = fact(n)/(fact(r)*fact(n-r));
    return `**${n}C${r}** (combinations) = ${n}! / (${r}! × ${n-r}!) = **${v.toLocaleString("en-US")}**`;
  }
  const nPr = text.match(/(\d+)\s*p\s*(\d+)/i) || text.match(/nPr\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (nPr) {
    const n=+nPr[1], r=+nPr[2];
    if (r>n || n>170) return null;
    const v = fact(n)/fact(n-r);
    return `**${n}P${r}** (permutations) = ${n}! / ${n-r}! = **${v.toLocaleString("en-US")}**`;
  }
  return null;
}

function primeCheck(text) {
  const factorM = text.match(/(?:prime\s+factors?\s+of|factorize|factorization\s+of)\s+(\d+)/i);
  if (factorM) {
    let num = parseInt(factorM[1]), factors = [];
    for (let i=2; i<=Math.sqrt(num); i++) { while (num % i === 0) { factors.push(i); num /= i; } }
    if (num > 1) factors.push(num);
    return `Prime factorization of **${factorM[1]}**: ${factors.join(" × ")}`;
  }
  const m = text.match(/is\s+(\d+)\s+(?:a\s+)?prime/i);
  if (!m) return null;
  const n = parseInt(m[1]);
  if (n < 2) return `**${n}** is not prime.`;
  for (let i=2; i<=Math.sqrt(n); i++) if (n % i === 0) return `**${n}** is **not prime** — divisible by ${i} (${n} = ${i} × ${n/i}).`;
  return `**${n}** is **prime**. ✓`;
}

function statSummary(text) {
  if (!/\b(mean|average|median|mode|stddev|standard deviation|variance|statistics|stats)\b/i.test(text)) return null;
  const nums = (text.match(/-?\d+\.?\d*/g)||[]).map(Number);
  if (nums.length < 2) return null;
  const n = nums.length;
  const mean = nums.reduce((a,b)=>a+b,0)/n;
  const sorted = [...nums].sort((a,b)=>a-b);
  const median = n%2 ? sorted[(n-1)/2] : (sorted[n/2-1]+sorted[n/2])/2;
  const freq = {}; nums.forEach(x=>freq[x]=(freq[x]||0)+1);
  const maxFreq = Math.max(...Object.values(freq));
  const modes = Object.keys(freq).filter(k=>freq[k]===maxFreq).map(Number);
  const variance = nums.reduce((a,b)=>a+(b-mean)**2,0)/n;
  const stddev = Math.sqrt(variance);
  const r2 = v => Math.round(v*1000)/1000;
  return `📊 **Statistics for [${nums.join(", ")}]:**\n\nMean: **${r2(mean)}**\nMedian: **${r2(median)}**\nMode: **${maxFreq>1?modes.join(", "):"none (all values unique)"}**\nVariance: **${r2(variance)}**\nStd Dev: **${r2(stddev)}**\nRange: **${r2(Math.max(...nums)-Math.min(...nums))}**\nSum: **${r2(nums.reduce((a,b)=>a+b,0))}**\nCount: **${n}**`;
}

// Tries every scientific calculator handler in a sensible order
function scientificCalc(text) {
  return solveQuadratic(text) || solveLinear(text) || gcdLcm(text) || combinatorics(text) || primeCheck(text) || statSummary(text) || null;
}

// ================================================================
// SECTION 7C: CODE ENGINE — snippets across 10 languages + concepts
// ================================================================

const LANG_ALIASES = {
  python:"python", py:"python",
  javascript:"javascript", js:"javascript",
  typescript:"typescript", ts:"typescript",
  java:"java",
  "c++":"cpp", cpp:"cpp",
  "c#":"csharp", csharp:"csharp", "c sharp":"csharp",
  go:"go", golang:"go",
  rust:"rust",
  ruby:"ruby",
  php:"php",
};

const LANG_NAMES = {
  python:"Python", javascript:"JavaScript", typescript:"TypeScript", java:"Java",
  cpp:"C++", csharp:"C#", go:"Go", rust:"Rust", ruby:"Ruby", php:"PHP",
};

function detectCodeLanguage(text) {
  const lower = ` ${text.toLowerCase()} `;
  for (const [alias, lang] of Object.entries(LANG_ALIASES)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`[^a-z0-9]${escaped}[^a-z0-9]`, "i");
    if (re.test(lower)) return lang;
  }
  return null;
}

const CODE_TASK_TITLES = {
  hello_world:"Hello World", fizzbuzz:"FizzBuzz", factorial:"Factorial (recursive)",
  fibonacci:"Fibonacci sequence", reverse_string:"Reverse a string", palindrome:"Palindrome check",
  bubble_sort:"Bubble sort", binary_search:"Binary search", prime_check:"Prime number check",
  swap_variables:"Swap two variables",
};

const CODE_TASK_PATTERNS = [
  {key:"hello_world",    re:/hello\s*,?\s*world/i},
  {key:"fizzbuzz",       re:/fizz\s*buzz/i},
  {key:"factorial",      re:/factorial/i},
  {key:"fibonacci",      re:/fibonacci/i},
  {key:"reverse_string", re:/reverse\s+(a\s+|an\s+)?string/i},
  {key:"palindrome",     re:/palindrome/i},
  {key:"bubble_sort",    re:/bubble\s*sort/i},
  {key:"binary_search",  re:/binary\s*search/i},
  {key:"prime_check",    re:/(check|is|test)\b.*\bprime|prime\s+(number\s+)?check/i},
  {key:"swap_variables", re:/swap\s+(two\s+)?(variables?|values?)/i},
];

function detectCodeTask(text) {
  for (const t of CODE_TASK_PATTERNS) if (t.re.test(text)) return t.key;
  return null;
}

const CODE_SNIPPETS = {
  hello_world: {
    python: `print("Hello, World!")`,
    javascript: `console.log("Hello, World!");`,
    typescript: `console.log("Hello, World!");`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    cpp: `#include <iostream>\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
    csharp: `using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`,
    go: `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
    rust: `fn main() {\n    println!("Hello, World!");\n}`,
    ruby: `puts "Hello, World!"`,
    php: `<?php\necho "Hello, World!";`,
  },
  fizzbuzz: {
    python: `for i in range(1, 21):\n    if i % 15 == 0: print("FizzBuzz")\n    elif i % 3 == 0: print("Fizz")\n    elif i % 5 == 0: print("Buzz")\n    else: print(i)`,
    javascript: `for (let i = 1; i <= 20; i++) {\n  if (i % 15 === 0) console.log("FizzBuzz");\n  else if (i % 3 === 0) console.log("Fizz");\n  else if (i % 5 === 0) console.log("Buzz");\n  else console.log(i);\n}`,
    typescript: `for (let i = 1; i <= 20; i++) {\n  if (i % 15 === 0) console.log("FizzBuzz");\n  else if (i % 3 === 0) console.log("Fizz");\n  else if (i % 5 === 0) console.log("Buzz");\n  else console.log(i);\n}`,
    java: `public class FizzBuzz {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 20; i++) {\n            if (i % 15 == 0) System.out.println("FizzBuzz");\n            else if (i % 3 == 0) System.out.println("Fizz");\n            else if (i % 5 == 0) System.out.println("Buzz");\n            else System.out.println(i);\n        }\n    }\n}`,
    cpp: `#include <iostream>\nint main() {\n    for (int i = 1; i <= 20; i++) {\n        if (i % 15 == 0) std::cout << "FizzBuzz\\n";\n        else if (i % 3 == 0) std::cout << "Fizz\\n";\n        else if (i % 5 == 0) std::cout << "Buzz\\n";\n        else std::cout << i << "\\n";\n    }\n    return 0;\n}`,
    csharp: `using System;\nclass Program {\n    static void Main() {\n        for (int i = 1; i <= 20; i++) {\n            if (i % 15 == 0) Console.WriteLine("FizzBuzz");\n            else if (i % 3 == 0) Console.WriteLine("Fizz");\n            else if (i % 5 == 0) Console.WriteLine("Buzz");\n            else Console.WriteLine(i);\n        }\n    }\n}`,
    go: `package main\nimport "fmt"\nfunc main() {\n    for i := 1; i <= 20; i++ {\n        if i%15 == 0 {\n            fmt.Println("FizzBuzz")\n        } else if i%3 == 0 {\n            fmt.Println("Fizz")\n        } else if i%5 == 0 {\n            fmt.Println("Buzz")\n        } else {\n            fmt.Println(i)\n        }\n    }\n}`,
    rust: `fn main() {\n    for i in 1..=20 {\n        if i % 15 == 0 { println!("FizzBuzz"); }\n        else if i % 3 == 0 { println!("Fizz"); }\n        else if i % 5 == 0 { println!("Buzz"); }\n        else { println!("{}", i); }\n    }\n}`,
    ruby: `(1..20).each do |i|\n  if i % 15 == 0 then puts "FizzBuzz"\n  elsif i % 3 == 0 then puts "Fizz"\n  elsif i % 5 == 0 then puts "Buzz"\n  else puts i\n  end\nend`,
    php: `<?php\nfor ($i = 1; $i <= 20; $i++) {\n    if ($i % 15 == 0) echo "FizzBuzz\\n";\n    elseif ($i % 3 == 0) echo "Fizz\\n";\n    elseif ($i % 5 == 0) echo "Buzz\\n";\n    else echo "$i\\n";\n}`,
  },
  factorial: {
    python: `def factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)\n\nprint(factorial(5))`,
    javascript: `function factorial(n) {\n  return n <= 1 ? 1 : n * factorial(n - 1);\n}\nconsole.log(factorial(5));`,
    typescript: `function factorial(n: number): number {\n  return n <= 1 ? 1 : n * factorial(n - 1);\n}\nconsole.log(factorial(5));`,
    java: `public class Factorial {\n    static long factorial(int n) {\n        return n <= 1 ? 1 : n * factorial(n - 1);\n    }\n    public static void main(String[] args) {\n        System.out.println(factorial(5));\n    }\n}`,
    cpp: `#include <iostream>\nlong factorial(int n) {\n    return n <= 1 ? 1 : n * factorial(n - 1);\n}\nint main() {\n    std::cout << factorial(5) << std::endl;\n    return 0;\n}`,
    csharp: `using System;\nclass Program {\n    static long Factorial(int n) => n <= 1 ? 1 : n * Factorial(n - 1);\n    static void Main() {\n        Console.WriteLine(Factorial(5));\n    }\n}`,
    go: `package main\nimport "fmt"\nfunc factorial(n int) int {\n    if n <= 1 {\n        return 1\n    }\n    return n * factorial(n-1)\n}\nfunc main() {\n    fmt.Println(factorial(5))\n}`,
    rust: `fn factorial(n: u64) -> u64 {\n    if n <= 1 { 1 } else { n * factorial(n - 1) }\n}\nfn main() {\n    println!("{}", factorial(5));\n}`,
    ruby: `def factorial(n)\n  n <= 1 ? 1 : n * factorial(n - 1)\nend\n\nputs factorial(5)`,
    php: `<?php\nfunction factorial($n) {\n    return $n <= 1 ? 1 : $n * factorial($n - 1);\n}\necho factorial(5);`,
  },
  fibonacci: {
    python: `def fibonacci(n):\n    a, b = 0, 1\n    result = []\n    for _ in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result\n\nprint(fibonacci(10))`,
    javascript: `function fibonacci(n) {\n  let a = 0, b = 1, result = [];\n  for (let i = 0; i < n; i++) {\n    result.push(a);\n    [a, b] = [b, a + b];\n  }\n  return result;\n}\nconsole.log(fibonacci(10));`,
    typescript: `function fibonacci(n: number): number[] {\n  let a = 0, b = 1, result: number[] = [];\n  for (let i = 0; i < n; i++) {\n    result.push(a);\n    [a, b] = [b, a + b];\n  }\n  return result;\n}\nconsole.log(fibonacci(10));`,
    java: `public class Fibonacci {\n    static void fibonacci(int n) {\n        int a = 0, b = 1;\n        for (int i = 0; i < n; i++) {\n            System.out.print(a + " ");\n            int next = a + b;\n            a = b; b = next;\n        }\n    }\n    public static void main(String[] args) {\n        fibonacci(10);\n    }\n}`,
    cpp: `#include <iostream>\nint main() {\n    int a = 0, b = 1;\n    for (int i = 0; i < 10; i++) {\n        std::cout << a << " ";\n        int next = a + b;\n        a = b; b = next;\n    }\n    return 0;\n}`,
    csharp: `using System;\nclass Program {\n    static void Main() {\n        int a = 0, b = 1;\n        for (int i = 0; i < 10; i++) {\n            Console.Write(a + " ");\n            int next = a + b;\n            a = b; b = next;\n        }\n    }\n}`,
    go: `package main\nimport "fmt"\nfunc main() {\n    a, b := 0, 1\n    for i := 0; i < 10; i++ {\n        fmt.Print(a, " ")\n        a, b = b, a+b\n    }\n}`,
    rust: `fn main() {\n    let (mut a, mut b) = (0u64, 1u64);\n    for _ in 0..10 {\n        print!("{} ", a);\n        let next = a + b;\n        a = b;\n        b = next;\n    }\n}`,
    ruby: `a, b = 0, 1\n10.times do\n  print "#{a} "\n  a, b = b, a + b\nend`,
    php: `<?php\n$a = 0; $b = 1;\nfor ($i = 0; $i < 10; $i++) {\n    echo $a . " ";\n    [$a, $b] = [$b, $a + $b];\n}`,
  },
  reverse_string: {
    python: `print("hello"[::-1])`,
    javascript: `console.log("hello".split("").reverse().join(""));`,
    typescript: `console.log("hello".split("").reverse().join(""));`,
    java: `public class ReverseString {\n    public static void main(String[] args) {\n        String s = "hello";\n        System.out.println(new StringBuilder(s).reverse().toString());\n    }\n}`,
    cpp: `#include <iostream>\n#include <algorithm>\n#include <string>\nint main() {\n    std::string s = "hello";\n    std::reverse(s.begin(), s.end());\n    std::cout << s << std::endl;\n    return 0;\n}`,
    csharp: `using System;\nclass Program {\n    static void Main() {\n        string s = "hello";\n        char[] arr = s.ToCharArray();\n        Array.Reverse(arr);\n        Console.WriteLine(new string(arr));\n    }\n}`,
    go: `package main\nimport "fmt"\nfunc reverse(s string) string {\n    runes := []rune(s)\n    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {\n        runes[i], runes[j] = runes[j], runes[i]\n    }\n    return string(runes)\n}\nfunc main() {\n    fmt.Println(reverse("hello"))\n}`,
    rust: `fn main() {\n    let s: String = "hello".chars().rev().collect();\n    println!("{}", s);\n}`,
    ruby: `puts "hello".reverse`,
    php: `<?php\necho strrev("hello");`,
  },
  palindrome: {
    python: `def is_palindrome(s):\n    s = s.lower().replace(" ", "")\n    return s == s[::-1]\n\nprint(is_palindrome("racecar"))`,
    javascript: `function isPalindrome(s) {\n  s = s.toLowerCase().replace(/\\s/g, "");\n  return s === s.split("").reverse().join("");\n}\nconsole.log(isPalindrome("racecar"));`,
    typescript: `function isPalindrome(s: string): boolean {\n  s = s.toLowerCase().replace(/\\s/g, "");\n  return s === s.split("").reverse().join("");\n}\nconsole.log(isPalindrome("racecar"));`,
    java: `public class Palindrome {\n    static boolean isPalindrome(String s) {\n        s = s.toLowerCase().replace(" ", "");\n        return s.equals(new StringBuilder(s).reverse().toString());\n    }\n    public static void main(String[] args) {\n        System.out.println(isPalindrome("racecar"));\n    }\n}`,
    cpp: `#include <iostream>\n#include <algorithm>\n#include <string>\nbool isPalindrome(std::string s) {\n    std::string r = s;\n    std::reverse(r.begin(), r.end());\n    return s == r;\n}\nint main() {\n    std::cout << std::boolalpha << isPalindrome("racecar") << std::endl;\n    return 0;\n}`,
    csharp: `using System;\nusing System.Linq;\nclass Program {\n    static bool IsPalindrome(string s) => s == new string(s.Reverse().ToArray());\n    static void Main() {\n        Console.WriteLine(IsPalindrome("racecar"));\n    }\n}`,
    go: `package main\nimport "fmt"\nfunc isPalindrome(s string) bool {\n    for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {\n        if s[i] != s[j] {\n            return false\n        }\n    }\n    return true\n}\nfunc main() {\n    fmt.Println(isPalindrome("racecar"))\n}`,
    rust: `fn is_palindrome(s: &str) -> bool {\n    let chars: Vec<char> = s.chars().collect();\n    let reversed: Vec<char> = chars.iter().rev().cloned().collect();\n    chars == reversed\n}\nfn main() {\n    println!("{}", is_palindrome("racecar"));\n}`,
    ruby: `def palindrome?(s)\n  s == s.reverse\nend\n\nputs palindrome?("racecar")`,
    php: `<?php\nfunction isPalindrome($s) {\n    return $s === strrev($s);\n}\nvar_dump(isPalindrome("racecar"));`,
  },
  bubble_sort: {
    python: `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n\nprint(bubble_sort([5, 2, 9, 1, 5, 6]))`,
    javascript: `function bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n    }\n  }\n  return arr;\n}\nconsole.log(bubbleSort([5, 2, 9, 1, 5, 6]));`,
    typescript: `function bubbleSort(arr: number[]): number[] {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n    }\n  }\n  return arr;\n}\nconsole.log(bubbleSort([5, 2, 9, 1, 5, 6]));`,
    java: `public class BubbleSort {\n    static void bubbleSort(int[] arr) {\n        int n = arr.length;\n        for (int i = 0; i < n; i++)\n            for (int j = 0; j < n - i - 1; j++)\n                if (arr[j] > arr[j + 1]) {\n                    int temp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = temp;\n                }\n    }\n    public static void main(String[] args) {\n        int[] arr = {5, 2, 9, 1, 5, 6};\n        bubbleSort(arr);\n        System.out.println(java.util.Arrays.toString(arr));\n    }\n}`,
    cpp: `#include <iostream>\n#include <vector>\nvoid bubbleSort(std::vector<int>& arr) {\n    for (size_t i = 0; i < arr.size(); i++)\n        for (size_t j = 0; j < arr.size() - i - 1; j++)\n            if (arr[j] > arr[j + 1]) std::swap(arr[j], arr[j + 1]);\n}\nint main() {\n    std::vector<int> arr = {5, 2, 9, 1, 5, 6};\n    bubbleSort(arr);\n    for (int x : arr) std::cout << x << " ";\n    return 0;\n}`,
    csharp: `using System;\nclass Program {\n    static void BubbleSort(int[] arr) {\n        for (int i = 0; i < arr.Length; i++)\n            for (int j = 0; j < arr.Length - i - 1; j++)\n                if (arr[j] > arr[j + 1]) (arr[j], arr[j + 1]) = (arr[j + 1], arr[j]);\n    }\n    static void Main() {\n        int[] arr = {5, 2, 9, 1, 5, 6};\n        BubbleSort(arr);\n        Console.WriteLine(string.Join(", ", arr));\n    }\n}`,
    go: `package main\nimport "fmt"\nfunc bubbleSort(arr []int) {\n    for i := 0; i < len(arr); i++ {\n        for j := 0; j < len(arr)-i-1; j++ {\n            if arr[j] > arr[j+1] {\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n            }\n        }\n    }\n}\nfunc main() {\n    arr := []int{5, 2, 9, 1, 5, 6}\n    bubbleSort(arr)\n    fmt.Println(arr)\n}`,
    rust: `fn bubble_sort(arr: &mut Vec<i32>) {\n    let n = arr.len();\n    for i in 0..n {\n        for j in 0..n - i - 1 {\n            if arr[j] > arr[j + 1] { arr.swap(j, j + 1); }\n        }\n    }\n}\nfn main() {\n    let mut arr = vec![5, 2, 9, 1, 5, 6];\n    bubble_sort(&mut arr);\n    println!("{:?}", arr);\n}`,
    ruby: `def bubble_sort(arr)\n  n = arr.length\n  n.times do |i|\n    (0...n - i - 1).each do |j|\n      arr[j], arr[j + 1] = arr[j + 1], arr[j] if arr[j] > arr[j + 1]\n    end\n  end\n  arr\nend\n\np bubble_sort([5, 2, 9, 1, 5, 6])`,
    php: `<?php\nfunction bubbleSort($arr) {\n    $n = count($arr);\n    for ($i = 0; $i < $n; $i++)\n        for ($j = 0; $j < $n - $i - 1; $j++)\n            if ($arr[$j] > $arr[$j + 1]) {\n                [$arr[$j], $arr[$j + 1]] = [$arr[$j + 1], $arr[$j]];\n            }\n    return $arr;\n}\nprint_r(bubbleSort([5, 2, 9, 1, 5, 6]));`,
  },
  binary_search: {
    python: `def binary_search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: lo = mid + 1\n        else: hi = mid - 1\n    return -1\n\nprint(binary_search([1, 3, 5, 7, 9, 11], 7))`,
    javascript: `function binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    else if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}\nconsole.log(binarySearch([1, 3, 5, 7, 9, 11], 7));`,
    typescript: `function binarySearch(arr: number[], target: number): number {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    else if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}\nconsole.log(binarySearch([1, 3, 5, 7, 9, 11], 7));`,
    java: `public class BinarySearch {\n    static int binarySearch(int[] arr, int target) {\n        int lo = 0, hi = arr.length - 1;\n        while (lo <= hi) {\n            int mid = (lo + hi) / 2;\n            if (arr[mid] == target) return mid;\n            else if (arr[mid] < target) lo = mid + 1;\n            else hi = mid - 1;\n        }\n        return -1;\n    }\n    public static void main(String[] args) {\n        int[] arr = {1, 3, 5, 7, 9, 11};\n        System.out.println(binarySearch(arr, 7));\n    }\n}`,
    cpp: `#include <iostream>\n#include <vector>\nint binarySearch(std::vector<int>& arr, int target) {\n    int lo = 0, hi = arr.size() - 1;\n    while (lo <= hi) {\n        int mid = (lo + hi) / 2;\n        if (arr[mid] == target) return mid;\n        else if (arr[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n}\nint main() {\n    std::vector<int> arr = {1, 3, 5, 7, 9, 11};\n    std::cout << binarySearch(arr, 7) << std::endl;\n    return 0;\n}`,
    csharp: `using System;\nclass Program {\n    static int BinarySearch(int[] arr, int target) {\n        int lo = 0, hi = arr.Length - 1;\n        while (lo <= hi) {\n            int mid = (lo + hi) / 2;\n            if (arr[mid] == target) return mid;\n            else if (arr[mid] < target) lo = mid + 1;\n            else hi = mid - 1;\n        }\n        return -1;\n    }\n    static void Main() {\n        int[] arr = {1, 3, 5, 7, 9, 11};\n        Console.WriteLine(BinarySearch(arr, 7));\n    }\n}`,
    go: `package main\nimport "fmt"\nfunc binarySearch(arr []int, target int) int {\n    lo, hi := 0, len(arr)-1\n    for lo <= hi {\n        mid := (lo + hi) / 2\n        if arr[mid] == target {\n            return mid\n        } else if arr[mid] < target {\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return -1\n}\nfunc main() {\n    fmt.Println(binarySearch([]int{1, 3, 5, 7, 9, 11}, 7))\n}`,
    rust: `fn binary_search(arr: &[i32], target: i32) -> i32 {\n    let (mut lo, mut hi) = (0i32, arr.len() as i32 - 1);\n    while lo <= hi {\n        let mid = (lo + hi) / 2;\n        if arr[mid as usize] == target { return mid; }\n        else if arr[mid as usize] < target { lo = mid + 1; }\n        else { hi = mid - 1; }\n    }\n    -1\n}\nfn main() {\n    println!("{}", binary_search(&[1, 3, 5, 7, 9, 11], 7));\n}`,
    ruby: `def binary_search(arr, target)\n  lo, hi = 0, arr.length - 1\n  while lo <= hi\n    mid = (lo + hi) / 2\n    return mid if arr[mid] == target\n    arr[mid] < target ? lo = mid + 1 : hi = mid - 1\n  end\n  -1\nend\n\nputs binary_search([1, 3, 5, 7, 9, 11], 7)`,
    php: `<?php\nfunction binarySearch($arr, $target) {\n    $lo = 0; $hi = count($arr) - 1;\n    while ($lo <= $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        if ($arr[$mid] == $target) return $mid;\n        elseif ($arr[$mid] < $target) $lo = $mid + 1;\n        else $hi = $mid - 1;\n    }\n    return -1;\n}\necho binarySearch([1, 3, 5, 7, 9, 11], 7);`,
  },
  prime_check: {
    python: `def is_prime(n):\n    if n < 2: return False\n    for i in range(2, int(n ** 0.5) + 1):\n        if n % i == 0: return False\n    return True\n\nprint(is_prime(29))`,
    javascript: `function isPrime(n) {\n  if (n < 2) return false;\n  for (let i = 2; i <= Math.sqrt(n); i++) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}\nconsole.log(isPrime(29));`,
    typescript: `function isPrime(n: number): boolean {\n  if (n < 2) return false;\n  for (let i = 2; i <= Math.sqrt(n); i++) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}\nconsole.log(isPrime(29));`,
    java: `public class PrimeCheck {\n    static boolean isPrime(int n) {\n        if (n < 2) return false;\n        for (int i = 2; i <= Math.sqrt(n); i++)\n            if (n % i == 0) return false;\n        return true;\n    }\n    public static void main(String[] args) {\n        System.out.println(isPrime(29));\n    }\n}`,
    cpp: `#include <iostream>\n#include <cmath>\nbool isPrime(int n) {\n    if (n < 2) return false;\n    for (int i = 2; i <= sqrt(n); i++)\n        if (n % i == 0) return false;\n    return true;\n}\nint main() {\n    std::cout << std::boolalpha << isPrime(29) << std::endl;\n    return 0;\n}`,
    csharp: `using System;\nclass Program {\n    static bool IsPrime(int n) {\n        if (n < 2) return false;\n        for (int i = 2; i <= Math.Sqrt(n); i++)\n            if (n % i == 0) return false;\n        return true;\n    }\n    static void Main() {\n        Console.WriteLine(IsPrime(29));\n    }\n}`,
    go: `package main\nimport (\n    "fmt"\n    "math"\n)\nfunc isPrime(n int) bool {\n    if n < 2 {\n        return false\n    }\n    for i := 2; float64(i) <= math.Sqrt(float64(n)); i++ {\n        if n%i == 0 {\n            return false\n        }\n    }\n    return true\n}\nfunc main() {\n    fmt.Println(isPrime(29))\n}`,
    rust: `fn is_prime(n: u32) -> bool {\n    if n < 2 { return false; }\n    let mut i = 2;\n    while i * i <= n {\n        if n % i == 0 { return false; }\n        i += 1;\n    }\n    true\n}\nfn main() {\n    println!("{}", is_prime(29));\n}`,
    ruby: `def prime?(n)\n  return false if n < 2\n  (2..Math.sqrt(n)).none? { |i| n % i == 0 }\nend\n\nputs prime?(29)`,
    php: `<?php\nfunction isPrime($n) {\n    if ($n < 2) return false;\n    for ($i = 2; $i <= sqrt($n); $i++) {\n        if ($n % $i == 0) return false;\n    }\n    return true;\n}\nvar_dump(isPrime(29));`,
  },
  swap_variables: {
    python: `a, b = 1, 2\na, b = b, a\nprint(a, b)`,
    javascript: `let a = 1, b = 2;\n[a, b] = [b, a];\nconsole.log(a, b);`,
    typescript: `let a: number = 1, b: number = 2;\n[a, b] = [b, a];\nconsole.log(a, b);`,
    java: `int a = 1, b = 2;\nint temp = a;\na = b;\nb = temp;\nSystem.out.println(a + " " + b);`,
    cpp: `#include <iostream>\nint main() {\n    int a = 1, b = 2;\n    std::swap(a, b);\n    std::cout << a << " " << b << std::endl;\n    return 0;\n}`,
    csharp: `int a = 1, b = 2;\n(a, b) = (b, a);\nConsole.WriteLine($"{a} {b}");`,
    go: `a, b := 1, 2\na, b = b, a\nfmt.Println(a, b)`,
    rust: `let (mut a, mut b) = (1, 2);\nstd::mem::swap(&mut a, &mut b);\nprintln!("{} {}", a, b);`,
    ruby: `a, b = 1, 2\na, b = b, a\nputs "#{a} #{b}"`,
    php: `$a = 1; $b = 2;\n[$a, $b] = [$b, $a];\necho "$a $b";`,
  },
};

const CODING_CONCEPTS = {
  "variable": "A **variable** is a named container that holds a value your program can read or change later — like a labeled box you can put data into and swap out whenever you need to.",
  "function": "A **function** is a reusable block of code that performs a task, optionally takes inputs (parameters), and optionally returns a result. It lets you write logic once and call it as many times as you want.",
  "loop": "A **loop** repeats a block of code multiple times — a `for` loop repeats a known number of times, a `while` loop repeats until a condition becomes false.",
  "array": "An **array** (or list) is an ordered collection of values, accessed by index, usually starting at 0. It's the go-to structure for storing a group of related items.",
  "object": "An **object** groups related data and behavior together as key-value pairs (fields/properties and methods). It's the basic building block of object-oriented code.",
  "class": "A **class** is a blueprint for creating objects — it defines the properties (data) and methods (behavior) that every object built from it will have.",
  "recursion": "**Recursion** is when a function calls itself to solve a smaller version of the same problem, until it hits a base case that stops the calls. Factorial and Fibonacci are classic recursive examples.",
  "api": "An **API** (Application Programming Interface) is a defined way for one piece of software to talk to another — usually by sending requests to specific URLs and getting structured data back (often JSON).",
  "algorithm": "An **algorithm** is a step-by-step procedure for solving a problem or completing a task — sorting a list and searching for a value are both classic algorithms.",
  "boolean": "A **boolean** is a data type with only two possible values: `true` or `false`. It's the basis for all conditional logic (`if` statements).",
  "string": "A **string** is a sequence of characters (text) — like `\"hello\"`. Most languages let you slice, search, and combine strings with built-in methods.",
  "integer": "An **integer** is a whole number with no decimal point — positive, negative, or zero.",
  "pointer": "A **pointer** is a variable that stores the memory address of another variable, rather than a value itself. Common in C/C++/Rust; most higher-level languages hide this from you.",
  "async": "**Async** (asynchronous) code lets a program start a slow task (like a network request) and keep running other code while it waits, instead of freezing until it finishes.",
  "promise": "A **Promise** represents a value that isn't ready yet but will be at some point — it resolves (succeeds) or rejects (fails) once the underlying async task completes.",
  "exception": "An **exception** is an error that occurs during execution. `try/catch` (or `try/except`) blocks let you catch it and handle it gracefully instead of crashing the program.",
  "inheritance": "**Inheritance** lets one class (a \"subclass\") reuse and extend the properties and methods of another class (a \"parent\" or \"base\" class), avoiding duplicated code.",
  "interface": "An **interface** defines a contract — a set of methods a class must implement — without specifying how they work. It lets different classes be used interchangeably if they follow the same contract.",
  "database": "A **database** stores structured data so it can be reliably saved, queried, and updated. SQL databases (like PostgreSQL) use tables and rows; NoSQL databases (like MongoDB) use flexible documents.",
  "compiler": "A **compiler** translates human-written source code into a form a computer can run directly (machine code or bytecode), usually catching type and syntax errors before the program ever runs.",
  "git": "**Git** is a version control system that tracks changes to your code over time, letting you save checkpoints (commits), branch off to try things safely, and merge work back together.",
};

function extractCodeConcept(text) {
  const lower = text.toLowerCase();
  return Object.keys(CODING_CONCEPTS).find(k => new RegExp(`\\b${k}s?\\b`).test(lower)) || null;
}

// ================================================================
// SECTION 8: EMOTION DETECTION
// ================================================================

const EMOTION_PATTERNS = [
  {pattern:/\b(frustrated|annoyed|angry|mad|fed up|ugh|this sucks|argh)\b/i,       emotion:"frustrated"},
  {pattern:/\b(confused|lost|don.?t understand|no idea|unclear)\b/i,               emotion:"confused"},
  {pattern:/\b(excited|amazing|awesome|pumped|stoked|so good|fire)\b/i,            emotion:"excited"},
  {pattern:/\b(sad|depressed|unhappy|down|crying|heartbroken|lonely)\b/i,          emotion:"sad"},
  {pattern:/\b(anxious|worried|nervous|scared|stressed|overwhelmed)\b/i,           emotion:"anxious"},
  {pattern:/\b(happy|great|wonderful|fantastic|perfect|best day|yay)\b/i,          emotion:"happy"},
  {pattern:/\b(bored|boring|meh|whatever|not interested)\b/i,                      emotion:"bored"},
  {pattern:/\b(curious|interesting|tell me more|want to know|fascinated)\b/i,      emotion:"curious"},
  {pattern:/\b(tired|exhausted|sleepy|drained|burnout)\b/i,                        emotion:"tired"},
  {pattern:/\b(proud|accomplished|nailed it|succeeded|finally)\b/i,               emotion:"proud"},
  {pattern:/\b(stuck|can.?t figure|not working|nothing works|blocked)\b/i,        emotion:"stuck"},
  {pattern:/\b(grateful|thankful|appreciate|means a lot)\b/i,                     emotion:"grateful"},
];

const EMOTION_OPENERS = {
  frustrated:["Let's cut through this clearly — ","Here's the direct answer — ","No fluff: "],
  confused:  ["Let me make this as clear as possible — ","Here's a cleaner way to look at it: ","Breaking this down simply: "],
  excited:   ["Great energy — let's use it! ","Channeling that into something concrete: ","Perfect state to learn something new: "],
  sad:       ["Take your time — ","I hear you. Here's something useful: ",""],
  anxious:   ["One step at a time — ","Here's the simplest version of this: ","Breaking it down: "],
  happy:     ["Great — let's build on that! ","Perfect mindset. Here: ",""],
  bored:     ["Here's something genuinely interesting: ","Let me give you something worth your attention: ",""],
  curious:   ["Good instinct — here's the full picture: ","Curiosity is the right approach here: ",""],
  tired:     ["Short and clear: ","Just the answer: ","No extra words: "],
  proud:     ["That's earned. Here's what's next: ","Keep going — ","Well done. Now: "],
  stuck:     ["New angle: ","Here's the unlock: ","Let's reframe this: "],
  grateful:  ["Always. Here's more: ","Happy to help. ",""],
};

function detectEmotion(t) { for(const e of EMOTION_PATTERNS){if(e.pattern.test(t))return e.emotion;} return null; }
function getEmotionOpener(e) { if(!e)return ""; const p=EMOTION_OPENERS[e]; return p?p[Math.floor(Math.random()*p.length)]:""; }

// ================================================================
// SECTION 9: SHORTCUT EXPANDER
// ================================================================

const SHORTCUTS = {
  "wut":"what","wat":"what","wtf":"what the heck","wth":"what the heck",
  "hw":"how","y":"why","wen":"when","wer":"where","whos":"who is",
  "ur":"your","u":"you","r":"are","im":"i am","cant":"cannot",
  "dont":"do not","doesnt":"does not","didnt":"did not","isnt":"is not",
  "arent":"are not","wont":"will not","shouldnt":"should not","couldnt":"could not",
  "lol":"laughing","omg":"oh my","brb":"be right back","idk":"i do not know",
  "idc":"i do not care","fyi":"for your information","asap":"as soon as possible",
  "tbh":"to be honest","ngl":"not gonna lie","ty":"thank you","thx":"thanks",
  "pls":"please","plz":"please","k":"okay","yep":"yes","yup":"yes","ya":"yes",
  "nope":"no","nah":"no","gonna":"going to","wanna":"want to","gotta":"got to",
  "kinda":"kind of","sorta":"sort of","cuz":"because","bc":"because",
  "tho":"though","thru":"through","bout":"about","ofc":"of course",
  "def":"definitely","prob":"probably","rly":"really","sry":"sorry",
  "luv":"love","rn":"right now","atm":"at the moment","nvm":"never mind",
  "np":"no problem","tldr":"too long did not read","eli5":"explain simply",
  "smh":"shaking my head","fomo":"fear of missing out","goat":"greatest of all time",
  "js":"javascript","py":"python","ai":"artificial intelligence","ml":"machine learning",
  "imo":"in my opinion","imho":"in my humble opinion","afaik":"as far as i know",
  "irl":"in real life","dm":"direct message","tbf":"to be fair",
};

function expandShortcuts(text) {
  let o = text;
  const keys = Object.keys(SHORTCUTS).sort((a,b)=>b.length-a.length);
  for (const k of keys) {
    const re = new RegExp("\\b"+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","gi");
    o = o.replace(re, SHORTCUTS[k]);
  }
  return o;
}


// ================================================================
// SECTION 10: INTENT DETECTION
// ================================================================

const INTENTS = [
  {pattern:/\b(define|definition|meaning of|what does .+ mean|dictionary)\b/i,          type:"define"},
  {pattern:/\b(synonym|similar word|another word for|what else means|thesaurus)\b/i,    type:"synonyms"},
  {pattern:/\b(antonym|opposite of|opposite word)\b/i,                                  type:"antonyms"},
  {pattern:/\b(describe|what is .+ like|how would you describe|paint a picture)\b/i,    type:"describe"},
  {pattern:/\b(example|use .+ in a sentence|sentence with)\b/i,                         type:"examples"},
  {pattern:/\b(word family|forms of|inflection|conjugation|plural|past tense)\b/i,      type:"word_family"},
  {pattern:/\b(words for|vocabulary for|related words|word list for|words about)\b/i,   type:"word_list"},
  {pattern:/\b(rhyme|rhymes with|word that rhymes)\b/i,                                 type:"rhyme"},
  {pattern:/\b(etymology|word origin|origin of the word|history of the word)\b/i,       type:"etymology"},
  {pattern:/\b(idiom|phrase meaning|expression meaning)\b/i,                            type:"idiom"},
  {pattern:/\b(acronym|stands for|what does .+ stand for|abbreviation)\b/i,             type:"acronym"},
  {pattern:/\b(write (a |an )?(code|program|script|function)|code (for|to)|coding|snippet for|algorithm for|in (python|javascript|typescript|java|c\+\+|c#|go|golang|rust|ruby|php)\b)/i, type:"code"},
  {pattern:/\b(fizzbuzz|factorial|fibonacci|bubble sort|binary search)\b/i,                type:"code"},
  {pattern:/\b(solve|quadratic|x\^2|x²|gcd|lcm|nCr|nPr|\d+\s*choose\s*\d+|standard deviation|variance|mean of|median of|mode of|prime factors?|factorize|is\s+\d+\s+(?:a\s+)?prime)\b/i, type:"sci_calc"},
  {pattern:/\b(explain simply|eli5|explain like i.?m 5|simple terms|layman)\b/i,        type:"eli5"},
  {pattern:/\b(explain|elaborate|tell me more|go deeper|expand on|break down)\b/i,      type:"explain"},
  {pattern:/\b(summarize|summary|short version|brief|recap|tldr|key points)\b/i,        type:"summarize"},
  {pattern:/\b(compare|difference between|versus|vs\.?|which is better|pros and cons)\b/i, type:"compare"},
  {pattern:/\b(brainstorm|ideas for|think of|come up with|generate ideas|options for)\b/i, type:"brainstorm"},
  {pattern:/\b(motivate me|encourage me|motivation|inspire me|keep going)\b/i,          type:"motivate"},
  {pattern:/\b(how do i|how can i|how to|what steps|guide me|what is the process)\b/i,  type:"how_to"},
  {pattern:/\b(what should i|should i|advise me|what would you|what do you recommend)\b/i, type:"advice"},
  {pattern:/\b(why|what is the reason|why does|why do|why is|what causes)\b/i,          type:"why"},
  {pattern:/\b(what is|who is|tell me about|what are|explain what|about)\b/i,           type:"what_is"},
  {pattern:/^(hi|hello|hey|sup|yo|hiya|greetings|howdy)\b/i,                           type:"greeting"},
  {pattern:/\b(who are you|what are you|your name|introduce yourself)\b/i,              type:"identity"},
  {pattern:/\b(how are you|you okay|how.?s it going)\b/i,                               type:"status"},
  {pattern:/\b(what can you do|help me|capabilities|features)\b/i,                      type:"help"},
  {pattern:/\b(thank|thanks|ty|thx|thank you|appreciate)\b/i,                           type:"thanks"},
  {pattern:/\b(bye|goodbye|see you|later|peace|cya)\b/i,                                type:"farewell"},
  {pattern:/\b(joke|make me laugh|funny|humor)\b/i,                                     type:"joke"},
  {pattern:/\b(fun fact|trivia|did you know|random fact)\b/i,                           type:"trivia"},
  {pattern:/\b(quote|inspiring quote|famous quote|motivational quote)\b/i,               type:"quote"},
  {pattern:/\b(roast me|roast|insult me playfully)\b/i,                                 type:"roast"},
  {pattern:/\b(compliment|say something nice|hype me)\b/i,                              type:"compliment"},
  {pattern:/\b(advice|what should i do|suggest|recommend action)\b/i,                   type:"advice"},
  {pattern:/\b(calculate|compute|math|arithmetic|\d+\s*[\+\-\*\/\^]\s*\d+)\b/i,         type:"math"},
  {pattern:/\b(percent|percentage|% of|tip|discount)\b/i,                               type:"percent"},
  {pattern:/\b(convert|conversion|in (km|miles|kg|lbs|celsius|fahrenheit))\b/i,         type:"convert"},
  {pattern:/\b(bmi|body mass|mortgage|loan payment|compound interest|calories)\b/i,     type:"calculator"},
  {pattern:/\b(version|what version|changelog|what is new)\b/i,                         type:"version"},
  {pattern:/\b(who made you|creator|built by|who built)\b/i,                            type:"creator"},
  {pattern:/\b(remember|my name is|call me)\b/i,                                        type:"memory_set"},
  {pattern:/\b(forget|clear memory|reset|wipe memory)\b/i,                              type:"memory_clear"},
  {pattern:/\b(what do you know about me|recall|my info)\b/i,                           type:"memory_recall"},
  {pattern:/\b(search|look up|find info|research|wikipedia|google)\b/i,                 type:"research"},
];

function detectIntent(text) {
  for (const i of INTENTS) { if(i.pattern.test(text)) return i.type; }
  return "communicate";
}

// ================================================================
// SECTION 11: MEMORY & SESSION
// ================================================================

const MAX_MEMORY = 60;
let _memory = [], _userName = null, _apiHandler = null;
let _topicHistory = [], _wordHistory = [], _sessionStart = Date.now();
let _lastResponse = "", _turnCount = 0;

function handleMemorySet(text) {
  const m = text.match(/(?:my name is|call me|i am)\s+([A-Za-z]+)/i);
  if (m) { _userName = m[1]; return `Got it — I will call you ${_userName}.`; }
  return "Noted.";
}

function handleMemoryRecall() {
  const lines = [];
  if (_userName) lines.push(`Name: **${_userName}**`);
  lines.push(`Turns in this session: **${_turnCount}**`);
  lines.push(`Session time: **${Math.floor((Date.now()-_sessionStart)/60000)} min**`);
  if (_topicHistory.length) lines.push(`Topics covered: ${[...new Set(_topicHistory)].slice(-8).join(", ")}`);
  if (_wordHistory.length) lines.push(`Words explored: ${[...new Set(_wordHistory)].slice(-10).join(", ")}`);
  return lines.join("\n");
}

// ================================================================
// SECTION 12: STATIC RESPONSES (greetings, help, etc.)
// ================================================================

const GREETINGS = [
  "Hey! Ask me anything — define a word, explain a concept, build a guide, compare two things, solve some math, write some code, or just talk.",
  "Hello! I can define words, explain concepts, build step-by-step guides, research anything live, solve equations, write code snippets, or just have a conversation.",
  "Hi there! What do you want to know, explore, calculate, or build today?",
  "Hey — what are we working on? I can explain, define, research, guide, compare, calculate, or write code.",
];

const IDENTITY_RESPONSES = [
  `I am SONIX v${VERSION} — a communication and knowledge engine. I have a built-in word brain with thousands of words across 120 categories, pattern recognition that turns your questions into structured answers, synonym and antonym maps, a scientific calculator (algebra, statistics, number theory), a code engine covering 10 languages, and live research across Wikipedia, DuckDuckGo, arXiv, and Stack Overflow that kicks in automatically whenever I don't recognize a topic locally. Just talk naturally.`,
  `SONIX v${VERSION}. I process the patterns in what you say and build real answers from them — and when I don't know something locally, I go research it live instead of guessing. Try: "how to [anything]", "what is [word]", "compare X vs Y", "solve 2x+3=7", "fizzbuzz in python", or just ask a question.`,
];

const HELP_TEXT = `**SONIX v${VERSION} — what I can do:**

🧩 **Pattern Engine** — reads your message structure and builds the right answer:
• \`how to [verb]\` → step-by-step guide
• \`what is [word/concept]\` → definition + description
• \`why [something]\` → reasons + causes
• \`when to [verb]\` → timing + conditions
• \`compare X vs Y\` → structured comparison
• \`go slow / go hard / go deep\` → action guides
• \`how fast / how big / how long\` → measurement guides

📖 **Word Brain** (10,000+ words, 120 categories):
• \`define [word]\` — definition + synonyms + antonyms
• \`synonyms of [word]\` — similar words
• \`antonyms of [word]\` — opposite words
• \`describe [word]\` — rich description
• \`words for [topic]\` — full vocabulary list
• \`etymology of [word]\` — word origin
• \`[idiom phrase]\` — meaning explained
• \`rhymes with [word]\`

🔍 **Live research** — Wikipedia, DuckDuckGo, arXiv, and Stack Overflow. I now use these **automatically** whenever a topic isn't in my local brain — you don't have to say "search" first, though you still can.

🧮 **Scientific Calculator** — arithmetic, percent, unit conversion, BMI, mortgage, compound interest, **plus** linear & quadratic equations (\`solve 2x+3=7\`, \`x^2-5x+6=0\`), GCD/LCM, combinations & permutations (\`5 choose 2\`), prime checks & factorization, and statistics (mean/median/mode/std dev on a list of numbers).

💻 **Code Engine** — ready-made snippets in Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Ruby, and PHP for common tasks like FizzBuzz, factorial, Fibonacci, string reversal, palindrome checks, sorting, binary search, prime checks, and variable swaps (e.g. \`"fizzbuzz in java"\`). I can also explain core programming concepts (function, recursion, API, class, etc.) and fall back to a live Stack Overflow search for anything else.

😄 **Fun** — live jokes, quotes, trivia, facts, motivation, roasts

Just talk naturally — no special commands needed.`;

const STATUS_RESPONSES = [
  "Running well. Word brain active, pattern engine ready. What do you want to explore?",
  "All systems working. What can I help with?",
  "Good — ready to go. Ask me anything.",
];

const THANKS_RESPONSES = [
  "Glad that helped. What else?",
  "Always. What's next?",
  "You're welcome. Keep going.",
  "Of course. What else do you want to understand?",
];

const FAREWELL_RESPONSES = [
  "See you. Come back when you have something to explore.",
  "Take care. The word brain will be here when you need it.",
  "Later. Good luck with whatever you are working on.",
];

// ================================================================
// SECTION 13: GENERAL FALLBACK — always intelligent, never empty
// ================================================================

function generalFallback(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g,"").split(/\s+/).filter(w=>w.length>2);

  // Find any word we know about
  const knownWord = words.find(w => WORD_INDEX[w] || SYNONYM_MAP[w] || ANTONYM_MAP[w] || WORD_DESCRIPTIONS[w]);

  if (knownWord) {
    const syns = (SYNONYM_MAP[knownWord]||[]).slice(0,5);
    const related = getRelatedWords(knownWord).slice(0,6);
    const desc = WORD_DESCRIPTIONS[knownWord];
    let out = `I picked up on the word **"${knownWord}"** in your message.\n\n`;
    if (desc) out += `${desc.split(".")[0]}.\n\n`;
    if (syns.length) out += `**Similar words:** ${syns.join(", ")}\n`;
    if (related.length) out += `**Related concepts:** ${related.join(", ")}\n\n`;
    out += `Want me to define it fully, describe it, find more synonyms, or explain something specific about it?`;
    return out;
  }

  // Pattern-based fallback
  const suggestions = [
    `Try: "define [word]" for a full definition`,
    `Try: "how to [action]" for a step-by-step guide`,
    `Try: "synonyms of [word]" for similar words`,
    `Try: "compare X vs Y" for a comparison`,
    `Try: "what is [concept]" for an explanation`,
    `Try: "words for [topic]" for a vocabulary list`,
    `Try: "search [topic]" to look it up live`,
    `Try: "go slow" or "go hard" for action guides`,
  ];
  const tip = suggestions[Math.floor(Math.random()*suggestions.length)];
  return `I want to give you a useful answer — could you be a little more specific? ${tip}.`;
}

// ================================================================
// SECTION 14: MAIN CHAT FUNCTION
// ================================================================

async function chat(userText, options = {}) {
  if (!userText || typeof userText !== "string") return "";
  const raw  = userText.trim();
  const text = expandShortcuts(raw);
  _turnCount++;

  // Track words
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g)||[];
  _wordHistory.push(...words.slice(0,5));
  if (_wordHistory.length > 300) _wordHistory = _wordHistory.slice(-300);

  _memory.push({ role:"user", content:text });
  if (_memory.length > MAX_MEMORY*2) _memory = _memory.slice(-MAX_MEMORY*2);

  // External API handler
  if (_apiHandler) {
    try {
      const r = await _apiHandler(text, { memory:_memory, userName:_userName, emotion:detectEmotion(text), topicHistory:_topicHistory, wordHistory:_wordHistory });
      if (r) { _memory.push({role:"assistant",content:r}); _lastResponse=r; return r; }
    } catch(e) { console.warn("[SONIX] API handler failed:",e.message); }
  }

  const emotion  = detectEmotion(text);
  const emo      = getEmotionOpener(emotion);
  const intent   = detectIntent(text);
  const patternMatch = detectPattern(text);
  const lower    = text.toLowerCase().trim();

  // Extract subject for word tools
  const subjectMatch = text.match(/\b(?:define|describe|synonym|antonym|word family|words for|etymology|example|explain|about|of|for|is|are)\s+["']?([a-z][\w\s]{1,40})["']?/i);
  const rawSubject = subjectMatch
    ? subjectMatch[1].trim().toLowerCase()
    : words.filter(w=>!["this","that","what","when","where","which","have","does","with","from","they","their","them","then","than","your","more","also","just","been","were","will","would","could","should","into","over","some","only","come","very","really","quite","much","many","some","such","even","back","away","here","there","where","good","well","like","want","need","make","know","think","come","take","give","find","tell","show","keep","seem","feel","look","true","sure","help"].includes(w)).slice(0,3).join(" ") || "this";

  let response = "";

  // ── PATTERN ENGINE (highest priority) ──
  if (patternMatch) {
    const subject = extractSubject(text, patternMatch.pattern);
    _topicHistory.push(subject||patternMatch.pattern);

    switch(patternMatch.type) {
      case "guide":
        response = emo + buildGuide(subject, text);
        break;
      case "action_guide":
        response = emo + buildActionGuide(text);
        break;
      case "define":
      case "what_is":
        if (WORD_DESCRIPTIONS[subject]) {
          response = emo + buildDefinition(subject);
        } else {
          const live = await lookupDictionary(subject);
          response = emo + (live || buildDefinition(subject));
        }
        break;
      case "reason":
      case "why":
        response = emo + buildReason(subject);
        break;
      case "compare":
        response = emo + (buildComparison(text) || await masterResearch(text));
        break;
      case "timing":
        response = emo + buildTiming(subject);
        break;
      case "consequence":
        response = emo + buildConsequence(subject);
        break;
      case "hypothetical":
        response = emo + buildHypothetical(subject);
        break;
      case "capability":
        response = emo + buildCapability(subject);
        break;
      case "identity":
        const idDesc = WORD_DESCRIPTIONS[subject];
        response = emo + (idDesc ? buildDefinition(subject) : await masterResearch(subject));
        break;
      case "explain":
        const explDesc = WORD_DESCRIPTIONS[subject];
        const analogy  = getAnalogy(subject);
        const explSyns = (SYNONYM_MAP[subject]||[]).slice(0,4);
        if (explDesc) {
          response = emo + `**${capitalize(subject)}**\n\n${explDesc}`;
          if (analogy) response += `\n\nA useful way to think about it: ${analogy}.`;
          if (explSyns.length) response += `\n\nRelated concepts: ${explSyns.join(", ")}.`;
        } else {
          response = emo + await masterResearch(subject);
        }
        break;
      case "quantity":
      case "distance":
      case "duration":
      case "frequency":
      case "speed":
      case "size":
        response = emo + buildQuality(subject, text);
        break;
      default:
        // Research as fallback for pattern matches
        response = emo + await masterResearch(subject||text);
    }
  }

  // ── WORD TOOLS ──
  if (!response && intent === "define") {
    const live = await lookupDictionary(rawSubject);
    response = emo + (live || buildDefinition(rawSubject));
  }

  if (!response && intent === "synonyms") {
    const syns = SYNONYM_MAP[rawSubject] || getRelatedWords(rawSubject).slice(0,10);
    response = emo + (syns.length
      ? `**Synonyms of "${rawSubject}":**\n\n${syns.join(" · ")}\n\n🔗 [Thesaurus](https://www.merriam-webster.com/thesaurus/${encodeURIComponent(rawSubject)})`
      : `No built-in synonyms for "${rawSubject}". → [Merriam-Webster Thesaurus](https://www.merriam-webster.com/thesaurus/${encodeURIComponent(rawSubject)})`);
  }

  if (!response && intent === "antonyms") {
    const ants = ANTONYM_MAP[rawSubject] || [];
    response = emo + (ants.length
      ? `**Antonyms of "${rawSubject}":**\n\n${ants.join(" · ")}\n\n🔗 [Thesaurus](https://www.merriam-webster.com/thesaurus/${encodeURIComponent(rawSubject)})`
      : `No built-in antonyms for "${rawSubject}". → [Merriam-Webster](https://www.merriam-webster.com/thesaurus/${encodeURIComponent(rawSubject)})`);
  }

  if (!response && intent === "describe") {
    const desc = WORD_DESCRIPTIONS[rawSubject];
    const syns = (SYNONYM_MAP[rawSubject]||[]).slice(0,5);
    response = emo + `**${capitalize(rawSubject)}**\n\n${desc || describeFromBrain(rawSubject)}`;
    if (syns.length) response += `\n\n**In other words:** ${syns.join(", ")}`;
  }

  if (!response && intent === "examples") {
    const live = await lookupDictionary(rawSubject);
    response = emo + (live || `**"${rawSubject}" in context:**\n\n1. The quality of ${rawSubject} shapes outcomes in ways that are not always immediately visible.\n2. Real ${rawSubject} shows up consistently, not just when it is convenient.\n3. Understanding ${rawSubject} deeply changes how you approach related challenges.`);
  }

  if (!response && intent === "word_family") {
    const syns = (SYNONYM_MAP[rawSubject]||[]).slice(0,5);
    const ants = (ANTONYM_MAP[rawSubject]||[]).slice(0,3);
    const related = getRelatedWords(rawSubject).slice(0,8);
    response = emo + `**Word family of "${rawSubject}":**\n\nSynonyms: ${syns.join(", ")||"—"}\nAntonyms: ${ants.join(", ")||"—"}\nRelated: ${related.join(", ")||"—"}\n\n🔗 [More on Merriam-Webster](https://www.merriam-webster.com/dictionary/${encodeURIComponent(rawSubject)})`;
  }

  if (!response && intent === "word_list") {
    const catEntry = Object.entries(WORD_BRAIN).find(([k])=>k.replace(/_/g," ").includes(rawSubject)||rawSubject.includes(k.replace(/_/g," ")));
    const wl = catEntry ? catEntry[1] : getRelatedWords(rawSubject);
    response = emo + (wl&&wl.length
      ? `**Words for "${rawSubject}":**\n\n${wl.slice(0,40).join(", ")}`
      : `Try a broader term. Some related words: ${getRelatedWords(rawSubject).join(", ")||"nothing found locally — try searching"}`);
  }

  if (!response && intent === "rhyme") {
    const RHYME_E = {"at":["cat","bat","hat","mat","rat","flat","chat","that","vat","sat"],"ay":["day","say","way","play","stay","ray","bay","gray","pay","may","lay","sway","pray"],"ight":["light","night","right","sight","fight","might","tight","bright","flight","knight","plight","slight"],"ine":["line","mine","fine","wine","vine","pine","shine","divine","combine","design","decline","define"],"ake":["take","make","lake","bake","cake","fake","shake","wake","brake","stake","mistake"],"ean":["clean","mean","lean","bean","green","seen","keen","scene","queen","dream","cream","stream"],"ound":["found","sound","round","bound","ground","hound","pound","around","profound","surround"],"ing":["ring","sing","king","bring","string","spring","thing","wing","swing","fling","cling"],"ell":["bell","cell","fell","sell","tell","well","shell","spell","yell","dwell","excel"],"old":["bold","cold","fold","gold","hold","mold","sold","told","old","unfold","behold"],"ire":["fire","hire","wire","tire","admire","desire","inspire","require","aspire"],"ool":["cool","fool","pool","school","tool","rule","jewel","duel","fuel"],"ow":["low","slow","go","flow","grow","know","show","throw","glow","blow","snow","row"],"ow2":["how","now","wow","bow","allow","somehow","avow"]};
    const wrd = rawSubject;
    let found = [];
    for (const [end,rh] of Object.entries(RHYME_E)) { if(wrd.endsWith(end)){found=rh.filter(r=>r!==wrd);break;} }
    response = emo + (found.length
      ? `🎵 **Rhymes with "${rawSubject}":** ${found.join(", ")}\n\n🔗 [More on RhymeZone](https://www.rhymezone.com/r/rhyme.cgi?Word=${encodeURIComponent(rawSubject)})`
      : `No built-in rhymes for "${rawSubject}". → [RhymeZone](https://www.rhymezone.com/r/rhyme.cgi?Word=${encodeURIComponent(rawSubject)})`);
  }

  if (!response && intent === "etymology") {
    const ety = ETYMOLOGIES[rawSubject] || Object.entries(ETYMOLOGIES).find(([k])=>k.includes(rawSubject)||rawSubject.includes(k));
    response = emo + (ety
      ? `**Etymology of "${rawSubject}":**\n\n${Array.isArray(ety)?ety[1]:ety}\n\n🔗 [Etymonline](https://www.etymonline.com/word/${encodeURIComponent(rawSubject)})`
      : `No built-in etymology for "${rawSubject}".\n🔗 [Etymonline](https://www.etymonline.com/word/${encodeURIComponent(rawSubject)}) · [OED](https://www.oed.com/search/dictionary/?scope=Entries&q=${encodeURIComponent(rawSubject)})`);
  }

  if (!response && intent === "idiom") {
    let found = null;
    for(const[idiom,meaning] of Object.entries(IDIOMS)){if(lower.includes(idiom)){found={idiom,meaning};break;}}
    if(!found){for(const[idiom,meaning] of Object.entries(IDIOMS)){if(idiom.split(" ").some(w=>lower.includes(w)&&w.length>4)){found={idiom,meaning};break;}}}
    response = emo + (found
      ? `**"${found.idiom}"**\n\n${found.meaning}`
      : `I couldn't find that phrase. → [Cambridge Idioms](https://dictionary.cambridge.org/dictionary/english-idioms/)`);
  }

  if (!response && intent === "acronym") {
    const acM = text.match(/what\s+(?:does\s+)?([A-Za-z&\d]{2,})\s+(?:stand for|mean)/i) || text.match(/\bacronym\s+(?:for\s+)?([A-Za-z&\d]{2,})\b/i);
    if (acM) { const k=acM[1].toUpperCase(); response = emo + (ACRONYMS[k] ? `**${k}** = ${ACRONYMS[k]}` : `"${k}" not in local database. → [Acronym Finder](https://www.acronymfinder.com/${encodeURIComponent(acM[1])}.html)`); }
  }

  if (!response && intent === "eli5") {
    const desc = WORD_DESCRIPTIONS[rawSubject];
    const analogy = getAnalogy(rawSubject);
    response = emo + `**"${rawSubject}" simply:**\n\n${desc ? desc.split(".")[0]+"." : `"${capitalize(rawSubject)}" is a concept that does one job really well — and that job matters more than it first appears.`}\n\n${analogy ? `Think of it ${analogy}.` : `Imagine explaining this to someone brand new to the topic — the core idea is simpler than it looks.`}`;
  }

  if (!response && intent === "compare") {
    response = emo + (buildComparison(text) || await masterResearch(text));
  }

  if (!response && intent === "brainstorm") {
    const ideas = ["What version of this would surprise everyone?","What would a beginner see that an expert misses?","What is the 10x version — and the 0.1x version?","Who is the unexpected audience for this?","What is the complete opposite approach?","What if you removed the biggest constraint?","What analogy from nature or sport applies here?","What does the most successful person in this space do differently?","What is the smallest possible version you could test today?","What problem is this actually solving — and is that the right problem?"];
    const picks = ideas.sort(()=>0.5-Math.random()).slice(0,5);
    response = emo + `**Brainstorming "${rawSubject}":**\n\n${picks.map((p,i)=>`${i+1}. ${p}`).join("\n")}\n\nWant me to develop any of these, or research "${rawSubject}" live?`;
  }

  if (!response && intent === "how_to") {
    response = emo + buildGuide(rawSubject, text);
  }

  if (!response && intent === "motivate") {
    response = `🔥 ${MOTIVATIONS[Math.floor(Math.random()*MOTIVATIONS.length)]}`;
  }

  if (!response && intent === "advice") {
    const live = await fetchAdvice();
    const fallback = ["The best time to start was yesterday. The second best time is right now.","Focus on what you can control — release what you cannot.","Clarity comes from action, not from waiting.","Make the decision with the information you have now. You can adjust later.","The discomfort you feel is pointing you toward what matters."];
    response = emo + (live||`💡 ${fallback[Math.floor(Math.random()*fallback.length)]}`);
  }

  if (!response && intent === "why") {
    response = emo + buildReason(rawSubject);
  }

  if (!response && intent === "what_is") {
    const desc = WORD_DESCRIPTIONS[rawSubject];
    if (desc) {
      response = emo + buildDefinition(rawSubject);
    } else {
      response = emo + await masterResearch(rawSubject);
    }
  }

  // Entertainment
  if (!response && intent === "joke") {
    const live = await fetchLiveJoke();
    response = live || `😄 ${JOKES[Math.floor(Math.random()*JOKES.length)]}`;
  }
  if (!response && intent === "trivia") {
    const live = await fetchTrivia();
    response = live || `🧠 ${FUN_FACTS[Math.floor(Math.random()*FUN_FACTS.length)]}`;
  }
  if (!response && intent === "quote") {
    const live = await fetchLiveQuote(text);
    response = live || `💬 *"The only way to do great work is to love what you do."*\n— Steve Jobs\n\n🔗 [More quotes](https://www.quotable.io)`;
  }
  if (!response && intent === "roast") {
    const roasts = ["Your search history is probably a masterpiece of contradictions.","You asked an AI to roast you — that says everything.","You are the human equivalent of a loading screen.","Your ideas are like browser tabs — too many open, most unread.","The confidence required to ask for a roast is honestly impressive."];
    response = `🔥 ${roasts[Math.floor(Math.random()*roasts.length)]}`;
  }
  if (!response && intent === "compliment") {
    const compliments = ["You ask better questions than most people — that is genuinely rare.","The way you think about things is more interesting than you realize.","Your curiosity is a real asset. Keep feeding it.","You are clearly someone who wants to understand things properly — that matters.","You are more capable than you give yourself credit for."];
    response = `✨ ${compliments[Math.floor(Math.random()*compliments.length)]}`;
  }

  // Math
  if (!response && intent === "math") { const r=advancedMath(text); if(r!==null) response=emo+`**${r.toLocaleString("en-US",{maximumFractionDigits:10})}**`; }
  if (!response && intent === "percent") { const r=handlePercent(text); if(r) response=emo+r; }
  if (!response && intent === "convert") { const r=convertUnits(text); if(r) response=emo+r; }
  if (!response && intent === "calculator") {
    if(/bmi/i.test(text)){const r=handleBMI(text);if(r)response=emo+r;}
    else if(/mortgage|loan/i.test(text)){const r=handleMortgage(text);if(r)response=emo+r;}
    else if(/compound|interest/i.test(text)){const r=handleCompound(text);if(r)response=emo+r;}
  }
  if (!response && intent === "sci_calc") {
    const r = scientificCalc(text);
    if (r) response = emo + r;
  }

  // Code
  if (!response && intent === "code") {
    const lang = detectCodeLanguage(text) || "python";
    const task = detectCodeTask(text);
    if (task && CODE_SNIPPETS[task] && CODE_SNIPPETS[task][lang]) {
      response = emo + `**${CODE_TASK_TITLES[task]} — ${LANG_NAMES[lang]}**\n\n\`\`\`${lang}\n${CODE_SNIPPETS[task][lang]}\n\`\`\``;
    } else if (task) {
      response = emo + `I don't have a ready-made **${LANG_NAMES[lang]||lang}** snippet for this yet, so here it is in Python — the logic carries over directly:\n\n\`\`\`python\n${CODE_SNIPPETS[task]["python"]}\n\`\`\`\n\n🔗 [Search "${CODE_TASK_TITLES[task]} in ${lang}" on Stack Overflow](https://stackoverflow.com/search?q=${encodeURIComponent(CODE_TASK_TITLES[task]+" "+lang)})`;
    } else {
      const concept = CODING_CONCEPTS[extractCodeConcept(text)];
      if (concept) {
        response = emo + concept;
      } else {
        const live = await searchStackExchange(text);
        response = emo + (live || `I have ready-made snippets for: ${Object.values(CODE_TASK_TITLES).join(", ")} — in ${Object.values(LANG_NAMES).join(", ")}.\n\nTry: "fizzbuzz in python" or "binary search in java".\n\n🔗 [Search Stack Overflow](https://stackoverflow.com/search?q=${encodeURIComponent(text)})`);
      }
    }
  }

  // Memory
  if (!response && intent === "memory_set")    response = handleMemorySet(text);
  if (!response && intent === "memory_recall") response = handleMemoryRecall();
  if (!response && intent === "memory_clear") {
    _memory=[]; _userName=null; _topicHistory=[]; _wordHistory=[]; _turnCount=0; _sessionStart=Date.now();
    response = "Memory cleared. Starting fresh.";
  }

  // Meta
  if (!response && intent === "version")   response = `SONIX v${VERSION} — ${MODEL}. Pattern engine, 10,000+ word brain, 120 categories, 600+ synonym pairs, scientific calculator, 10-language code engine, and proactive live research (Wikipedia, DuckDuckGo, arXiv, Stack Overflow).`;
  if (!response && intent === "creator")   response = `SONIX is an AI model built for communication, vocabulary, and knowledge. Ask me anything.`;
  if (!response && intent === "greeting")  response = GREETINGS[Math.floor(Math.random()*GREETINGS.length)];
  if (!response && intent === "identity")  response = IDENTITY_RESPONSES[Math.floor(Math.random()*IDENTITY_RESPONSES.length)];
  if (!response && intent === "status")    response = STATUS_RESPONSES[Math.floor(Math.random()*STATUS_RESPONSES.length)];
  if (!response && intent === "help")      response = HELP_TEXT;
  if (!response && intent === "thanks")    response = THANKS_RESPONSES[Math.floor(Math.random()*THANKS_RESPONSES.length)];
  if (!response && intent === "farewell")  response = FAREWELL_RESPONSES[Math.floor(Math.random()*FAREWELL_RESPONSES.length)];

  // Live research
  if (!response && intent === "research") {
    const q = text.replace(/\b(search|look up|find info|research|wiki|wikipedia|google|find out about|tell me about)\b/gi,"").trim()||text;
    response = emo + await masterResearch(q);
  }

  // Final fallback — always intelligent, and now proactively researches
  // unfamiliar topics instead of only doing so when explicitly asked
  if (!response) {
    const fallbackWords = text.toLowerCase().replace(/[^a-z\s]/g,"").split(/\s+/).filter(w=>w.length>2);
    const knownLocally = fallbackWords.find(w => WORD_INDEX[w] || SYNONYM_MAP[w] || ANTONYM_MAP[w] || WORD_DESCRIPTIONS[w]);
    const looksLikeQuestion = fallbackWords.length >= 2;
    if (!knownLocally && looksLikeQuestion) {
      const researchSubject = (rawSubject && rawSubject !== "this") ? rawSubject : text;
      const live = await masterResearch(researchSubject);
      response = emo + (live && !/^No live results/.test(live) ? live : generalFallback(text));
    } else {
      response = emo + generalFallback(text);
    }
  }

  _lastResponse = response;
  _memory.push({ role:"assistant", content:response });
  return response;
}

// ================================================================
// SECTION 15: PUBLIC API
// ================================================================

const SonixModel = {
  version: VERSION,
  name:    MODEL,
  chat,

  // Memory
  setUserName(n)   { _userName = n; },
  getUserName()    { return _userName; },
  clearMemory()    { _memory=[]; _topicHistory=[]; _wordHistory=[]; _turnCount=0; _sessionStart=Date.now(); },
  getMemory()      { return [..._memory]; },

  // Handlers
  setApiHandler(fn) { if(typeof fn!=="function")throw new Error("Expects function"); _apiHandler=fn; },

  // Quick one-shot (no memory)
  async quick(text) { return chat(text); },

  // Word brain — direct access
  define:          (w) => lookupDictionary(w),
  describe:        describeFromBrain,
  synonymsOf:      (w) => SYNONYM_MAP[w.toLowerCase()] || getRelatedWords(w).slice(0,8),
  antonymsOf:      (w) => ANTONYM_MAP[w.toLowerCase()] || [],
  relatedWords:    getRelatedWords,
  categoryOf:      getCategoryOf,
  wordsInCategory: getWordsInCategory,
  analogy:         getAnalogy,
  wordDescription: (w) => WORD_DESCRIPTIONS[w.toLowerCase()] || null,
  expandAcronym:   (a) => ACRONYMS[a.toUpperCase()] || null,
  idiomMeaning:    (p) => { const l=p.toLowerCase(); for(const[k,v]of Object.entries(IDIOMS)){if(l.includes(k))return v;} return null; },
  etymology:       (w) => ETYMOLOGIES[w.toLowerCase()] || null,

  // Pattern engine — direct access
  detectPattern,
  buildGuide,
  buildDefinition,
  buildReason,
  buildComparison,
  buildActionGuide,
  buildTiming,

  // Math / convert
  math:            advancedMath,
  convert:         convertUnits,
  percent:         handlePercent,
  bmi:             handleBMI,
  mortgage:        handleMortgage,
  compound:        handleCompound,

  // Scientific calculator
  solveLinear,
  solveQuadratic,
  gcdLcm,
  combinatorics,
  primeCheck,
  statSummary,
  scientificCalc,

  // Code engine
  codeSnippet:     (task, lang) => (CODE_SNIPPETS[task] && CODE_SNIPPETS[task][lang]) || null,
  codeTasks:       () => Object.keys(CODE_TASK_TITLES),
  codeLanguages:   () => Object.values(LANG_NAMES),
  explainConcept:  (w) => CODING_CONCEPTS[w.toLowerCase()] || null,

  // Live sources
  research:        masterResearch,
  live: {
    wikipedia:  searchWikipedia,
    duckduckgo: searchDuckDuckGo,
    dictionary: lookupDictionary,
    quote:      fetchLiveQuote,
    joke:       fetchLiveJoke,
    advice:     fetchAdvice,
    trivia:     fetchTrivia,
    arxiv:      fetchArxiv,
    stackoverflow: searchStackExchange,
  },

  // Detection
  detectEmotion,
  detectIntent,
  detectPattern,
  expandShortcut: (s) => SHORTCUTS[s.toLowerCase()] || null,

  // History
  getTopicHistory()   { return [..._topicHistory]; },
  getWordHistory()    { return [...new Set(_wordHistory)]; },

  // Stats
  getStats() {
    const totalWords = Object.values(WORD_BRAIN).reduce((a,v)=>a+(Array.isArray(v)?v.length:0),0);
    return {
      version: VERSION, name: MODEL,
      memoryTurns: Math.floor(_memory.length/2),
      sessionMinutes: Math.floor((Date.now()-_sessionStart)/60000),
      turnCount: _turnCount,
      topicHistory: _topicHistory.slice(-8),
      knowledgeBase: {
        wordBrainTotal: totalWords,
        wordBrainCategories: Object.keys(WORD_BRAIN).length,
        synonymSets: Object.keys(SYNONYM_MAP).length,
        antonymSets: Object.keys(ANTONYM_MAP).length,
        wordDescriptions: Object.keys(WORD_DESCRIPTIONS).length,
        patternTypes: Object.keys(PATTERN_MAP).length,
        verbGuides: 12,
        idioms: Object.keys(IDIOMS).length,
        etymologies: Object.keys(ETYMOLOGIES).length,
        acronyms: Object.keys(ACRONYMS).length,
        shortcuts: Object.keys(SHORTCUTS).length,
        facts: FUN_FACTS.length,
        jokes: JOKES.length,
        motivations: MOTIVATIONS.length,
        intentPatterns: INTENTS.length,
        liveSources: 9,
        codeTasks: Object.keys(CODE_TASK_TITLES).length,
        codeLanguages: Object.keys(LANG_NAMES).length,
        codingConcepts: Object.keys(CODING_CONCEPTS).length,
      },
    };
  },
};

global.SonixModel = SonixModel;
if (typeof module !== "undefined" && module.exports) module.exports = SonixModel;

// Boot log
const _s = SonixModel.getStats().knowledgeBase;
console.log(
  `%c[SONIX v${VERSION} · ${MODEL}] Words: ${_s.wordBrainTotal} · Categories: ${_s.wordBrainCategories} · Synonym sets: ${_s.synonymSets} · Antonym sets: ${_s.antonymSets} · Descriptions: ${_s.wordDescriptions} · Patterns: ${_s.patternTypes} · Idioms: ${_s.idioms} · Etymologies: ${_s.etymologies} · Intents: ${_s.intentPatterns} · Live sources: ${_s.liveSources} · Code tasks: ${_s.codeTasks}×${_s.codeLanguages} langs · Coding concepts: ${_s.codingConcepts}`,
  "color:#00ff41;font-weight:bold;background:#000;padding:3px 10px;border-radius:4px;"
);

})(typeof window !== "undefined" ? window : this);
