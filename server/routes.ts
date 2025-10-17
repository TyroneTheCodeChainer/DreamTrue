// From javascript_log_in_with_replit blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDreamSchema, insertInterpretationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware (from blueprint)
  await setupAuth(app);

  // Auth routes (from blueprint)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dream routes (protected - premium users only for storage)
  app.post("/api/dreams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isPremium) {
        return res.status(403).json({ message: "Premium subscription required to save dreams" });
      }

      const dreamData = insertDreamSchema.parse({ ...req.body, userId });
      const dream = await storage.createDream(dreamData);
      res.json(dream);
    } catch (error: any) {
      console.error("Error creating dream:", error);
      res.status(400).json({ message: error.message || "Failed to create dream" });
    }
  });

  app.get("/api/dreams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isPremium) {
        return res.json([]); // Free users have no stored dreams
      }

      const dreams = await storage.getUserDreams(userId);
      res.json(dreams);
    } catch (error) {
      console.error("Error fetching dreams:", error);
      res.status(500).json({ message: "Failed to fetch dreams" });
    }
  });

  app.get("/api/dreams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const dream = await storage.getDream(req.params.id);
      
      if (!dream) {
        return res.status(404).json({ message: "Dream not found" });
      }
      
      // Verify ownership
      if (dream.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(dream);
    } catch (error) {
      console.error("Error fetching dream:", error);
      res.status(500).json({ message: "Failed to fetch dream" });
    }
  });

  app.delete("/api/dreams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const dream = await storage.getDream(req.params.id);
      
      if (!dream) {
        return res.status(404).json({ message: "Dream not found" });
      }
      
      // Verify ownership
      if (dream.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteDream(req.params.id);
      res.json({ message: "Dream deleted" });
    } catch (error) {
      console.error("Error deleting dream:", error);
      res.status(500).json({ message: "Failed to delete dream" });
    }
  });

  // Interpretation routes (protected)
  app.post("/api/interpretations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if Deep Dive requires premium
      if (req.body.analysisType === 'deep_dive' && !user?.isPremium) {
        return res.status(403).json({ message: "Premium subscription required for Deep Dive analysis" });
      }

      const interpretationData = insertInterpretationSchema.parse({ ...req.body, userId });
      const interpretation = await storage.createInterpretation(interpretationData);
      res.json(interpretation);
    } catch (error: any) {
      console.error("Error creating interpretation:", error);
      res.status(400).json({ message: error.message || "Failed to create interpretation" });
    }
  });

  app.get("/api/interpretations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isPremium) {
        return res.json([]); // Free users have no stored interpretations
      }

      const interpretations = await storage.getUserInterpretations(userId);
      res.json(interpretations);
    } catch (error) {
      console.error("Error fetching interpretations:", error);
      res.status(500).json({ message: "Failed to fetch interpretations" });
    }
  });

  app.get("/api/dreams/:dreamId/interpretations", isAuthenticated, async (req: any, res) => {
    try {
      const dream = await storage.getDream(req.params.dreamId);
      
      if (!dream) {
        return res.status(404).json({ message: "Dream not found" });
      }
      
      // Verify ownership
      if (dream.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const interpretations = await storage.getDreamInterpretations(req.params.dreamId);
      res.json(interpretations);
    } catch (error) {
      console.error("Error fetching interpretations:", error);
      res.status(500).json({ message: "Failed to fetch interpretations" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
