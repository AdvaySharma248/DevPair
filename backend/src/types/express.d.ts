declare global {
  namespace Express {
    interface Request {
      auth?: {
        sessionId: string;
        user: {
          id: string;
          email: string;
          name: string;
          role: "mentor" | "student";
          avatar?: string | null;
          bio?: string | null;
          createdAt?: string;
          defaultLanguage?: string | null;
        };
      };
    }
  }
}

export {};
