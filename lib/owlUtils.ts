

import { Code, ProjectSettings, Artifact, Memo, ResearchTeam, Coding, Participant, Method, Tool, ResearchQuestion } from '../types';

const BASE_URI = "http://stratum.app/ontology#";
const SCHEMA_URI = "http://stratum.app/schema#";

interface ProjectState {
    settings: ProjectSettings;
    team: ResearchTeam;
    codes: Code[];
    codings: Coding[];
    artifacts: Artifact[];
    memos: Memo[];
}

/**
 * Generates an RDF/XML string representing the entire Project State as an OWL Ontology.
 */
export const exportProjectToOwl = (state: ProjectState): string => {
  const { settings, team, codes, codings, artifacts, memos } = state;

  const header = `<?xml version="1.0"?>
<rdf:RDF xmlns="${BASE_URI}"
     xml:base="http://stratum.app/ontology"
     xmlns:owl="http://www.w3.org/2002/07/owl#"
     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
     xmlns:xml="http://www.w3.org/XML/1998/namespace"
     xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
     xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
     xmlns:strat="${SCHEMA_URI}">
    
    <owl:Ontology rdf:about="http://stratum.app/ontology">
        <rdfs:label>${escapeXml(settings.projectName)}</rdfs:label>
        <rdfs:comment>${escapeXml(settings.structuredAbstract.background || 'Grounded Theory Project')}</rdfs:comment>
        
        <!-- Project Settings -->
        <strat:theoryType>${settings.theoryType}</strat:theoryType>
        <strat:aiModel>${settings.aiModel}</strat:aiModel>
        <strat:subjectOfStudy>${escapeXml(settings.fieldOfStudy.subjectOfStudy)}</strat:subjectOfStudy>
        <strat:objectOfStudy>${escapeXml(settings.fieldOfStudy.objectOfStudy)}</strat:objectOfStudy>
        <strat:location>${escapeXml(settings.fieldOfStudy.location)}</strat:location>
        
        <!-- Abstract -->
        <strat:abstractBackground>${escapeXml(settings.structuredAbstract.background)}</strat:abstractBackground>
        <strat:abstractMethods>${escapeXml(settings.structuredAbstract.methods)}</strat:abstractMethods>
        <strat:abstractResults>${escapeXml(settings.structuredAbstract.results)}</strat:abstractResults>
        <strat:abstractConclusion>${escapeXml(settings.structuredAbstract.conclusion)}</strat:abstractConclusion>
        <strat:abstractKeywords>${escapeXml(settings.structuredAbstract.keywords)}</strat:abstractKeywords>
    </owl:Ontology>
`;

  // 1. Codes (Classes)
  const codeXml = codes.map(code => {
    const parentResource = code.parentId 
      ? `\n        <rdfs:subClassOf rdf:resource="${BASE_URI}${code.parentId}"/>` 
      : '';
    
    return `
    <owl:Class rdf:about="${BASE_URI}${code.id}">
        <rdfs:label>${escapeXml(code.name)}</rdfs:label>
        <rdfs:comment>${escapeXml(code.description || '')}</rdfs:comment>${parentResource}
        <strat:color>${code.color}</strat:color>
        <strat:kind>${code.kind}</strat:kind>
        <strat:isCore>${code.isCore || false}</strat:isCore>
    </owl:Class>`;
  }).join('');

  // 2. Participants
  const participantXml = settings.participants.map(p => `
    <strat:Participant rdf:about="${BASE_URI}${p.id}">
        <rdfs:label>${escapeXml(p.anonymizedCode)}</rdfs:label>
        <rdfs:comment>${escapeXml(p.description)}</rdfs:comment>
        <strat:isCoConstructor>${p.isCoConstructor}</strat:isCoConstructor>
    </strat:Participant>`).join('');

  // 3. Methods
  const methodXml = settings.theoreticalFramework.methods.map(m => `
    <strat:Method rdf:about="${BASE_URI}${m.id}">
        <strat:methodType>${m.type}</strat:methodType>
        <strat:protocol>${escapeXml(m.protocolContent)}</strat:protocol>
        <strat:participantIds>${(m.participantIds || []).join(',')}</strat:participantIds>
    </strat:Method>`).join('');

  // 4. Tools
  const toolXml = settings.theoreticalFramework.tools.map(t => `
    <strat:Tool rdf:about="${BASE_URI}${t.id}">
        <rdfs:label>${escapeXml(t.name)}</rdfs:label>
        <strat:version>${escapeXml(t.version || '')}</strat:version>
        <strat:url>${escapeXml(t.referenceURL || '')}</strat:url>
    </strat:Tool>`).join('');

  // 5. Artifacts
  const artifactXml = artifacts.map(a => `
    <strat:Artifact rdf:about="${BASE_URI}${a.id}">
        <rdfs:label>${escapeXml(a.name)}</rdfs:label>
        <strat:content>${escapeXml(a.content)}</strat:content>
        <strat:type>${a.type}</strat:type>
        <strat:media>${a.media}</strat:media>
        <strat:status>${a.status}</strat:status>
        <strat:access>${a.access}</strat:access>
        <strat:source>${escapeXml(a.curation.source)}</strat:source>
        <strat:dateCreated>${a.curation.dateCreated}</strat:dateCreated>
        <strat:consent>${a.curation.consentObtained}</strat:consent>
        <strat:participantId>${a.curation.participantId || ''}</strat:participantId>
    </strat:Artifact>`).join('');

  // 6. Memos & Findings
  const memoXml = memos.map(m => `
    <strat:Memo rdf:about="${BASE_URI}${m.id}">
        <rdfs:label>${escapeXml(m.title)}</rdfs:label>
        <rdfs:comment>${escapeXml(m.content)}</rdfs:comment>
        <strat:memoType>${m.type}</strat:memoType>
        <strat:createdAt>${m.createdAt}</strat:createdAt>
        <strat:relatedIds>${(m.relatedIds || []).join(',')}</strat:relatedIds>
    </strat:Memo>`).join('');

  // 7. Codings
  const codingXml = codings.map(c => `
    <strat:Coding rdf:about="${BASE_URI}${c.id}">
        <strat:artifactId>${c.artifactId}</strat:artifactId>
        <strat:codeId>${c.codeId}</strat:codeId>
        <strat:start>${c.start}</strat:start>
        <strat:end>${c.end}</strat:end>
        <strat:text>${escapeXml(c.textSnippet)}</strat:text>
    </strat:Coding>`).join('');

  // 8. Research Questions
  const rqXml = settings.theoreticalFramework.researchQuestions.map(rq => `
    <strat:ResearchQuestion rdf:about="${BASE_URI}${rq.id}">
        <rdfs:label>${escapeXml(rq.content)}</rdfs:label>
    </strat:ResearchQuestion>`).join('');

  return `${header}
    ${codeXml}
    ${participantXml}
    ${methodXml}
    ${toolXml}
    ${artifactXml}
    ${memoXml}
    ${codingXml}
    ${rqXml}
</rdf:RDF>`;
};

