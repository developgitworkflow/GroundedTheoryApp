
import { ProjectSettings, ResearchTeam, Artifact, Code, Coding, Memo } from '../types';

export const DEMO_DATA = {
  settings: {
    projectName: "Digital Nomadism & Place Attachment",
    userName: "Dr. K. Mercer",
    themeMode: "dark",
    stripeWidth: 6,
    aiModel: "gemini-3-pro-preview",
    stopWords: ["the", "and", "is", "of", "to", "in", "it", "that", "was", "um", "uh", "like", "you", "know"],
    theoryType: "constructivist",
    fieldOfStudy: {
      subjectOfStudy: "Location-Independent Workers (Digital Nomads)",
      objectOfStudy: "Construction of 'Home' and Community",
      location: "Bali, Indonesia & Lisbon, Portugal"
    },
    participants: [
      { id: "p-1", anonymizedCode: "DN-01", description: "Software Dev, 3yrs nomadic, currently in Ubud", isCoConstructor: true },
      { id: "p-2", anonymizedCode: "DN-02", description: "Graphic Designer, 6mo nomadic, currently in Lisbon", isCoConstructor: false },
      { id: "p-3", anonymizedCode: "DN-03", description: "Crypto Trader, 5yrs nomadic, 'perpetual traveler'", isCoConstructor: false }
    ],
    theoreticalFramework: {
      researchQuestions: [
        { id: "rq-1", content: "How do digital nomads construct a sense of 'home' while constantly moving?" },
        { id: "rq-2", content: "What role do co-working spaces play in forming ephemeral communities?" },
        { id: "rq-3", content: "How does technology mediate the tension between freedom and loneliness?" }
      ],
      methods: [
        { id: "m-1", type: "interview", protocolContent: "1. Life History\n2. Definition of Home\n3. Daily Routines\n4. Social Connections...", participantIds: ["p-1", "p-2", "p-3"] },
        { id: "m-2", type: "observation", protocolContent: "Observation of social dynamics in 'The Hive' co-working space (Lisbon). Focus on non-verbal interactions and seating patterns.", participantIds: [] }
      ],
      tools: [
        { id: "t-1", name: "Stratum CAQDAS", version: "1.0", referenceURL: "https://stratum.app" },
        { id: "t-2", name: "Zoom", version: "5.1", referenceURL: "https://zoom.us" }
      ],
      bibliographyContent: "@book{charmaz2006,\n  title={Constructing grounded theory: A practical guide through qualitative analysis},\n  author={Charmaz, Kathy},\n  year={2006},\n  publisher={Sage}\n}\n\n@article{muller2016,\n  title={The digital nomad: Time for introduction?},\n  author={Muller, A.},\n  journal={Tourism Management},\n  year={2016}\n}"
    },
    structuredAbstract: {
      background: "The rise of remote work has enabled a lifestyle of 'digital nomadism'. This study explores how these individuals maintain a sense of ontological security and 'home' despite a lack of physical permanence.",
      methods: "A constructivist grounded theory approach was employed. Data was collected via 15 semi-structured interviews and 50 hours of participant observation in co-working hubs.",
      results: "Analysis revealed a core category of 'Anchoring Routines'. Nomads replace physical roots with temporal structures and 'digital tethers' to maintain stability. Ephemeral communities provide 'fast-food intimacy' but often lack deep reciprocity.",
      conclusion: "Home is re-conceptualized not as a place, but as a set of portable practices and digital connections. The findings challenge traditional notions of place attachment.",
      keywords: "Digital Nomad, Place Attachment, Mobilities, Grounded Theory, Remote Work",
      artifactMapping: {
        background: [],
        methods: ["a-1", "a-3"],
        results: ["a-1", "a-2"],
        conclusion: []
      }
    }
  } as ProjectSettings,

  team: {
    id: "team-demo",
    researchers: [
      { id: "r-1", name: "Dr. K. Mercer", role: "Senior", color: "#3b82f6", initials: "KM" },
      { id: "r-2", name: "J. Doe", role: "Junior", color: "#10b981", initials: "JD" }
    ],
    consensusCriteria: [
      { id: "cc-1", name: "Core Category Validation", description: "Core categories must be identified in at least 3 separate artifacts.", votingType: "unanimous", active: true },
      { id: "cc-2", name: "Coding Density", description: "Rich text segments must have at least 2 overlapping codes.", votingType: "majority", active: true }
    ]
  } as ResearchTeam,

  codes: [
    // Categories
    { id: "c-1", name: "Temporal Anchoring", kind: "category", color: "#f59e0b", description: "Using time and routine to create stability instead of place.", relatedCodeIds: [], isCore: true },
    { id: "c-2", name: "Digital Tethering", kind: "category", color: "#8b5cf6", description: "Reliance on digital tools to maintain relationships and identity.", relatedCodeIds: [] },
    { id: "c-3", name: "Ephemeral Community", kind: "category", color: "#ec4899", description: "Fast-forming, fast-dissolving social bonds.", relatedCodeIds: [] },
    
    // Codes
    { id: "c-4", name: "Morning Routine", kind: "code", color: "#3b82f6", parentId: "c-1", description: "Specific rituals performed every morning regardless of location.", relatedCodeIds: [] },
    { id: "c-5", name: "Timezone Management", kind: "code", color: "#6366f1", parentId: "c-1", description: "Living in one place but operating on the time of another.", relatedCodeIds: [] },
    { id: "c-6", name: "Video Calls", kind: "code", color: "#a855f7", parentId: "c-2", description: "Zoom/Facetime as the primary locus of interaction.", relatedCodeIds: [] },
    { id: "c-7", name: "Async Communication", kind: "code", color: "#d946ef", parentId: "c-2", description: "Voice notes and texts to bridge time gaps.", relatedCodeIds: [] },
    { id: "c-8", name: "Fast Intimacy", kind: "code", color: "#f43f5e", parentId: "c-3", description: "Skipping small talk to establish deep connections quickly.", relatedCodeIds: [] },
    { id: "c-9", name: "Exit Strategy", kind: "code", color: "#ef4444", parentId: "c-3", description: "Always having a plan to leave, affecting commitment.", relatedCodeIds: [] }
  ] as Code[],

  artifacts: [
    {
      id: "a-1",
      hashID: "hash-interview-01",
      name: "Interview: DN-01 (Bali)",
      type: "interview",
      media: "text",
      access: "private",
      status: "analysis",
      responsibleId: "r-1",
      curation: {
        format: "Transcript",
        source: "Zoom Recording",
        dateCreated: "2023-11-12",
        consentObtained: true,
        participantId: "p-1"
      },
      content: `Interviewer: Tell me about your first week in a new city. How do you settle in?

DN-01: It's a military operation. The first thing I do is find a gym and a coffee shop with good wifi. Once I have those two pins on my map, I feel... grounded. It's not about the apartment, it's about the routine. I do the exact same yoga sequence at 7 AM, whether I'm in Canggu or Medellin. That routine is my home.

Interviewer: And what about people?

DN-01: You learn to hack friendships. You meet someone at a co-working space, and within 20 minutes you're talking about your deepest traumas. You have to. You know you might only overlap for two weeks. It's intense, like a crash course in intimacy. But it's also exhausting. Sometimes I scroll through my Instagram and see faces of people I loved for a month and will never see again. It's like a graveyard of friendships.`
    },
    {
      id: "a-2",
      hashID: "hash-obs-01",
      name: "Field Notes: The Hive Lisbon",
      type: "observation",
      media: "text",
      access: "private",
      status: "analysis",
      responsibleId: "r-2",
      curation: {
        format: "Field Notes",
        source: "Direct Observation",
        dateCreated: "2023-10-05",
        consentObtained: true
      },
      content: `14:00: The main hall is silent. 40 people, but no talking. The only sound is typing and the coffee machine. Everyone is wearing noise-canceling headphones - a visual barrier.

14:15: Two people bump into each other in the kitchen. "How long are you here for?" is the first question. Not "What do you do?" or "Where are you from?". Time is the primary currency. One says "Just till Tuesday," and the conversation visibly cools. The investment isn't worth it.

15:00: A 'community manager' tries to organize a happy hour. People nod, but most eyes stay glued to screens. The digital connection (Slack, Zoom) takes precedence over the physical proximity.`
    },
    {
      id: "a-3",
      hashID: "hash-policy-01",
      name: "Digital Nomad Visa Policy (Portugal)",
      type: "document",
      media: "text",
      access: "public",
      status: "acquisition",
      responsibleId: "r-1",
      curation: {
        format: "PDF Extract",
        source: "Gov Portal",
        dateCreated: "2023-09-01",
        consentObtained: true
      },
      content: `Article 4: Requirements for the Residence Visa.
1. Proof of income exceeding 4x the minimum wage.
2. Comprehensive health insurance.
3. Clean criminal record.

Analysis Note: The policy explicitly frames the nomad as an economic unit, divorced from local social integration requirements. Unlike standard residency, there is no language requirement.`
    }
  ] as Artifact[],

  codings: [
    { id: "cd-1", artifactId: "a-1", codeId: "c-4", start: 135, end: 175, textSnippet: "I do the exact same yoga sequence at 7 AM", researcherId: "r-1" },
    { id: "cd-2", artifactId: "a-1", codeId: "c-1", start: 200, end: 225, textSnippet: "That routine is my home", researcherId: "r-1" },
    { id: "cd-3", artifactId: "a-1", codeId: "c-8", start: 350, end: 385, textSnippet: "crash course in intimacy", researcherId: "r-1" },
    { id: "cd-4", artifactId: "a-1", codeId: "c-3", start: 450, end: 475, textSnippet: "graveyard of friendships", researcherId: "r-1" },
    { id: "cd-5", artifactId: "a-2", codeId: "c-2", start: 90, end: 120, textSnippet: "wearing noise-canceling headphones", researcherId: "r-2" },
    { id: "cd-6", artifactId: "a-2", codeId: "c-9", start: 250, end: 300, textSnippet: "The investment isn't worth it", researcherId: "r-2" }
  ] as Coding[],

  memos: [
    {
      id: "m-1",
      title: "The Paradox of Fast Intimacy",
      content: "Participants report intense, rapid bonding ('fast-food intimacy') due to time scarcity. However, this creates a long-term sense of hollowness. The 'Exit Strategy' code is omnipresent - they are always ready to leave, which prevents true vulnerability. This contradicts the 'Community' aspect they claim to seek.",
      type: "finding",
      relatedIds: ["rq-2", "c-3", "c-8"],
      createdAt: "2023-11-15T10:00:00Z",
      number: 1,
      authorId: "r-1"
    },
    {
      id: "m-2",
      title: "Routine as Architecture",
      content: "In the absence of physical walls (a consistent home), 'Routines' act as the architectural structure of their lives. Doing yoga at 7 AM isn't just exercise; it's erecting the walls of their 'home' for the day. This supports the core category of 'Temporal Anchoring'.",
      type: "theoretical",
      relatedIds: ["c-1", "c-4", "rq-1"],
      createdAt: "2023-11-16T14:30:00Z",
      number: 2,
      authorId: "r-1"
    },
    {
      id: "m-3",
      title: "Methodological Note: Sampling",
      content: "We are mostly reaching successful nomads who have sustained this lifestyle for >1 year. Survivor bias? We should try to find people who quit and went home to understand the failure modes of this lifestyle.",
      type: "methodological",
      relatedIds: ["m-1"],
      createdAt: "2023-11-10T09:00:00Z",
      number: 3,
      authorId: "r-2"
    }
  ] as Memo[]
};
