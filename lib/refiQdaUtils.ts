

import JSZip from 'jszip';
import { ProjectSettings, Artifact, Code, Memo, ResearchTeam, Coding, Participant, Method, Tool, ResearchQuestion } from '../types';

interface ProjectState {
    settings: ProjectSettings;
    team: ResearchTeam;
    codes: Code[];
    codings: Coding[];
    artifacts: Artifact[];
    memos: Memo[];
}

const NS = "urn:reproducibility.org:refi-qda";

/**
 * Exports the project as a REFI-QDA Project Exchange (QDPX) file.
 * This is a ZIP file containing a project.qde XML descriptor and source files.
 * Enhanced for Atlas.ti compatibility.
 */
export const exportProjectToRefiQda = async (state: ProjectState): Promise<Blob> => {
    const { settings, team, codes, artifacts, memos, codings } = state;
    const zip = new JSZip();
    const sourcesFolder = zip.folder("Sources");
    
    const now = new Date().toISOString();
    const defaultCreator = team.researchers[0]?.id || 'system';

    // 1. Users
    const usersXml = team.researchers.map(r => `
        <User guid="${r.id}" name="${escapeXml(r.name)}" />
    `).join('');

    // 2. CodeBook (Recursive)
    const buildCodeXml = (parentId?: string): string => {
        return codes
            .filter(c => c.parentId === parentId || (!parentId && !c.parentId))
            .map(c => `
                <Code guid="${c.id}" name="${escapeXml(c.name)}" isCodable="true" color="${c.color}" creator="${defaultCreator}" creationDateTime="${now}">
                    <Description>${escapeXml(c.description || c.kind)}</Description>
                    ${buildCodeXml(c.id)}
                </Code>
            `).join('');
    };

    const codeBookXml = `
        <CodeBook>
            <Codes>
                ${buildCodeXml(undefined)}
            </Codes>
        </CodeBook>
    `;

    // 3. Cases (Participants)
    // Mapping Participants to REFI-QDA Cases allows Atlas.ti to see them as units of analysis
    const casesXml = settings.participants.length > 0 ? `
        <Cases>
            ${settings.participants.map(p => `
                <Case guid="${p.id}" name="${escapeXml(p.anonymizedCode)}" creator="${defaultCreator}" creationDateTime="${now}">
                    <Description>${escapeXml(p.description)}</Description>
                </Case>
            `).join('')}
        </Cases>
    ` : '';

    // 4. Sources & Codings
    const sourcesXml = artifacts.map(a => {
        // Plain text content embedded for simplicity in this implementation
        const filename = `${a.id}.txt`;
        // Normalize line endings for consistent character counting across platforms
        const normalizedContent = a.content.replace(/\r\n/g, '\n'); 
        if (sourcesFolder) sourcesFolder.file(filename, normalizedContent);

        // Get codings for this artifact
        const artCodings = codings.filter(c => c.artifactId === a.id);
        
        // Generate Selections
        const selectionsXml = artCodings.map(c => `
            <Selection guid="${c.id}" startPosition="${c.start}" endPosition="${c.end}" name="${escapeXml(c.textSnippet.substring(0, 50))}" creator="${c.researcherId || defaultCreator}" creationDateTime="${now}">
                <Coding guid="coding-${c.id}" codeRef="${c.codeId}" creator="${c.researcherId || defaultCreator}" creationDateTime="${now}"/>
            </Selection>
        `).join('');

        return `
        <TextSource guid="${a.id}" name="${escapeXml(a.name)}" path="Sources/${filename}" creator="${a.responsibleId || defaultCreator}" creationDateTime="${a.curation.dateCreated}">
            <PlainTextContent>${escapeXml(normalizedContent)}</PlainTextContent>
            <Description>Type: ${a.type}; Access: ${a.access}; Status: ${a.status}</Description>
            ${selectionsXml}
        </TextSource>
        `;
    }).join('');

    // 5. Notes (Memos)
    const notesXml = memos.map(m => `
        <Note guid="${m.id}" name="${escapeXml(m.title)}" creator="${m.authorId || defaultCreator}" creationDateTime="${m.createdAt}">
            <Description>Type: ${m.type}</Description>
            <PlainTextContent>${escapeXml(m.content)}</PlainTextContent>
        </Note>
    `).join('');

    // 6. Project Metadata
    const description = `
Background: ${settings.structuredAbstract.background}
Methods: ${settings.structuredAbstract.methods}
Results: ${settings.structuredAbstract.results}
Conclusion: ${settings.structuredAbstract.conclusion}
    `.trim();

    // Project Wrapper
    const projectQde = `<?xml version="1.0" encoding="utf-8"?>
<Project xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" origin="Stratum CAQDAS" name="${escapeXml(settings.projectName)}" guid="proj-${Date.now()}" creationDateTime="${now}" xmlns="${NS}">
    <Users>
        ${usersXml}
    </Users>
    ${codeBookXml}
    ${casesXml}
    <Sources>
        ${sourcesXml}
    </Sources>
    <Notes>
        ${notesXml}
    </Notes>
    <Description>${escapeXml(description)}</Description>
</Project>`;

    zip.file("project.qde", projectQde);

    return zip.generateAsync({ type: "blob" });
};

/**
 * Parses a QDPX file (ZIP) and extracts project data.
 */
