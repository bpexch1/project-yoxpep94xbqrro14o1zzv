export function databaseBoundary(client: any): any {
  if (client) return client;
  return new Proxy({}, {
    get() {
      throw new Error("Database service is not configured. Please contact the administrator.");
    },
  });
}
