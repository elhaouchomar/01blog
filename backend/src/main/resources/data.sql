-- Remove deprecated tags table from older schema versions.
DROP TABLE IF EXISTS post_tags;

-- Mock users (idempotent).
INSERT INTO _user (firstname, lastname, email, password, role, banned, subscribed, avatar, cover, bio, created_at)
SELECT
    'Admin',
    'User',
    'admin@example.com',
    '$2a$10$1wkvDehJNLAs2/exQE.IhegRnStcQvXZ6nJDBRgrUJDMcDHDxFN8O',
    'ADMIN',
    FALSE,
    FALSE,
    'https://i.pravatar.cc/150?img=1',
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop',
    'Platform administrator and moderator.',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM _user WHERE email = 'admin@example.com'
);

INSERT INTO _user (firstname, lastname, email, password, role, banned, subscribed, avatar, cover, bio, created_at)
SELECT
    'Sarah',
    'Chen',
    'sarah@example.com',
    '$2a$10$bMrHVx5h67Vzn9GKSPVFWOagzmZiF7UGJJO2fLYMoeoskrRNkrZg6',
    'USER',
    FALSE,
    FALSE,
    'https://i.pravatar.cc/150?img=5',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop',
    'Full-stack developer passionate about React and Node.js.',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM _user WHERE email = 'sarah@example.com'
);

INSERT INTO _user (firstname, lastname, email, password, role, banned, subscribed, avatar, cover, bio, created_at)
SELECT
    'Michael',
    'Rodriguez',
    'michael@example.com',
    '$2a$10$bMrHVx5h67Vzn9GKSPVFWOagzmZiF7UGJJO2fLYMoeoskrRNkrZg6',
    'USER',
    FALSE,
    FALSE,
    'https://i.pravatar.cc/150?img=12',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=400&fit=crop',
    'Software engineer and open-source enthusiast.',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM _user WHERE email = 'michael@example.com'
);

INSERT INTO _user (firstname, lastname, email, password, role, banned, subscribed, avatar, cover, bio, created_at)
SELECT
    'Emma',
    'Watson',
    'emma@example.com',
    '$2a$10$bMrHVx5h67Vzn9GKSPVFWOagzmZiF7UGJJO2fLYMoeoskrRNkrZg6',
    'USER',
    FALSE,
    FALSE,
    'https://i.pravatar.cc/150?img=9',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
    'UI/UX designer focused on clean user experience.',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM _user WHERE email = 'emma@example.com'
);

-- Mock posts (idempotent).
INSERT INTO posts (title, content, category, read_time, author_id, hidden, created_at, updated_at)
SELECT
    'Getting Started with Spring Boot',
    'Spring Boot makes it easy to build production-ready services with minimal setup.',
    'Backend',
    '6 min',
    u.id,
    FALSE,
    NOW() - INTERVAL '5 day',
    NOW() - INTERVAL '5 day'
FROM _user u
WHERE u.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Getting Started with Spring Boot');

INSERT INTO posts (title, content, category, read_time, author_id, hidden, created_at, updated_at)
SELECT
    'React Hooks: Practical Patterns',
    'A practical look at useState, useEffect, and custom hooks in real projects.',
    'Frontend',
    '7 min',
    u.id,
    FALSE,
    NOW() - INTERVAL '3 day',
    NOW() - INTERVAL '3 day'
FROM _user u
WHERE u.email = 'sarah@example.com'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'React Hooks: Practical Patterns');

INSERT INTO posts (title, content, category, read_time, author_id, hidden, created_at, updated_at)
SELECT
    'Docker Workflow for Teams',
    'Use multi-stage builds and consistent compose files to keep local and CI aligned.',
    'DevOps',
    '5 min',
    u.id,
    FALSE,
    NOW() - INTERVAL '2 day',
    NOW() - INTERVAL '2 day'
FROM _user u
WHERE u.email = 'michael@example.com'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Docker Workflow for Teams');

-- Post images.
INSERT INTO post_images (post_id, image_url)
SELECT p.id, 'https://picsum.photos/seed/springboot/800/600'
FROM posts p
WHERE p.title = 'Getting Started with Spring Boot'
  AND NOT EXISTS (
      SELECT 1 FROM post_images pi
      WHERE pi.post_id = p.id
        AND pi.image_url = 'https://picsum.photos/seed/springboot/800/600'
  );

INSERT INTO post_images (post_id, image_url)
SELECT p.id, 'https://picsum.photos/seed/reacthooks/800/600'
FROM posts p
WHERE p.title = 'React Hooks: Practical Patterns'
  AND NOT EXISTS (
      SELECT 1 FROM post_images pi
      WHERE pi.post_id = p.id
        AND pi.image_url = 'https://picsum.photos/seed/reacthooks/800/600'
  );

INSERT INTO post_images (post_id, image_url)
SELECT p.id, 'https://picsum.photos/seed/dockerteam/800/600'
FROM posts p
WHERE p.title = 'Docker Workflow for Teams'
  AND NOT EXISTS (
      SELECT 1 FROM post_images pi
      WHERE pi.post_id = p.id
        AND pi.image_url = 'https://picsum.photos/seed/dockerteam/800/600'
  );

-- Comments.
INSERT INTO comments (content, author_id, post_id, created_at)
SELECT
    'Great intro. This is clear and practical.',
    u.id,
    p.id,
    NOW() - INTERVAL '4 day'
