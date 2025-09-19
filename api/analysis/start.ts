import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { nanoid } from 'nanoid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { selectedDecks } = req.body;

    if (!Array.isArray(selectedDecks) || selectedDecks.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty deck selection' });
    }

    // Create analysis job
    const jobId = nanoid();
    await storage.createAnalysisJob({
      id: jobId,
      status: 'pending',
      totalDecks: selectedDecks.length,
      completedDecks: 0,
      selectedDeckIds: selectedDecks,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Start background analysis (simplified for serverless)
    // In a real implementation, you might use a queue or different approach
    processAnalysisJob(jobId, selectedDecks);

    res.status(200).json({
      jobId,
      status: 'started',
      totalDecks: selectedDecks.length
    });

  } catch (error) {
    console.error('Error starting analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Background processing function
async function processAnalysisJob(jobId: string, selectedDecks: string[]) {
  try {
    await storage.updateAnalysisJob(jobId, {
      status: 'running',
      updatedAt: new Date()
    });

    for (let i = 0; i < selectedDecks.length; i++) {
      const deckId = selectedDecks[i];
      
      // Update progress
      await storage.updateAnalysisJob(jobId, {
        completedDecks: i + 1,
        currentDeck: deckId,
        updatedAt: new Date()
      });
      
      // Simulate analysis work (in real implementation, this would update deck prices)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await storage.updateAnalysisJob(jobId, {
      status: 'completed',
      completedDecks: selectedDecks.length,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error processing analysis job:', error);
    await storage.updateAnalysisJob(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      updatedAt: new Date()
    });
  }
}