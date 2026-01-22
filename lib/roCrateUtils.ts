
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

  const artifactIds: string[] = [];
  
  // Artifacts (Data Entities)
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

    artifactIds.push(filePath);

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

  // Researchers (Context Entities)
  team.researchers.forEach(r => {
    graph.push({
      "@id": `#person-${r.id}`,
      "@type": "Person",
      "name": r.name,
      "jobTitle": r.role
    });
  });

  // Participants (Context Entities)
  participants.forEach(p => {
    graph.push({
      "@id": `#participant-${p.id}`,
      "@type": "Person",
      "name": p.anonymizedCode,
      "description": p.description,
      "additionalType": p.isCoConstructor ? "CoConstructor" : undefined
    });
  });

  // Codebook (DefinedTermSet)
  graph.push({
    "@id": "#codebook",
    "@type": "DefinedTermSet",
    "name": `Codebook for ${settings.projectName}`,
    "description": "Grounded Theory Codes and Categories"
  });

  // Codes (DefinedTerms)
  codes.forEach(c => {
    graph.push({
      "@id": `#code-${c.id}`,
      "@type": "DefinedTerm",
      "inDefinedTermSet": { "@id": "#codebook" },
      "name": c.name,
      "description": c.description || c.kind,
      "termCode": c.id,
      "additionalType": c.kind === 'category' ? "Category" : "Code",
      "url": c.isCore ? "http://purl.org/net/ro-crate/types#CoreCategory" : undefined 
    });
  });

  // Memos / Findings (CreativeWork / Comment)
  memos.forEach(m => {
    const aboutIds = m.relatedIds.map(rid => {
        // Try to match ID to artifact or code
        if (artifacts.find(a => a.id === rid)) return { "@id": `data/${artifacts.find(a => a.id === rid)?.id}_...` }; // Simplified matching
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
      "about": aboutIds.length > 0 ? aboutIds : undefined,
      "keywords": m.type
    });
  });

  // Main Dataset Entity
  graph.push({
    "@id": rootId,
    "@type": "Dataset",
    "name": settings.projectName,
    "description": settings.structuredAbstract.background || "Grounded Theory Research Project",
    "datePublished": new Date().toISOString(),
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "keywords": settings.structuredAbstract.keywords,
    "author": team.researchers.map(r => ({ "@id": `#person-${r.id}` })),
    "hasPart": artifactIds.map(id => ({ "@id": id })),
    "mentions": codes.map(c => ({ "@id": `#code-${c.id}` })),
    "about": participants.map(p => ({ "@id": `#participant-${p.id}` }))
  });

  // --- 2. Write Metadata ---
  const metadata = {
    "@context": "https://w3id.org/ro/crate/1.1/context",
    "@graph": graph
  };

  zip.file("ro-crate-metadata.json", JSON.stringify(metadata, null, 2));

  return zip.generateAsync({ type: "blob" });
};
