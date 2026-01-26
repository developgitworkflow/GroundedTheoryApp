
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

// Helper to escape XML characters
const escapeXml = (unsafe: string | undefined | null) => {
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

/**
 * Generates a semantic RDF/XML string representing the Project State as a formal OWL Ontology.
 */
export const exportProjectToOwl = (state: ProjectState): string => {
  const { settings, team, codes, codings, artifacts, memos } = state;
  const projectId = `project-${settings.projectName.replace(/\s+/g, '_')}`;

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
        <rdfs:label>Stratum Grounded Theory Ontology</rdfs:label>
        <rdfs:comment>A formal representation of a Qualitative Data Analysis project.</rdfs:comment>
    </owl:Ontology>

    <!-- =========================================== -->
    <!--               T-BOX: CLASSES                -->
    <!-- =========================================== -->

    <owl:Class rdf:about="${SCHEMA_URI}ResearchProject">
        <rdfs:label>Research Project</rdfs:label>
        <rdfs:subClassOf>
            <owl:Restriction>
                <owl:onProperty rdf:resource="${SCHEMA_URI}hasMethodology"/>
                <owl:minCardinality rdf:datatype="http://www.w3.org/2001/XMLSchema#nonNegativeInteger">1</owl:minCardinality>
            </owl:Restriction>
        </rdfs:subClassOf>
    </owl:Class>

    <owl:Class rdf:about="${SCHEMA_URI}Participant">
        <rdfs:label>Participant</rdfs:label>
        <rdfs:comment>An actor or subject involved in the study.</rdfs:comment>
    </owl:Class>

    <owl:Class rdf:about="${SCHEMA_URI}ResearchQuestion">
        <rdfs:label>Research Question</rdfs:label>
    </owl:Class>

    <owl:Class rdf:about="${SCHEMA_URI}Method">
        <rdfs:label>Methodological Protocol</rdfs:label>
    </owl:Class>

    <owl:Class rdf:about="${SCHEMA_URI}Tool">
        <rdfs:label>Research Tool</rdfs:label>
    </owl:Class>

    <owl:Class rdf:about="${SCHEMA_URI}Artifact">
        <rdfs:label>Data Artifact</rdfs:label>
        <rdfs:comment>Raw data source (interview, document, etc.)</rdfs:comment>
    </owl:Class>

    <owl:Class rdf:about="${SCHEMA_URI}Concept">
        <rdfs:label>Concept/Code</rdfs:label>
        <owl:disjointWith rdf:resource="${SCHEMA_URI}Artifact"/>
    </owl:Class>

    <owl:Class rdf:about="${SCHEMA_URI}Category">
        <rdfs:subClassOf rdf:resource="${SCHEMA_URI}Concept"/>
        <rdfs:label>Category</rdfs:label>
    </owl:Class>

    <owl:Class rdf:about="${SCHEMA_URI}CodingInstance">
        <rdfs:label>Coding Instance</rdfs:label>
        <rdfs:comment>The application of a Concept to a segment of an Artifact.</rdfs:comment>
    </owl:Class>

    <owl:Class rdf:about="${SCHEMA_URI}Memo">
        <rdfs:label>Memo</rdfs:label>
        <rdfs:comment>Theoretical note or annotation.</rdfs:comment>
    </owl:Class>

    <!-- =========================================== -->
    <!--             T-BOX: PROPERTIES               -->
    <!-- =========================================== -->

    <owl:ObjectProperty rdf:about="${SCHEMA_URI}investigates">
        <rdfs:domain rdf:resource="${SCHEMA_URI}ResearchProject"/>
        <rdfs:range rdf:resource="${SCHEMA_URI}ResearchQuestion"/>
    </owl:ObjectProperty>

    <owl:ObjectProperty rdf:about="${SCHEMA_URI}involvesParticipant">
        <rdfs:domain rdf:resource="${SCHEMA_URI}ResearchProject"/>
        <rdfs:range rdf:resource="${SCHEMA_URI}Participant"/>
    </owl:ObjectProperty>

    <owl:ObjectProperty rdf:about="${SCHEMA_URI}usesMethod">
        <rdfs:domain rdf:resource="${SCHEMA_URI}ResearchProject"/>
        <rdfs:range rdf:resource="${SCHEMA_URI}Method"/>
    </owl:ObjectProperty>

    <owl:ObjectProperty rdf:about="${SCHEMA_URI}containsArtifact">
        <rdfs:domain rdf:resource="${SCHEMA_URI}ResearchProject"/>
        <rdfs:range rdf:resource="${SCHEMA_URI}Artifact"/>
    </owl:ObjectProperty>

    <owl:ObjectProperty rdf:about="${SCHEMA_URI}codes">
        <rdfs:domain rdf:resource="${SCHEMA_URI}CodingInstance"/>
        <rdfs:range rdf:resource="${SCHEMA_URI}Concept"/>
    </owl:ObjectProperty>

    <owl:ObjectProperty rdf:about="${SCHEMA_URI}referencesArtifact">
        <rdfs:domain rdf:resource="${SCHEMA_URI}CodingInstance"/>
        <rdfs:range rdf:resource="${SCHEMA_URI}Artifact"/>
    </owl:ObjectProperty>

    <owl:ObjectProperty rdf:about="${SCHEMA_URI}annotates">
        <rdfs:domain rdf:resource="${SCHEMA_URI}Memo"/>
    </owl:ObjectProperty>

    <!-- =========================================== -->
    <!--           A-BOX: INDIVIDUALS                -->
    <!-- =========================================== -->

    <!-- The Research Project Instance -->
    <owl:NamedIndividual rdf:about="${BASE_URI}${projectId}">
        <rdf:type rdf:resource="${SCHEMA_URI}ResearchProject"/>
        <rdfs:label>${escapeXml(settings.projectName)}</rdfs:label>
        <strat:description>${escapeXml(settings.structuredAbstract.background)}</strat:description>
        <strat:methodologyType>${settings.theoryType}</strat:methodologyType>
        <strat:fieldSubject>${escapeXml(settings.fieldOfStudy.subjectOfStudy)}</strat:fieldSubject>
        <strat:fieldObject>${escapeXml(settings.fieldOfStudy.objectOfStudy)}</strat:fieldObject>
        <strat:fieldLocation>${escapeXml(settings.fieldOfStudy.location)}</strat:fieldLocation>
        <strat:bibliography>${escapeXml(settings.theoreticalFramework.bibliographyContent)}</strat:bibliography>
        <strat:userName>${escapeXml(settings.userName)}</strat:userName>
        <strat:stopWords>${escapeXml(settings.stopWords.join(','))}</strat:stopWords>
        <strat:aiModel>${settings.aiModel}</strat:aiModel>
        
        <!-- Abstract & Reporting -->
        <strat:abstractBackground>${escapeXml(settings.structuredAbstract.background)}</strat:abstractBackground>
        <strat:abstractMethods>${escapeXml(settings.structuredAbstract.methods)}</strat:abstractMethods>
        <strat:abstractResults>${escapeXml(settings.structuredAbstract.results)}</strat:abstractResults>
        <strat:abstractConclusion>${escapeXml(settings.structuredAbstract.conclusion)}</strat:abstractConclusion>
        <strat:abstractKeywords>${escapeXml(settings.structuredAbstract.keywords)}</strat:abstractKeywords>
        <strat:abstractFreeform>${escapeXml(settings.structuredAbstract.freeform)}</strat:abstractFreeform>
        <strat:mapBackground>${(settings.structuredAbstract.artifactMapping?.background || []).join(',')}</strat:mapBackground>
        <strat:mapMethods>${(settings.structuredAbstract.artifactMapping?.methods || []).join(',')}</strat:mapMethods>
        <strat:mapResults>${(settings.structuredAbstract.artifactMapping?.results || []).join(',')}</strat:mapResults>
        <strat:mapConclusion>${(settings.structuredAbstract.artifactMapping?.conclusion || []).join(',')}</strat:mapConclusion>
    </owl:NamedIndividual>
`;

  // 1. Participants
  const participantsXml = settings.participants.map(p => `
    <owl:NamedIndividual rdf:about="${BASE_URI}${p.id}">
        <rdf:type rdf:resource="${SCHEMA_URI}Participant"/>
        <rdfs:label>${escapeXml(p.anonymizedCode)}</rdfs:label>
        <rdfs:comment>${escapeXml(p.description)}</rdfs:comment>
        <strat:isCoConstructor rdf:datatype="http://www.w3.org/2001/XMLSchema#boolean">${p.isCoConstructor}</strat:isCoConstructor>
        <!-- Inverse property implicit: Project involvesParticipant this -->
    </owl:NamedIndividual>
    
    <rdf:Description rdf:about="${BASE_URI}${projectId}">
        <strat:involvesParticipant rdf:resource="${BASE_URI}${p.id}"/>
    </rdf:Description>`).join('');

  // 2. Research Questions
  const rqXml = settings.theoreticalFramework.researchQuestions.map(rq => `
    <owl:NamedIndividual rdf:about="${BASE_URI}${rq.id}">
        <rdf:type rdf:resource="${SCHEMA_URI}ResearchQuestion"/>
        <rdfs:label>${escapeXml(rq.content)}</rdfs:label>
    </owl:NamedIndividual>

    <rdf:Description rdf:about="${BASE_URI}${projectId}">
        <strat:investigates rdf:resource="${BASE_URI}${rq.id}"/>
    </rdf:Description>`).join('');

  // 3. Methods
  const methodXml = settings.theoreticalFramework.methods.map(m => `
    <owl:NamedIndividual rdf:about="${BASE_URI}${m.id}">
        <rdf:type rdf:resource="${SCHEMA_URI}Method"/>
        <rdfs:label>${m.type} Protocol</rdfs:label>
        <strat:protocolContent>${escapeXml(m.protocolContent)}</strat:protocolContent>
        <strat:involvesParticipantIds>${(m.participantIds || []).join(',')}</strat:involvesParticipantIds>
    </owl:NamedIndividual>

    <rdf:Description rdf:about="${BASE_URI}${projectId}">
        <strat:usesMethod rdf:resource="${BASE_URI}${m.id}"/>
    </rdf:Description>`).join('');

  // 4. Tools
  const toolXml = settings.theoreticalFramework.tools.map(t => `
    <owl:NamedIndividual rdf:about="${BASE_URI}${t.id}">
        <rdf:type rdf:resource="${SCHEMA_URI}Tool"/>
        <rdfs:label>${escapeXml(t.name)}</rdfs:label>
        <strat:version>${escapeXml(t.version)}</strat:version>
        <strat:url>${escapeXml(t.referenceURL)}</strat:url>
    </owl:NamedIndividual>`).join('');

  // 5. Artifacts
  const artifactXml = artifacts.map(a => `
    <owl:NamedIndividual rdf:about="${BASE_URI}${a.id}">
        <rdf:type rdf:resource="${SCHEMA_URI}Artifact"/>
        <rdfs:label>${escapeXml(a.name)}</rdfs:label>
        <strat:content>${escapeXml(a.content)}</strat:content>
        <strat:mediaType>${a.media}</strat:mediaType>
        <strat:researchStatus>${a.status}</strat:researchStatus>
        <strat:accessLevel>${a.access}</strat:accessLevel>
        <strat:source>${escapeXml(a.curation.source)}</strat:source>
        <strat:dateCreated>${a.curation.dateCreated}</strat:dateCreated>
        <strat:consentObtained rdf:datatype="http://www.w3.org/2001/XMLSchema#boolean">${a.curation.consentObtained}</strat:consentObtained>
        ${a.curation.participantId ? `<strat:relatedParticipant rdf:resource="${BASE_URI}${a.curation.participantId}"/>` : ''}
    </owl:NamedIndividual>

    <rdf:Description rdf:about="${BASE_URI}${projectId}">
        <strat:containsArtifact rdf:resource="${BASE_URI}${a.id}"/>
    </rdf:Description>`).join('');

  // 6. Codes (Concepts & Categories)
  const codeXml = codes.map(c => `
    <owl:NamedIndividual rdf:about="${BASE_URI}${c.id}">
        <rdf:type rdf:resource="${SCHEMA_URI}${c.kind === 'category' ? 'Category' : 'Concept'}"/>
        <rdfs:label>${escapeXml(c.name)}</rdfs:label>
        <rdfs:comment>${escapeXml(c.description)}</rdfs:comment>
        <strat:color>${c.color}</strat:color>
        <strat:isCore rdf:datatype="http://www.w3.org/2001/XMLSchema#boolean">${c.isCore || false}</strat:isCore>
        ${c.parentId ? `<strat:subConceptOf rdf:resource="${BASE_URI}${c.parentId}"/>` : ''}
    </owl:NamedIndividual>`).join('');

  // 7. Codings (Reified Relationships)
  const codingXml = codings.map(c => `
    <owl:NamedIndividual rdf:about="${BASE_URI}${c.id}">
        <rdf:type rdf:resource="${SCHEMA_URI}CodingInstance"/>
        <strat:codes rdf:resource="${BASE_URI}${c.codeId}"/>
        <strat:referencesArtifact rdf:resource="${BASE_URI}${c.artifactId}"/>
        <strat:startPosition rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">${c.start}</strat:startPosition>
        <strat:endPosition rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">${c.end}</strat:endPosition>
        <strat:textSnippet>${escapeXml(c.textSnippet)}</strat:textSnippet>
        <strat:coderId>${c.researcherId}</strat:coderId>
    </owl:NamedIndividual>`).join('');

  // 8. Memos
  const memoXml = memos.map(m => `
    <owl:NamedIndividual rdf:about="${BASE_URI}${m.id}">
        <rdf:type rdf:resource="${SCHEMA_URI}Memo"/>
        <rdfs:label>${escapeXml(m.title)}</rdfs:label>
        <strat:memoContent>${escapeXml(m.content)}</strat:memoContent>
        <strat:memoType>${m.type}</strat:memoType>
        <strat:dateCreated>${m.createdAt}</strat:dateCreated>
        ${m.relatedIds.map(rid => `<strat:annotates rdf:resource="${BASE_URI}${rid}"/>`).join('')}
    </owl:NamedIndividual>`).join('');

  return `${header}
    ${participantsXml}
    ${rqXml}
    ${methodXml}
    ${toolXml}
    ${artifactXml}
    ${codeXml}
    ${codingXml}
    ${memoXml}
</rdf:RDF>`;
};

/**
 * Parses semantic RDF/XML back into the Project State.
 * Updated to handle both legacy (tag-based) and new (type-based) structures.
 */
export const parseOwlToProject = (text: string): Partial<ProjectState> => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  
  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid XML format");
  }

  // Helper to find Individuals by rdf:type or legacy tag
  const getIndividuals = (typeLocalName: string, legacyTagName?: string) => {
      const allIndividuals = Array.from(xmlDoc.getElementsByTagName("owl:NamedIndividual"));
      return allIndividuals.filter(el => {
          const typeNode = el.getElementsByTagName("rdf:type")[0];
          const typeResource = typeNode?.getAttribute("rdf:resource");
          return typeResource?.endsWith(typeLocalName);
      });
  };

  const getVal = (el: Element, tag: string) => {
      // Handle namespaced tags (strat:tagName) or simple tags
      const child = el.getElementsByTagName("strat:" + tag)[0] || el.getElementsByTagName(tag)[0];
      return child?.textContent || "";
  };

  const getAttr = (el: Element, tag: string, attr: string) => {
      const child = el.getElementsByTagName("strat:" + tag)[0] || el.getElementsByTagName(tag)[0];
      return child?.getAttribute(attr) || "";
  };

  const getId = (el: Element) => {
      const about = el.getAttribute("rdf:about");
      return about ? about.split('#')[1] || about : `gen-${Date.now()}-${Math.random()}`;
  };

  // 1. Settings (ResearchProject Individual)
  const projectNode = getIndividuals("ResearchProject")[0] || xmlDoc.getElementsByTagName("owl:Ontology")[0]; // Fallback to ontology tag for legacy
  
  // Extract primitive arrays (comma separated strings)
  const mapBackground = getVal(projectNode, "mapBackground");
  const mapMethods = getVal(projectNode, "mapMethods");
  const mapResults = getVal(projectNode, "mapResults");
  const mapConclusion = getVal(projectNode, "mapConclusion");
  const stopWordsStr = getVal(projectNode, "stopWords");

  const settingsPart: Partial<ProjectSettings> = {
      projectName: projectNode.getElementsByTagName("rdfs:label")[0]?.textContent || "Imported Project",
      userName: getVal(projectNode, "userName") || "Imported User",
      theoryType: (getVal(projectNode, "methodologyType") || getVal(projectNode, "theoryType")) as any || 'constructivist',
      aiModel: (getVal(projectNode, "aiModel") as any) || 'gemini-3-flash-preview',
      stopWords: stopWordsStr ? stopWordsStr.split(',') : [],
      themeMode: 'dark',
      stripeWidth: 4,
      fieldOfStudy: {
          subjectOfStudy: getVal(projectNode, "fieldSubject") || getVal(projectNode, "subjectOfStudy"),
          objectOfStudy: getVal(projectNode, "fieldObject") || getVal(projectNode, "objectOfStudy"),
          location: getVal(projectNode, "fieldLocation") || getVal(projectNode, "location")
      },
      structuredAbstract: {
          background: getVal(projectNode, "abstractBackground"),
          methods: getVal(projectNode, "abstractMethods"),
          results: getVal(projectNode, "abstractResults"),
          conclusion: getVal(projectNode, "abstractConclusion"),
          keywords: getVal(projectNode, "abstractKeywords"),
          freeform: getVal(projectNode, "abstractFreeform"),
          artifactMapping: {
              background: mapBackground ? mapBackground.split(',').filter(Boolean) : [],
              methods: mapMethods ? mapMethods.split(',').filter(Boolean) : [],
              results: mapResults ? mapResults.split(',').filter(Boolean) : [],
              conclusion: mapConclusion ? mapConclusion.split(',').filter(Boolean) : []
          }
      },
      theoreticalFramework: {
          researchQuestions: [],
          methods: [],
          tools: [],
          bibliographyContent: getVal(projectNode, "bibliography")
      },
      participants: []
  };

  // 2. Participants
  const participants: Participant[] = getIndividuals("Participant").map(el => ({
      id: getId(el),
      anonymizedCode: el.getElementsByTagName("rdfs:label")[0]?.textContent || "P-?",
      description: el.getElementsByTagName("rdfs:comment")[0]?.textContent || "",
      isCoConstructor: getVal(el, "isCoConstructor") === 'true'
  }));
  if (settingsPart.participants) settingsPart.participants = participants;

  // 3. Methods
  const methods: Method[] = getIndividuals("Method").map(el => ({
      id: getId(el),
      type: (getVal(el, "label").split(' ')[0].toLowerCase() as any) || 'interview', // Fallback infer from label
      protocolContent: getVal(el, "protocolContent"),
      participantIds: getVal(el, "involvesParticipantIds").split(',').filter(Boolean)
  }));
  if (settingsPart.theoreticalFramework) settingsPart.theoreticalFramework.methods = methods;

  // 4. Research Questions
  const rqs: ResearchQuestion[] = getIndividuals("ResearchQuestion").map(el => ({
      id: getId(el),
      content: el.getElementsByTagName("rdfs:label")[0]?.textContent || ""
  }));
  if (settingsPart.theoreticalFramework) settingsPart.theoreticalFramework.researchQuestions = rqs;

  // 5. Tools
  const tools: Tool[] = getIndividuals("Tool").map(el => ({
      id: getId(el),
      name: el.getElementsByTagName("rdfs:label")[0]?.textContent || "Tool",
      version: getVal(el, "version"),
      referenceURL: getVal(el, "url")
  }));
  if (settingsPart.theoreticalFramework) settingsPart.theoreticalFramework.tools = tools;

  // 6. Artifacts
  const artifacts: Artifact[] = getIndividuals("Artifact").map(el => {
      // Find related participant if linked via resource
      const relatedPartNode = el.getElementsByTagName("strat:relatedParticipant")[0];
      const partId = relatedPartNode?.getAttribute("rdf:resource")?.split('#')[1];

      return {
          id: getId(el),
          hashID: Math.random().toString(36), // Regenerate
          name: el.getElementsByTagName("rdfs:label")[0]?.textContent || "Artifact",
          content: getVal(el, "content"),
          type: 'document', // Default, should be added to export if strictly needed
          media: (getVal(el, "mediaType") as any) || 'text',
          status: (getVal(el, "researchStatus") as any) || 'analysis',
          access: (getVal(el, "accessLevel") as any) || 'private',
          curation: {
              format: 'Imported',
              source: getVal(el, "source"),
              dateCreated: getVal(el, "dateCreated"),
              consentObtained: getVal(el, "consentObtained") === 'true',
              participantId: partId
          }
      };
  });

  // 7. Codes (Concepts & Categories)
  const concepts = getIndividuals("Concept");
  const cats = getIndividuals("Category");
  const allCodeEls = [...concepts, ...cats];

  const codes: Code[] = allCodeEls.map(el => {
      const parentNode = el.getElementsByTagName("strat:subConceptOf")[0];
      const parentId = parentNode?.getAttribute("rdf:resource")?.split('#')[1];
      const typeNode = el.getElementsByTagName("rdf:type")[0];
      const typeRes = typeNode?.getAttribute("rdf:resource") || "";
      const isCat = typeRes.endsWith("Category");

      return {
          id: getId(el),
          name: el.getElementsByTagName("rdfs:label")[0]?.textContent || "Untitled",
          description: el.getElementsByTagName("rdfs:comment")[0]?.textContent || "",
          color: getVal(el, "color") || "#888888",
          kind: isCat ? 'category' : 'code',
          isCore: getVal(el, "isCore") === 'true',
          parentId,
          relatedCodeIds: []
      };
  });

  // 8. Codings
  const codings: Coding[] = getIndividuals("CodingInstance").map(el => {
      const codeRef = el.getElementsByTagName("strat:codes")[0]?.getAttribute("rdf:resource")?.split('#')[1];
      const artRef = el.getElementsByTagName("strat:referencesArtifact")[0]?.getAttribute("rdf:resource")?.split('#')[1];

      return {
          id: getId(el),
          artifactId: artRef || "",
          codeId: codeRef || "",
          start: parseInt(getVal(el, "startPosition") || '0'),
          end: parseInt(getVal(el, "endPosition") || '0'),
          textSnippet: getVal(el, "textSnippet"),
          researcherId: getVal(el, "coderId")
      };
  });

  // 9. Memos
  const memos: Memo[] = getIndividuals("Memo").map((el, idx) => {
      const relatedNodes = Array.from(el.getElementsByTagName("strat:annotates"));
      const relatedIds = relatedNodes.map(n => n.getAttribute("rdf:resource")?.split('#')[1]).filter(Boolean) as string[];

      return {
          id: getId(el),
          title: el.getElementsByTagName("rdfs:label")[0]?.textContent || "Memo",
          content: getVal(el, "memoContent"),
          type: (getVal(el, "memoType") as any) || 'observational',
          createdAt: getVal(el, "dateCreated"),
          relatedIds,
          number: idx + 1
      };
  });

  return {
      settings: settingsPart as ProjectSettings,
      team: { id: 'imported', researchers: [], consensusCriteria: [] },
      codes,
      codings,
      artifacts,
      memos
  };
};