export const parseRefiQdaToProject = async (file: File): Promise<Partial<ProjectState>> => {
    const zip = await JSZip.loadAsync(file);
    const qdeFile = zip.file("project.qde");
    
    if (!qdeFile) throw new Error("Invalid QDPX file: project.qde missing");

    const xmlText = await qdeFile.async("string");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Helper to get text content
    const getText = (el: Element, tag: string) => {
        const node = el.getElementsByTagName(tag)[0];
        return node?.textContent || "";
    };
    
    // 1. Users
    const users = Array.from(xmlDoc.getElementsByTagName("User")).map(el => ({
        id: el.getAttribute("guid") || `u-${Math.random()}`,
        name: el.getAttribute("name") || "Unknown",
        role: "Junior" as const,
        color: "#888888",
        initials: (el.getAttribute("name") || "??").substring(0,2).toUpperCase()
    }));

    // 2. Codes
    const codes: Code[] = [];
    const traverseCodes = (parentEl: Element, parentId?: string) => {
        const codeEls = Array.from(parentEl.children).filter(n => n.tagName === 'Code');
        codeEls.forEach(el => {
            const id = el.getAttribute("guid") || `c-${Math.random()}`;
            codes.push({
                id,
                name: el.getAttribute("name") || "Untitled",
                color: el.getAttribute("color") || "#cccccc",
                description: getText(el, "Description"),
                kind: parentId ? 'code' : 'category',
                isCore: false,
                parentId,
                relatedCodeIds: []
            });
            traverseCodes(el, id);
        });
    };
    
    const codeBook = xmlDoc.getElementsByTagName("CodeBook")[0];
    if (codeBook) {
        const rootCodesNode = codeBook.getElementsByTagName("Codes")[0];
        if (rootCodesNode) traverseCodes(rootCodesNode);
    }

    // 3. Artifacts & Codings
    const artifacts: Artifact[] = [];
    const codings: Coding[] = [];
    
    const sourceEls = Array.from(xmlDoc.getElementsByTagName("TextSource"));
    
    for (const el of sourceEls) {
        const id = el.getAttribute("guid") || `a-${Math.random()}`;
        const name = el.getAttribute("name") || "Untitled Source";
        let content = getText(el, "PlainTextContent");

        if (!content && el.getAttribute("path")) {
             const path = el.getAttribute("path")!;
             const f = zip.file("Sources/" + path.split('/').pop()) || zip.file(path); // Try both loose and precise path
             if (f) content = await f.async("string");
        }

        artifacts.push({
            id,
            hashID: Math.random().toString(36),
            name,
            content: content || "",
            type: 'document',
            media: 'text',
            status: 'acquisition',
            access: 'private',
            curation: {
                format: 'Text',
                source: 'QDPX Import',
                dateCreated: el.getAttribute("creationDateTime") || new Date().toISOString(),
                consentObtained: false
            }
        });

        // Parse Selections / Codings
        const selections = Array.from(el.getElementsByTagName("Selection"));
        selections.forEach(sel => {
            const codingRef = sel.getElementsByTagName("Coding")[0];
            if (codingRef) {
                codings.push({
                    id: sel.getAttribute("guid") || `cd-${Math.random()}`,
                    artifactId: id,
                    codeId: codingRef.getAttribute("codeRef") || "",
                    start: parseInt(sel.getAttribute("startPosition") || "0"),
                    end: parseInt(sel.getAttribute("endPosition") || "0"),
                    textSnippet: sel.getAttribute("name") || "Imported Segment",
                    researcherId: sel.getAttribute("creator") || undefined
                });
            }
        });
    }

    // 4. Participants (from Cases)
    const participants: Participant[] = Array.from(xmlDoc.getElementsByTagName("Case")).map(el => ({
        id: el.getAttribute("guid") || `p-${Math.random()}`,
        anonymizedCode: el.getAttribute("name") || "Unknown Case",
        description: getText(el, "Description"),
        isCoConstructor: false
    }));

    // 5. Memos (Notes)
    const memos: Memo[] = Array.from(xmlDoc.getElementsByTagName("Note")).map(el => ({
        id: el.getAttribute("guid") || `m-${Math.random()}`,
        title: el.getAttribute("name") || "Note",
        content: getText(el, "PlainTextContent"),
        relatedIds: [],
        createdAt: el.getAttribute("creationDateTime") || new Date().toISOString(),
        type: 'observational',
        number: 0
    }));

    return {
        settings: {
            projectName: xmlDoc.documentElement.getAttribute("name") || "Imported QDPX",
            userName: "Imported User",
            themeMode: "dark",
            stripeWidth: 4,
            aiModel: "gemini-3-flash-preview",
            stopWords: [],
            theoryType: "constructivist",
            fieldOfStudy: { subjectOfStudy: "", objectOfStudy: "", location: "" },
            theoreticalFramework: { researchQuestions: [], methods: [], tools: [], bibliographyContent: "" },
            participants,
            structuredAbstract: { 
                background: getText(xmlDoc.documentElement, "Description"), 
                methods: "", 
                results: "", 
                conclusion: "", 
                keywords: "",
                artifactMapping: {
                    background: [],
                    methods: [],
                    results: [],
                    conclusion: []
                }
            }
        },
        team: {
            id: 'imported-team',
            researchers: users,
            consensusCriteria: []
        },
        codes,
        artifacts,
        memos,
        codings
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