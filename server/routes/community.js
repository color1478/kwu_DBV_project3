import express from 'express';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all posts (with pagination and search)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT p.*, u.nickname as author_name,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) as comment_count,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) as like_count
      FROM posts p
      INNER JOIN users u ON p.author_id = u.user_id
    `;

    const params = [];

    if (search) {
      query += ` WHERE MATCH(p.title, p.body) AGAINST(? IN NATURAL LANGUAGE MODE)`;
      params.push(search);
    }

    // MySQL에서 LIMIT과 OFFSET에는 파라미터를 사용할 수 없으므로 직접 숫자로 변환
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    query += ` ORDER BY p.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [posts] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM posts';
    const countParams = [];
    if (search) {
      countQuery += ` WHERE MATCH(title, body) AGAINST(? IN NATURAL LANGUAGE MODE)`;
      countParams.push(search);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get post detail
router.get('/:id', async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);

    // Increment views
    await pool.execute(
      'UPDATE posts SET views = views + 1 WHERE post_id = ?',
      [postId]
    );

    // Get post
    const [posts] = await pool.execute(
      `SELECT p.*, u.nickname as author_name
       FROM posts p
       INNER JOIN users u ON p.author_id = u.user_id
       WHERE p.post_id = ?`,
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = posts[0];

    // Get comments
    const [comments] = await pool.execute(
      `SELECT c.*, u.nickname as author_name
       FROM comments c
       INNER JOIN users u ON c.author_id = u.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );

    // Get like count
    const [likeCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
      [postId]
    );

    // Check if current user liked (if authenticated)
    let isLiked = false;
    if (req.session.userId) {
      const [userLike] = await pool.execute(
        'SELECT like_id FROM likes WHERE post_id = ? AND user_id = ?',
        [postId, req.session.userId]
      );
      isLiked = userLike.length > 0;
    }

    res.json({
      post,
      comments,
      likeCount: likeCount[0].count,
      isLiked
    });
  } catch (error) {
    next(error);
  }
});

// Create post
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { title, body, imageUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO posts (author_id, title, body, image_url) VALUES (?, ?, ?, ?)',
      [req.session.userId, title, body, imageUrl || null]
    );

    res.status(201).json({
      message: 'Post created successfully',
      postId: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// Update post
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, body, imageUrl } = req.body;

    // Check ownership
    const [posts] = await pool.execute(
      'SELECT author_id FROM posts WHERE post_id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (posts[0].author_id !== req.session.userId) {
      return res.status(403).json({ error: 'Only the author can update this post' });
    }

    await pool.execute(
      'UPDATE posts SET title = ?, body = ?, image_url = ? WHERE post_id = ?',
      [title, body, imageUrl || null, postId]
    );

    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete post
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);

    // Check if user is admin
    const [users] = await pool.execute('SELECT role FROM users WHERE user_id = ?', [req.session.userId]);
    const isAdmin = users.length > 0 && users[0].role === 'ADMIN';

    // Check ownership or admin
    const [posts] = await pool.execute(
      'SELECT author_id FROM posts WHERE post_id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!isAdmin && posts[0].author_id !== req.session.userId) {
      return res.status(403).json({ error: 'Only the author or admin can delete this post' });
    }

    await pool.execute('DELETE FROM posts WHERE post_id = ?', [postId]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add comment
router.post('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'Comment body is required' });
    }

    // Check if post exists
    const [posts] = await pool.execute(
      'SELECT post_id FROM posts WHERE post_id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const [result] = await pool.execute(
      'INSERT INTO comments (post_id, author_id, body) VALUES (?, ?, ?)',
      [postId, req.session.userId, body]
    );

    res.status(201).json({
      message: 'Comment added successfully',
      commentId: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// Toggle like
router.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);

    // Check if already liked
    const [existing] = await pool.execute(
      'SELECT like_id FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, req.session.userId]
    );

    if (existing.length > 0) {
      // Unlike
      await pool.execute(
        'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
        [postId, req.session.userId]
      );
      res.json({ message: 'Post unliked', liked: false });
    } else {
      // Like
      await pool.execute(
        'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
        [postId, req.session.userId]
      );
      res.json({ message: 'Post liked', liked: true });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

