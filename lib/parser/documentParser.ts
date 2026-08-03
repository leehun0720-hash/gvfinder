/**
 * Document parsing and chunking logic for HWP and PDF files.
 */
export async function parseAndChunkDocument(text: string) {
  // Simple chunking by paragraph for MVP
  const chunks = text.split(/\n\s*\n/).filter(c => c.trim().length > 0);
  return chunks;
}
