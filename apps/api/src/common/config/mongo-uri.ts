export function sanitizeMongoUri(raw?: string): string | undefined {
  if (!raw) return undefined;

  let uri = raw.trim();

  if (
    (uri.startsWith('"') && uri.endsWith('"')) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }

  // Common copy-paste mistake: "MONGODB_URI=mongodb+srv://..."
  if (uri.startsWith('MONGODB_URI=')) {
    uri = uri.slice('MONGODB_URI='.length).trim();
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return undefined;
  }

  return uri;
}

export function maskMongoUri(uri: string): string {
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
}
