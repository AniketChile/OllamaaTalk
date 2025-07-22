const express = require('express');
const router = express.Router();
const pool = require('../db');

let abortControllers = {};

// Create a new chat
router.post('/chat', async (req, res) => {
  try {
    const title = req.body?.title || 'Untitled Chat';
    const result = await pool.query(
      `INSERT INTO chats (id, title) VALUES (gen_random_uuid(), $1) RETURNING *`,
      [title]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get all chats
router.get('/chats', async (req, res) => {
  const result = await pool.query('SELECT * FROM chats ORDER BY created_at DESC');
  res.json(result.rows);
});

// Get messages for a chat
router.get('/chat/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const result = await pool.query(
    'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
    [chatId]
  );
  res.json(result.rows);
});

// Send user message and stream assistant response
router.post('/chat/:chatId/message', async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Missing content' });

  await pool.query(
    'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
    [chatId, 'user', content]
  );

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const controller = new AbortController();
  abortControllers[chatId] = controller;

  let assistantMessage = '';

  try {
    const ollamaRes = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gemma3',
        prompt: content,
        stream: true,
      }),
    });

    if (!ollamaRes.ok || !ollamaRes.body) {
      const errorText = await ollamaRes.text();
      console.error(`Ollama error: ${errorText}`);
      throw new Error(`Ollama request failed: ${ollamaRes.statusText}`);
    }

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const matches = [...buffer.matchAll(/\{.*?\}(?=\n|\r|$)/gs)];
      for (const match of matches) {
        try {
          const json = JSON.parse(match[0]);
          if (json.response) {
            assistantMessage += json.response;
            res.write(`${json.response}\n`);
          }
        } catch (e) {
          console.warn('Skipped malformed JSON:', match[0]);
        }
      }

      const lastMatch = matches.at(-1);
      buffer = lastMatch
        ? buffer.slice(buffer.indexOf(lastMatch[0]) + lastMatch[0].length)
        : buffer;
    }

    await pool.query(
      'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chatId, 'assistant', assistantMessage]
    );

    res.write('[DONE]\n');
    res.end();
  } catch (err) {
    console.error('❌ Error in message stream:', err);
    res.write(`data: ERROR: ${err.message}\n\n`);
    res.end();
  } finally {
    delete abortControllers[chatId];
  }
});

// Stop streaming
router.post('/chat/:chatId/stop', (req, res) => {
  const { chatId } = req.params;
  const controller = abortControllers[chatId];
  if (controller) controller.abort();
  res.json({ stopped: true });
});

module.exports = router;
