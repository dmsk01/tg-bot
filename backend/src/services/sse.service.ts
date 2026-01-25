import type { Response } from 'express';

interface SseConnection {
  userId: string;
  res: Response;
}

class SseService {
  private connections: Map<string, SseConnection[]> = new Map();

  addConnection(userId: string, res: Response): void {
    const userConnections = this.connections.get(userId) || [];
    userConnections.push({ userId, res });
    this.connections.set(userId, userConnections);

    res.on('close', () => {
      this.removeConnection(userId, res);
    });
  }

  private removeConnection(userId: string, res: Response): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const filtered = userConnections.filter((conn) => conn.res !== res);
      if (filtered.length > 0) {
        this.connections.set(userId, filtered);
      } else {
        this.connections.delete(userId);
      }
    }
  }

  sendLanguageChanged(userId: string, languageCode: string): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const data = JSON.stringify({ type: 'language_changed', languageCode });
      userConnections.forEach((conn) => {
        conn.res.write(`data: ${data}\n\n`);
      });
    }
  }
}

export const sseService = new SseService();
