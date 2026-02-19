package com.blog._blog.service;

import com.blog._blog.dto.NotificationDTO;
import com.blog._blog.entity.Notification;
import com.blog._blog.entity.NotificationType;
import com.blog._blog.entity.User;
import com.blog._blog.repository.NotificationRepository;
import com.blog._blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUserNotifications(String email) {
        User recipient = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.findByRecipientOrderByCreatedAtDesc(recipient).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long id, String email) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getRecipient().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String email) {
        User recipient = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> unread = notificationRepository.findByRecipientOrderByCreatedAtDesc(recipient);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void createNotification(User recipient, User actor, NotificationType type, Long entityId) {
        if (recipient.getId().equals(actor.getId())) {
            return; // Don't notify self actions
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .entityId(entityId)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    @Transactional
    public void deleteNotification(User recipient, User actor, NotificationType type, Long entityId) {
        notificationRepository.deleteByRecipientAndActorAndTypeAndEntityId(recipient, actor, type, entityId);
    }

    @Transactional
    public void deleteNotificationsByTypeAndEntity(NotificationType type, Long entityId) {
        notificationRepository.deleteByTypeAndEntityId(type, entityId);
    }

    private NotificationDTO mapToDTO(Notification notification) {
        String actorName = notification.getActor().getFirstname() + " " + notification.getActor().getLastname();
        String message = generateMessage(actorName, notification.getType());

        return NotificationDTO.builder()
                .id(notification.getId())
                .actorName(actorName)
                .actorAvatar(notification.getActor().getAvatar()) // Assuming User has getAvatar()
                .actorId(notification.getActor().getId())
                .type(notification.getType())
                .entityId(notification.getEntityId())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .message(message)
                .build();
    }

    private String generateMessage(String actorName, NotificationType type) {
        switch (type) {
            case LIKE:
                return "liked your post.";
            case COMMENT:
                return "commented on your post.";
            case FOLLOW:
                return "started following you.";
            case NEW_POST:
                return "published a new post.";
            case SYSTEM:
                return "sent a system alert.";
            default:
                return "interacted with you.";
        }
    }
}
