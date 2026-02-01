package com.blog._blog.repository;

import com.blog._blog.entity.Notification;
import com.blog._blog.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    void deleteByRecipient(User recipient);

    void deleteByActor(User actor);
}