FROM _user u
JOIN posts p ON p.title = 'Getting Started with Spring Boot'
WHERE u.email = 'sarah@example.com'
  AND NOT EXISTS (
      SELECT 1 FROM comments c
      WHERE c.post_id = p.id
        AND c.author_id = u.id
        AND c.content = 'Great intro. This is clear and practical.'
  );

INSERT INTO comments (content, author_id, post_id, created_at)
SELECT
    'Nice examples, especially the real-world hook usage.',
    u.id,
    p.id,
    NOW() - INTERVAL '2 day'
FROM _user u
JOIN posts p ON p.title = 'React Hooks: Practical Patterns'
WHERE u.email = 'michael@example.com'
  AND NOT EXISTS (
      SELECT 1 FROM comments c
      WHERE c.post_id = p.id
        AND c.author_id = u.id
        AND c.content = 'Nice examples, especially the real-world hook usage.'
  );

-- Post likes.
INSERT INTO post_likes (post_id, user_id)
SELECT p.id, u.id
FROM posts p
JOIN _user u ON u.email = 'emma@example.com'
WHERE p.title = 'Getting Started with Spring Boot'
  AND NOT EXISTS (
      SELECT 1 FROM post_likes pl
      WHERE pl.post_id = p.id
        AND pl.user_id = u.id
  );

INSERT INTO post_likes (post_id, user_id)
SELECT p.id, u.id
FROM posts p
JOIN _user u ON u.email = 'admin@example.com'
WHERE p.title = 'React Hooks: Practical Patterns'
  AND NOT EXISTS (
      SELECT 1 FROM post_likes pl
      WHERE pl.post_id = p.id
        AND pl.user_id = u.id
  );

-- Follow relationships.
INSERT INTO user_following (user_id, following_id)
SELECT u1.id, u2.id
FROM _user u1
JOIN _user u2 ON u2.email = 'michael@example.com'
WHERE u1.email = 'sarah@example.com'
  AND NOT EXISTS (
      SELECT 1 FROM user_following uf
      WHERE uf.user_id = u1.id
        AND uf.following_id = u2.id
  );

INSERT INTO user_following (user_id, following_id)
SELECT u1.id, u2.id
FROM _user u1
JOIN _user u2 ON u2.email = 'sarah@example.com'
WHERE u1.email = 'emma@example.com'
  AND NOT EXISTS (
      SELECT 1 FROM user_following uf
      WHERE uf.user_id = u1.id
        AND uf.following_id = u2.id
  );

-- ---------------------------------------------------------------------------
-- Bulk mock data (idempotent): ensure at least
-- 100 users, 1000 posts, 1000 post likes, 10000 comments
-- ---------------------------------------------------------------------------

-- Ensure at least 100 users.
INSERT INTO _user (firstname, lastname, email, password, role, banned, subscribed, avatar, cover, bio, created_at)
SELECT
    'User' || gs,
    'Seed',
    'seed.user' || gs || '@example.com',
    '$2a$10$bMrHVx5h67Vzn9GKSPVFWOagzmZiF7UGJJO2fLYMoeoskrRNkrZg6',
    'USER',
    FALSE,
    FALSE,
    'https://i.pravatar.cc/150?img=' || ((gs % 70) + 1),
    'https://picsum.photos/seed/cover' || gs || '/1200/400',
    'Generated seed user #' || gs,
    NOW() - (gs || ' hours')::interval
FROM generate_series(
    1,
    GREATEST(0, 100 - (SELECT COUNT(*) FROM _user))
) gs
ON CONFLICT (email) DO NOTHING;

-- Ensure at least 1000 posts.
INSERT INTO posts (title, content, category, read_time, author_id, hidden, created_at, updated_at)
SELECT
    'Seed Post #' || gs,
    'This is generated seed content for post #' || gs || '.',
    (ARRAY['Frontend', 'Backend', 'DevOps', 'Security', 'Database'])[((gs - 1) % 5) + 1],
    ((gs % 9) + 2) || ' min',
    (
        SELECT u.id
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
            FROM _user
        ) u
        WHERE u.rn = (((gs - 1) % (SELECT COUNT(*) FROM _user)) + 1)
    ),
    FALSE,
    NOW() - (gs || ' minutes')::interval,
    NOW() - (gs || ' minutes')::interval
FROM generate_series(
    1,
    GREATEST(0, 1000 - (SELECT COUNT(*) FROM posts))
) gs
ON CONFLICT DO NOTHING;

-- Ensure at least 1000 post likes.
INSERT INTO post_likes (post_id, user_id)
SELECT
    p.id,
    u.id
FROM generate_series(
    1,
    GREATEST(0, 1000 - (SELECT COUNT(*) FROM post_likes))
) gs
JOIN (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM posts
) p ON p.rn = (((gs - 1) % (SELECT COUNT(*) FROM posts)) + 1)
JOIN (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM _user
) u ON u.rn = ((((gs * 7) - 1) % (SELECT COUNT(*) FROM _user)) + 1)
ON CONFLICT DO NOTHING;

-- Ensure at least 10000 comments.
INSERT INTO comments (content, author_id, post_id, created_at)
SELECT
    'Seed comment #' || gs || ' on generated data.',
    u.id,
    p.id,
    NOW() - ((gs % 1440) || ' minutes')::interval
FROM generate_series(
    1,
    GREATEST(0, 10000 - (SELECT COUNT(*) FROM comments))
) gs
JOIN (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM _user
) u ON u.rn = ((((gs * 11) - 1) % (SELECT COUNT(*) FROM _user)) + 1)
JOIN (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM posts
) p ON p.rn = ((((gs * 13) - 1) % (SELECT COUNT(*) FROM posts)) + 1);
