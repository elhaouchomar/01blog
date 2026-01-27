package com.blog._blog.config;

import com.blog._blog.entity.Comment;
import com.blog._blog.entity.Post;
import com.blog._blog.entity.Role;
import com.blog._blog.entity.User;
import com.blog._blog.entity.Notification;
import com.blog._blog.entity.NotificationType;
import com.blog._blog.repository.PostRepository;
import com.blog._blog.repository.UserRepository;
import com.blog._blog.repository.CommentRepository;
import com.blog._blog.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    @Bean
    @Transactional
    CommandLineRunner initDatabase() {
        return args -> {
            if (userRepository.count() == 0) {
                System.out.println("🌱 Seeding database with realistic users and content...");

                // Realistic user data with avatars, bios, and covers
                List<UserData> usersData = Arrays.asList(
                        new UserData("Admin", "User", "admin@example.com", "admin123", Role.ADMIN,
                                "https://i.pravatar.cc/150?img=1",
                                "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop",
                                "Platform administrator and moderator. Keeping the community safe and engaging."),
                        new UserData("Sarah", "Chen", "sarah@example.com", "password", Role.USER,
                                "https://i.pravatar.cc/150?img=5",
                                "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop",
                                "Full-stack developer passionate about React and Node.js. Sharing my learning journey!"),
                        new UserData("Michael", "Rodriguez", "michael@example.com", "password", Role.USER,
                                "https://i.pravatar.cc/150?img=12",
                                "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=400&fit=crop",
                                "Software engineer | Open source enthusiast | Tech blogger"),
                        new UserData("Emma", "Watson", "emma@example.com", "password", Role.USER,
                                "https://i.pravatar.cc/150?img=9",
                                "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop",
                                "UI/UX Designer | Creating beautiful and functional interfaces"),
                        new UserData("James", "Wilson", "james@example.com", "password", Role.USER,
                                "https://i.pravatar.cc/150?img=15",
                                "https://images.unsplash.com/photo-1551033406-611cf9a28f61?w=1200&h=400&fit=crop",
                                "Backend developer specializing in microservices and cloud architecture"),
                        new UserData("Sophia", "Anderson", "sophia@example.com", "password", Role.USER,
                                "https://i.pravatar.cc/150?img=20",
                                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop",
                                "Data scientist | Machine learning enthusiast | Python lover"),
                        new UserData("David", "Lee", "david@example.com", "password", Role.USER,
                                "https://i.pravatar.cc/150?img=33",
                                "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=400&fit=crop",
                                "Mobile app developer | iOS & Android | Sharing tips and tricks"),
                        new UserData("Olivia", "Martinez", "olivia@example.com", "password", Role.USER,
                                "https://i.pravatar.cc/150?img=47",
                                "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=400&fit=crop",
                                "DevOps engineer | Kubernetes | CI/CD pipelines"),
                        new UserData("Lucas", "Taylor", "lucas@example.com", "password", Role.USER,
                                "https://i.pravatar.cc/150?img=52",
                                "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=400&fit=crop",
                                "Cybersecurity expert | Ethical hacker | Security researcher"),
                        new UserData("Isabella", "Garcia", "isabella@example.com", "password", Role.USER,
                                "https://i.pravatar.cc/150?img=60",
                                "https://images.unsplash.com/photo-1557683311-eac922147aa6?w=1200&h=400&fit=crop",
                                "Product manager | Tech enthusiast | Startup advisor"));

                // Create users
                List<User> users = new java.util.ArrayList<>(usersData.stream().map(ud -> {
                    User user = User.builder()
                            .firstname(ud.firstname)
                            .lastname(ud.lastname)
                            .email(ud.email)
                            .password(passwordEncoder.encode(ud.password))
                            .role(ud.role)
                            .avatar(ud.avatar)
                            .cover(ud.cover)
                            .bio(ud.bio)
                            .banned(false)
                            .subscribed(false)
                            .build();
                    return userRepository.save(user);
                }).collect(Collectors.toList()));

                System.out.println("✅ Created " + users.size() + " users with profiles");

                // Create additional users for network
                String[] firstNames = { "Alex", "Jordan", "Casey", "Morgan", "Riley", "Avery", "Quinn", "Blake",
                        "Cameron", "Dakota" };
                String[] lastNames = { "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas",
                        "Jackson", "White" };

                for (int i = 1; i <= 20; i++) {
                    User networkUser = User.builder()
                            .firstname(firstNames[i % 10])
                            .lastname(lastNames[(i / 2) % 10])
                            .email("user" + i + "@example.com")
                            .password(passwordEncoder.encode("password"))
                            .role(Role.USER)
                            .avatar("https://i.pravatar.cc/150?img=" + (i + 10))
                            .cover("https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop")
                            .bio("Tech enthusiast and lifelong learner")
                            .banned(false)
                            .subscribed(false)
                            .build();
                    users.add(userRepository.save(networkUser));
                }

                System.out.println("✅ Created " + (users.size() - usersData.size()) + " additional network users");

                // Create posts by different users
                if (postRepository.count() == 0) {
                    System.out.println("📝 Creating posts from various users...");

                    String[] postTitles = {
                            "Getting Started with Spring Boot",
                            "React Hooks: A Complete Guide",
                            "Understanding RESTful APIs",
                            "Docker Containerization Best Practices",
                            "Introduction to Microservices Architecture",
                            "JavaScript ES6+ Features You Should Know",
                            "Database Design Principles",
                            "CI/CD Pipeline Setup with GitHub Actions",
                            "GraphQL vs REST: Which to Choose?",
                            "Building Scalable Web Applications",
                            "TypeScript Tips and Tricks",
                            "Kubernetes Deployment Strategies",
                            "Clean Code Principles",
                            "API Security Best Practices",
                            "Frontend Performance Optimization",
                            "Backend Architecture Patterns",
                            "Testing Strategies for Web Apps",
                            "Cloud Computing Fundamentals",
                            "Agile Development Methodology",
                            "Version Control with Git"
                    };

                    String[] postContents = {
                            "Spring Boot makes it easy to create stand-alone, production-grade Spring based applications. In this post, I'll walk you through setting up your first Spring Boot project and understanding its core concepts.",
                            "React Hooks revolutionized how we write React components. Learn about useState, useEffect, useContext, and custom hooks in this comprehensive guide.",
                            "RESTful APIs are the backbone of modern web applications. Let's explore the principles, best practices, and common patterns used in REST API design.",
                            "Docker has become essential for modern development workflows. Discover best practices for containerization, image optimization, and multi-stage builds.",
                            "Microservices architecture allows you to build scalable and maintainable applications. Learn about service decomposition, communication patterns, and deployment strategies.",
                            "ES6+ brought many powerful features to JavaScript. From arrow functions to async/await, let's explore the features that changed how we write JavaScript.",
                            "Good database design is crucial for application performance. Learn about normalization, indexing, and query optimization techniques.",
                            "Automate your deployment process with GitHub Actions. I'll show you how to set up a complete CI/CD pipeline from scratch.",
                            "Both GraphQL and REST have their place. This post compares their strengths and helps you decide which fits your use case.",
                            "Scalability is key for modern applications. Explore techniques like load balancing, caching, and database sharding.",
                            "TypeScript adds type safety to JavaScript. Discover advanced features like generics, utility types, and type guards.",
                            "Kubernetes offers multiple deployment strategies. Learn about rolling updates, blue-green deployments, and canary releases.",
                            "Writing clean, maintainable code is an art. Explore SOLID principles, design patterns, and code organization techniques.",
                            "API security is critical. Learn about authentication, authorization, rate limiting, and common vulnerabilities.",
                            "Performance matters for user experience. Discover techniques like code splitting, lazy loading, and image optimization.",
                            "Backend architecture patterns help structure your application. Explore MVC, MVP, and layered architecture patterns.",
                            "Testing ensures code quality. Learn about unit tests, integration tests, and end-to-end testing strategies.",
                            "Cloud computing offers flexibility and scalability. Understand IaaS, PaaS, and SaaS models.",
                            "Agile methodology emphasizes collaboration and adaptability. Learn about Scrum, Kanban, and sprint planning.",
                            "Git is essential for version control. Master branching strategies, merge conflicts, and collaborative workflows."
                    };

                    String[] categories = { "Engineering", "Design", "DevOps", "Frontend", "Backend", "Full Stack" };
                    String[] tags = { "java", "spring", "react", "javascript", "docker", "kubernetes", "typescript",
                            "nodejs", "python", "aws" };

                    for (int i = 0; i < 50; i++) {
                        User author = users.get(random.nextInt(users.size()));
                        int titleIndex = i % postTitles.length;

                        Post post = Post.builder()
                                .title(postTitles[titleIndex]
                                        + (i >= postTitles.length ? " - Part " + (i / postTitles.length + 1) : ""))
                                .content(postContents[titleIndex] + "\n\n" + generateRandomContent())
                                .category(categories[random.nextInt(categories.length)])
                                .readTime((5 + random.nextInt(10)) + " min")
                                .author(author)
                                .createdAt(LocalDateTime.now().minusDays(random.nextInt(30))
                                        .minusHours(random.nextInt(24)))
                                .images(Arrays.asList("https://picsum.photos/seed/" + (i + 100) + "/800/600"))
                                .tags(Arrays.asList(
                                        tags[random.nextInt(tags.length)],
                                        tags[random.nextInt(tags.length)],
                                        tags[random.nextInt(tags.length)]))
                                .build();
                        postRepository.save(post);
                    }

                    System.out.println("✅ Created 50 posts from various users");
                }

                // Create comments
                if (commentRepository.count() == 0) {
                    System.out.println("💬 Creating comments on posts...");
                    List<Post> posts = postRepository.findAll();
                    String[] commentTexts = {
                            "Great post! Very informative.",
                            "Thanks for sharing this. It helped me a lot.",
                            "I have a question about the third point. Can you elaborate?",
                            "This is exactly what I was looking for!",
                            "Nice explanation. Keep up the good work!",
                            "I tried this approach and it worked perfectly.",
                            "Could you add more examples?",
                            "This cleared up my confusion. Thank you!",
                            "I disagree with point 2, but overall good content.",
                            "Bookmarked! This will be useful for my project."
                    };

                    for (Post post : posts) {
                        int commentCount = random.nextInt(5) + 1; // 1-5 comments per post
                        for (int i = 0; i < commentCount; i++) {
                            User commenter = users.get(random.nextInt(users.size()));
                            if (!commenter.getId().equals(post.getAuthor().getId())) {
                                Comment comment = Comment.builder()
                                        .content(commentTexts[random.nextInt(commentTexts.length)])
                                        .author(commenter)
                                        .post(post)
                                        .createdAt(LocalDateTime.now().minusDays(random.nextInt(7)))
                                        .build();
                                commentRepository.save(comment);
                            }
                        }
                    }
                    System.out.println("✅ Created comments on posts");
                }

                // Create likes
                System.out.println("❤️ Creating likes on posts...");
                List<Post> posts = postRepository.findAll();
                for (Post post : posts) {
                    int likeCount = random.nextInt(15) + 1; // 1-15 likes per post
                    Set<User> likers = new java.util.HashSet<>();
                    for (int i = 0; i < likeCount && i < users.size(); i++) {
                        User liker = users.get(random.nextInt(users.size()));
                        if (!liker.getId().equals(post.getAuthor().getId())) {
                            likers.add(liker);
                        }
                    }
                    // Set likes directly to avoid lazy loading issues
                    post.setLikes(likers);
                    postRepository.save(post);
                }
                System.out.println("✅ Created likes on posts");

                // Create follow relationships
                System.out.println("👥 Creating follow relationships...");
                for (User user : users) {
                    int followCount = random.nextInt(10) + 1; // Follow 1-10 users
                    Set<User> followingSet = new java.util.HashSet<>();
                    Set<Integer> followingIds = new java.util.HashSet<>(); // Track IDs to avoid duplicates
                    for (int i = 0; i < followCount; i++) {
                        User toFollow = users.get(random.nextInt(users.size()));
                        if (!toFollow.getId().equals(user.getId()) && !followingIds.contains(toFollow.getId())) {
                            followingSet.add(toFollow);
                            followingIds.add(toFollow.getId());
                        }
                    }
                    // Set the following collection directly to avoid lazy loading issues
                    user.setFollowing(followingSet);
                    userRepository.save(user);
                }
                System.out.println("✅ Created follow relationships");

                // Create notifications from interactions
                System.out.println("🔔 Creating notifications...");

                // Notifications for comments (comments are eagerly loaded)
                List<Post> allPosts = postRepository.findAll();
                for (Post post : allPosts) {
                    User postAuthor = post.getAuthor();
                    List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(post.getId());
                    for (Comment comment : comments) {
                        if (!comment.getAuthor().getId().equals(postAuthor.getId())) {
                            Notification notification = Notification.builder()
                                    .recipient(postAuthor)
                                    .actor(comment.getAuthor())
                                    .type(NotificationType.COMMENT)
                                    .entityId(post.getId())
                                    .isRead(random.nextBoolean())
                                    .createdAt(comment.getCreatedAt())
                                    .build();
                            notificationRepository.save(notification);
                        }
                    }
                }

                // Notifications for follows - create during follow relationship creation
                // We'll create notifications when users follow each other, not by accessing
                // lazy collections
                // This avoids the circular lazy loading issue
                System.out.println("   (Follow notifications will be created naturally when users interact)");

                // Note: Like notifications will be created automatically when users interact
                // with posts

                System.out.println("✅ Created notifications from interactions");
                System.out.println("🎉 Database seeding completed successfully!");
            } else {
                System.out.println("ℹ️  Database already contains data. Skipping seed.");
            }
        };
    }

    private String generateRandomContent() {
        String[] paragraphs = {
                "In this section, we'll dive deeper into the implementation details.",
                "Let me share some real-world examples from my experience.",
                "There are several approaches to solve this problem, each with its pros and cons.",
                "Performance considerations are crucial when implementing this solution.",
                "I've found this pattern to be particularly effective in production environments."
        };
        return paragraphs[random.nextInt(paragraphs.length)];
    }

    private static class UserData {
        String firstname, lastname, email, password, avatar, cover, bio;
        Role role;

        UserData(String firstname, String lastname, String email, String password, Role role,
                String avatar, String cover, String bio) {
            this.firstname = firstname;
            this.lastname = lastname;
            this.email = email;
            this.password = password;
            this.role = role;
            this.avatar = avatar;
            this.cover = cover;
            this.bio = bio;
        }
    }
}
