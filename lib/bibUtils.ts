
/**
 * Triggers a download of the provided text content as a .bib file.
 * @param content The string content of the bibliography
 * @param filename The desired filename (e.g., 'project_refs')
 */
export const downloadBibFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.bib') ? filename : `${filename}.bib`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Validates if the content looks roughly like a BibTeX file.
 * Very basic check for @article, @book, etc.
 */
export const isLikelyBibTex = (content: string): boolean => {
    return /@\w+\s*\{/.test(content);
};
