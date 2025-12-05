import express from 'express';
import { quickFeedback as aiQuickFeedback, chatCompletion } from '../services/groqClient.js';
import { verifyAuthToken, optionalAuth } from '../middleware/verifyAuthToken.js';
import ChatHistory from '../models/ChatHistory.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get instant feedback on text
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.length < 10) {
      return res.status(400).json({ error: 'Text must be at least 10 characters long' });
    }

    const feedback = await aiQuickFeedback(text);

    res.json({
      success: true,
      feedback: {
        rating: feedback.rating,
        feedback: feedback.feedback,
        strengths: feedback.strengths || [],
        weaknesses: feedback.weaknesses || [],
        suggestions: feedback.suggestions || [],
        improvedVersion: feedback.improved_version || ''
      }
    });
  } catch (error) {
    console.error('Quick feedback error:', error);
    res.status(500).json({ error: 'Failed to generate feedback: ' + error.message });
  }
});

// Chat-based feedback (maintains conversation)
router.post('/chat', verifyAuthToken, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const { uid } = req.user;

    if (!message || message.length < 1) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create chat session
    const currentSessionId = sessionId || uuidv4();
    let chatHistory = await ChatHistory.findOne({ uid, sessionId: currentSessionId });

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        uid,
        sessionId: currentSessionId,
        messages: []
      });
    }

    // Add user message
    chatHistory.messages.push({
      role: 'user',
      content: message
    });

    // Prepare messages for AI (last 10 messages for context)
    const contextMessages = chatHistory.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Get AI response
    const aiResponse = await chatCompletion(contextMessages);

    // Try to parse structured feedback if present
    let structuredFeedback = null;
    try {
      if (aiResponse.includes('{') && aiResponse.includes('}')) {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredFeedback = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      // Not JSON, that's fine
    }

    // Add assistant message
    chatHistory.messages.push({
      role: 'assistant',
      content: aiResponse,
      structuredFeedback
    });

    await chatHistory.save();

    res.json({
      success: true,
      sessionId: currentSessionId,
      response: aiResponse,
      structuredFeedback,
      messageCount: chatHistory.messages.length
    });
  } catch (error) {
    console.error('Chat feedback error:', error);
    res.status(500).json({ error: 'Failed to get response: ' + error.message });
  }
});

// Get chat history
router.get('/history', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const chats = await ChatHistory.find({ uid })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('sessionId title createdAt updatedAt');

    const total = await ChatHistory.countDocuments({ uid });

    res.json({
      success: true,
      chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Get specific chat session
router.get('/session/:sessionId', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { sessionId } = req.params;

    const chat = await ChatHistory.findOne({ uid, sessionId });

    if (!chat) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ error: 'Failed to get chat session' });
  }
});

// Delete chat session
router.delete('/session/:sessionId', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { sessionId } = req.params;

    const result = await ChatHistory.deleteOne({ uid, sessionId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json({
      success: true,
      message: 'Chat session deleted'
    });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
});

// Export chat as text
router.get('/export/:sessionId', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { sessionId } = req.params;
    const { format = 'text' } = req.query;

    const chat = await ChatHistory.findOne({ uid, sessionId });

    if (!chat) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    if (format === 'json') {
      res.json({
        success: true,
        title: chat.title,
        messages: chat.messages,
        exportedAt: new Date().toISOString()
      });
    } else {
      // Text format
      let textContent = `Chat Export: ${chat.title}\n`;
      textContent += `Exported: ${new Date().toISOString()}\n`;
      textContent += '='.repeat(50) + '\n\n';

      chat.messages.forEach((msg, index) => {
        textContent += `[${msg.role.toUpperCase()}] (${new Date(msg.timestamp).toLocaleString()})\n`;
        textContent += msg.content + '\n\n';
        if (msg.structuredFeedback) {
          textContent += 'Structured Feedback:\n';
          textContent += JSON.stringify(msg.structuredFeedback, null, 2) + '\n\n';
        }
        textContent += '-'.repeat(30) + '\n\n';
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="chat-${sessionId}.txt"`);
      res.send(textContent);
    }
  } catch (error) {
    console.error('Export chat error:', error);
    res.status(500).json({ error: 'Failed to export chat' });
  }
});

export default router;
