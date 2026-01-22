
import JSZip from 'jszip';
import { ProjectSettings, Artifact, Code, Memo, ResearchTeam, Participant, Coding } from '../types';

/**
 * Generates a Research Object Crate (RO-Crate) zip package.
 * See: https://www.researchobject.org/ro-crate/
 */
export const generateRoCrate = async (
  settings: ProjectSettings,
  artifacts: Artifact[],
  codes: Code[],
  codings: Coding[],
  memos: Memo[],
  team: ResearchTeam,
  participants: Participant[]
): Promise<Blob> => {
  const zip = new JSZip();
  const dataFolder = zip.folder("data");
  const protocolsFolder = dataFolder?.folder("protocols");

  // --- 1. Prepare Graph Entities ---
  const graph: any[] = [];

  // Root Dataset
  const rootId = "./";
  graph.push({
    "@id": "ro-crate-metadata.json",
    "@type": "CreativeWork",
    "conformsTo": { "@id": "https://w3id.org/ro/crate/1.1" },
    "about": { "@id": rootId }
  });

  const partsIds: any[] = [];
  const mentionsIds: any[] = [];
  const aboutIds: any[] = [];

  // --- ARTIFACTS (Data) ---
  artifacts.forEach(art => {
    // Sanitize filename
    const safeName = art.name.replace(/[^a-z0-9\.\-]/gi, '_');
    const extension = art.media === 'text' ? '.txt' : '.dat';
    const fileName = `${art.id}_${safeName}${extension}`;
    const filePath = `data/${fileName}`;
    
    // Add file content to zip
    if (dataFolder) {
        dataFolder.file(fileName, art.content);
    }

    partsIds.push({ "@id": filePath });

    graph.push({
      "@id": filePath,
      "@type": "File",
      "name": art.name,
      "description": `Type: ${art.type}. Access: ${art.access}. Status: ${art.status}.`,
      "encodingFormat": art.media === 'text' ? "text/plain" : "application/octet-stream",
      "dateCreated": art.curation.dateCreated,
      "author": art.responsibleId ? { "@id": `#person-${art.responsibleId}` } : undefined
    });
  });

  // --- PROTOCOLS (Methods as Files) ---
  settings.theoreticalFramework.methods.forEach(m => {
      const filename = `protocol_${m.id}_${m.type}.txt`;
      const filePath = `data/protocols/${filename}`;
      
      if (protocolsFolder) {
          protocolsFolder.file(filename, m.protocolContent || "No content.");
      }

      partsIds.push({ "@id": filePath });

      graph.push({
          "@id": filePath,
          "@type": ["File", "HowTo", "CreativeWork"],
          "name": `${m.type.charAt(0).toUpperCase() + m.type.slice(1)} Protocol`,
          "description": `Protocol used for ${m.type} data collection.`,
          "encodingFormat": "text/plain",
          "about": m.participantIds?.map(pid => ({ "@id": `#participant-${pid}` }))
      });
  });

  // --- RESEARCHERS ---
  team.researchers.forEach(r => {
    graph.push({
      "@id": `#person-${r.id}`,
      "@type": "Person",
      "name": r.name,
      "jobTitle": r.role
    });
  });

  // --- PARTICIPANTS ---
  participants.forEach(p => {
    const pid = `#participant-${p.id}`;
    aboutIds.push({ "@id": pid });
    graph.push({
      "@id": pid,
      "@type": "Person",
      "name": p.anonymizedCode,
      "description": p.description,
      "additionalType": p.isCoConstructor ? "CoConstructor" : undefined
    });
  });

  // --- FIELD OF STUDY ---
  if (settings.fieldOfStudy.subjectOfStudy) {
      graph.push({
          "@id": "#subjectOfStudy",
          "@type": "Thing",
          "name": settings.fieldOfStudy.subjectOfStudy,
          "description": "Subject of Study (Actors)"
      });
      aboutIds.push({ "@id": "#subjectOfStudy" });
  }
  if (settings.fieldOfStudy.objectOfStudy) {
      graph.push({
          "@id": "#objectOfStudy",
          "@type": "Thing",
          "name": settings.fieldOfStudy.objectOfStudy,
          "description": "Object of Study (Phenomenon)"
      });
      aboutIds.push({ "@id": "#objectOfStudy" });
  }
  if (settings.fieldOfStudy.location) {
      graph.push({
          "@id": "#location",
          "@type": "Place",
          "name": settings.fieldOfStudy.location
      });
      aboutIds.push({ "@id": "#location" });
  }

  // --- RESEARCH QUESTIONS ---
  settings.theoreticalFramework.researchQuestions.forEach(rq => {
      const id = `#question-${rq.id}`;
      mentionsIds.push({ "@id": id });
      graph.push({
          "@id": id,
          "@type": "Question",
          "name": rq.content
      });
  });

  // --- TOOLS ---
  settings.theoreticalFramework.tools.forEach(t => {
      const id = `#tool-${t.id}`;
      mentionsIds.push({ "@id": id }); // Tools are mentioned as used
      graph.push({
          "@id": id,
          "@type": ["SoftwareApplication", "Product"],
          "name": t.name,
          "softwareVersion": t.version,
          "url": t.referenceURL
      });
  });

  // --- CODEBOOK ---
  graph.push({
    "@id": "#codebook",
    "@type": "DefinedTermSet",
    "name": `Codebook for ${settings.projectName}`,
    "description": "Grounded Theory Codes and Categories"
  });

  // --- CODES ---
  codes.forEach(c => {
    const codeId = `#code-${c.id}`;
    mentionsIds.push({ "@id": codeId });
    graph.push({
      "@id": codeId,
      "@type": "DefinedTerm",
      "inDefinedTermSet": { "@id": "#codebook" },
      "name": c.name,
      "description": c.description || c.kind,
      "termCode": c.id,
      "additionalType": c.kind === 'category' ? "Category" : "Code",
      "url": c.isCore ? "http://purl.org/net/ro-crate/types#CoreCategory" : undefined 
    });
  });

  // --- MEMOS ---
  memos.forEach(m => {
    const aboutRefs = m.relatedIds.map(rid => {
        // Try to match ID to artifact or code
        if (artifacts.find(a => a.id === rid)) {
             const art = artifacts.find(a => a.id === rid);
             const safeName = art!.name.replace(/[^a-z0-9\.\-]/gi, '_');
             const extension = art!.media === 'text' ? '.txt' : '.dat';
             return { "@id": `data/${art!.id}_${safeName}${extension}` };
        }
        if (codes.find(c => c.id === rid)) return { "@id": `#code-${rid}` };
        return null;
    }).filter(Boolean);

    graph.push({
      "@id": `#memo-${m.id}`,
      "@type": ["Comment", "CreativeWork"],
      "name": m.title,
      "text": m.content,
      "dateCreated": m.createdAt,
      "author": m.authorId ? { "@id": `#person-${m.authorId}` } : undefined,
      "about": aboutRefs.length > 0 ? aboutRefs : undefined,
      "keywords": m.type
    });
  });

  // --- ROOT DATASET ---
  graph.push({
    "@id": rootId,
    "@type": "Dataset",
    "name": settings.projectName,
    "description": settings.structuredAbstract.background || "Grounded Theory Research Project",
    "datePublished": new Date().toISOString(),
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "keywords": settings.structuredAbstract.keywords,
    "author": team.researchers.map(r => ({ "@id": `#person-${r.id}` })),
    "hasPart": partsIds,
    "mentions": mentionsIds,
    "about": aboutIds
  });

  // --- 2. Write Metadata ---
  const metadata = {
    "@context": "https://w3id.org/ro/crate/1.1/context",
    "@graph": graph
  };

  zip.file("ro-crate-metadata.json", JSON.stringify(metadata, null, 2));

  return zip.generateAsync({ type: "blob" });
};
