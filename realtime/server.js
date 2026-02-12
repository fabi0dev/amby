/* Simple WebSocket relay server for document collaboration.
 * Run with: `node realtime/server.js` (or `yarn realtime` if you add the script).
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WebSocketServer } = require('ws');

const PORT = process.env.REALTIME_PORT ? Number(process.env.REALTIME_PORT) : 3001;

/** @type {Map<string, Set<import('ws').WebSocket>>} */
const documents = new Map();

const wss = new WebSocketServer({ port: PORT });

console.log(`[realtime] WebSocket server listening on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  /** @type {string | null} */
  let documentId = null;

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'join' && typeof msg.documentId === 'string') {
      documentId = msg.documentId;
      if (!documents.has(documentId)) {
        documents.set(documentId, new Set());
      }
      documents.get(documentId).add(ws);
      return;
    }

    if (!documentId) return;

    // Broadcast content changes to other clients of the same document
    if (msg.type === 'content' || msg.type === 'cursor') {
      const clients = documents.get(documentId);
      if (!clients) return;
      for (const client of clients) {
        if (client !== ws && client.readyState === client.OPEN) {
          client.send(
            JSON.stringify({
              type: msg.type,
              documentId,
              clientId: msg.clientId,
              content: msg.content,
              from: msg.from,
              to: msg.to,
              name: msg.name,
              color: msg.color,
            }),
          );
        }
      }
    }
  });

  ws.on('close', () => {
    if (documentId && documents.has(documentId)) {
      const set = documents.get(documentId);
      set.delete(ws);
      if (set.size === 0) {
        documents.delete(documentId);
      }
    }
  });
});