/**
 * Parses an RDF/XML string back into the Project State.
 */
export const parseOwlToProject = (text: string): Partial<ProjectState> => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  
  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid XML format");
  }

  // --- Helpers ---
  const getVal = (el: Element, tag: string) => {
      const child = el.getElementsByTagName(tag)[0] || el.getElementsByTagName("strat:" + tag)[0];
      return child?.textContent || "";
  };
  const getId = (el: Element) => {
      const about = el.getAttribute("rdf:about");
      return about ? about.split('#')[1] || about : `gen-${Date.now()}-${Math.random()}`;
  };

  // 1. Settings (Ontology)
  const ontology = xmlDoc.getElementsByTagName("owl:Ontology")[0];
  const settingsPart: Partial<ProjectSettings> = {
      projectName: ontology.getElementsByTagName("rdfs:label")[0]?.textContent || "Imported Project",
      theoryType: (getVal(ontology, "theoryType") as any) || 'constructivist',
      aiModel: (getVal(ontology, "aiModel") as any) || 'gemini-3-flash-preview',
      fieldOfStudy: {
          subjectOfStudy: getVal(ontology, "subjectOfStudy"),
          objectOfStudy: getVal(ontology, "objectOfStudy"),
          location: getVal(ontology, "location")
      },
      structuredAbstract: {
          background: getVal(ontology, "abstractBackground"),
          methods: getVal(ontology, "abstractMethods"),
          results: getVal(ontology, "abstractResults"),
          conclusion: getVal(ontology, "abstractConclusion"),
          keywords: getVal(ontology, "abstractKeywords"),
          artifactMapping: {
              background: [],
              methods: [],
              results: [],
              conclusion: []
          }
      },
      theoreticalFramework: {
          researchQuestions: [],
          methods: [],
          tools: [],
          bibliographyContent: ''
      },
      participants: []
  };

  // 2. Codes
  const codes: Code[] = Array.from(xmlDoc.getElementsByTagName("owl:Class")).map(el => {
      const subClassOf = el.getElementsByTagName("rdfs:subClassOf")[0];
      let parentId: string | undefined = undefined;
      if (subClassOf) {
          const res = subClassOf.getAttribute("rdf:resource");
          if (res) parentId = res.split('#')[1];
      }
      return {
          id: getId(el),
          name: el.getElementsByTagName("rdfs:label")[0]?.textContent || "Untitled",
          description: el.getElementsByTagName("rdfs:comment")[0]?.textContent || "",
          color: getVal(el, "color") || "#888888",
          kind: (getVal(el, "kind") as any) || 'code',
          isCore: getVal(el, "isCore") === 'true',
          parentId,
          relatedCodeIds: []
      };
  });

  // 3. Participants
  const participants: Participant[] = Array.from(xmlDoc.getElementsByTagName("strat:Participant")).map(el => ({
      id: getId(el),
      anonymizedCode: el.getElementsByTagName("rdfs:label")[0]?.textContent || "P-?",
      description: el.getElementsByTagName("rdfs:comment")[0]?.textContent || "",
      isCoConstructor: getVal(el, "isCoConstructor") === 'true'
  }));
  if (settingsPart.participants) settingsPart.participants = participants;

  // 4. Methods
  const methods: Method[] = Array.from(xmlDoc.getElementsByTagName("strat:Method")).map(el => ({
      id: getId(el),
      type: (getVal(el, "methodType") as any) || 'interview',
      protocolContent: getVal(el, "protocol"),
      participantIds: getVal(el, "participantIds").split(',').filter(Boolean)
  }));
  if (settingsPart.theoreticalFramework) settingsPart.theoreticalFramework.methods = methods;

  // 5. Artifacts
  const artifacts: Artifact[] = Array.from(xmlDoc.getElementsByTagName("strat:Artifact")).map(el => ({
      id: getId(el),
      hashID: Math.random().toString(36), // Regenerate or store?
      name: el.getElementsByTagName("rdfs:label")[0]?.textContent || "Artifact",
      content: getVal(el, "content"),
      type: (getVal(el, "type") as any),
      media: (getVal(el, "media") as any),
      status: (getVal(el, "status") as any),
      access: (getVal(el, "access") as any),
      curation: {
          format: 'Imported',
          source: getVal(el, "source"),
          dateCreated: getVal(el, "dateCreated"),
          consentObtained: getVal(el, "consent") === 'true',
          participantId: getVal(el, "participantId") || undefined
      }
  }));

  // 6. Memos
  const memos: Memo[] = Array.from(xmlDoc.getElementsByTagName("strat:Memo")).map((el, idx) => ({
      id: getId(el),
      title: el.getElementsByTagName("rdfs:label")[0]?.textContent || "Memo",
      content: el.getElementsByTagName("rdfs:comment")[0]?.textContent || "",
      type: (getVal(el, "memoType") as any),
      createdAt: getVal(el, "createdAt"),
      relatedIds: getVal(el, "relatedIds").split(',').filter(Boolean),
      number: idx + 1
  }));

  // 7. Codings
  const codings: Coding[] = Array.from(xmlDoc.getElementsByTagName("strat:Coding")).map(el => ({
      id: getId(el),
      artifactId: getVal(el, "artifactId"),
      codeId: getVal(el, "codeId"),
      start: parseInt(getVal(el, "start") || '0'),
      end: parseInt(getVal(el, "end") || '0'),
      textSnippet: getVal(el, "text")
  }));

  // 8. RQs
  const rqs: ResearchQuestion[] = Array.from(xmlDoc.getElementsByTagName("strat:ResearchQuestion")).map(el => ({
      id: getId(el),
      content: el.getElementsByTagName("rdfs:label")[0]?.textContent || ""
  }));
  if (settingsPart.theoreticalFramework) settingsPart.theoreticalFramework.researchQuestions = rqs;

  // Tools
  const tools: Tool[] = Array.from(xmlDoc.getElementsByTagName("strat:Tool")).map(el => ({
      id: getId(el),
      name: el.getElementsByTagName("rdfs:label")[0]?.textContent || "Tool",
      version: getVal(el, "version"),
      referenceURL: getVal(el, "url")
  }));
  if (settingsPart.theoreticalFramework) settingsPart.theoreticalFramework.tools = tools;

  return {
      settings: settingsPart as ProjectSettings,
      team: { id: 'imported', researchers: [], consensusCriteria: [] }, // Team auth not usually exported fully for privacy, just structure?
      codes,
      codings,
      artifacts,
      memos
  };
};

const escapeXml = (unsafe: string) => {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}