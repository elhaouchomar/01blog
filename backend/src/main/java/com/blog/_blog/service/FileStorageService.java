package com.blog._blog.service;

import com.blog._blog.exception.FileValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".mp4", ".webm", ".mov");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp",
            "video/mp4", "video/webm", "video/quicktime");
    private static final Map<String, String> CONTENT_TYPE_ALIASES = Map.of(
            "image/jpg", "image/jpeg",
            "video/x-m4v", "video/mp4");

    private final Path fileStorageLocation;
    private final long maxFileSizeBytes;

    public FileStorageService(
            @Value("${file.upload-dir:uploads}") String uploadDir,
            @Value("${file.upload.max-size-bytes:10485760}") long maxFileSizeBytes) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        validateFile(file);

        // Normalize file name
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String extension = "";

        try {
            // Check if the file's name contains invalid characters
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + originalFileName);
            }

            int lastIndex = originalFileName.lastIndexOf('.');
            if (lastIndex != -1) {
                extension = originalFileName.substring(lastIndex);
            }

            String fileName = UUID.randomUUID().toString() + extension;

            // Copy file to the target location (Replacing existing file with the same name)
            Path targetLocation = this.fileStorageLocation.resolve(fileName).normalize();
            if (!targetLocation.startsWith(this.fileStorageLocation)) {
                throw new FileValidationException("Invalid file path");
            }
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }

    public Path getFilePath(String fileName) {
        return fileStorageLocation.resolve(fileName);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("Uploaded file is empty");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new FileValidationException("File exceeds maximum size of " + (maxFileSizeBytes / (1024 * 1024))
                    + "MB");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new FileValidationException("File name is required");
        }
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex < 0) {
            throw new FileValidationException("File extension is required");
        }

        String extension = originalName.substring(dotIndex).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new FileValidationException("Unsupported file type. Allowed: images and mp4/webm/mov videos");
        }

        String declaredType = normalizeContentType(file.getContentType());
        if (declaredType.isEmpty()) {
            throw new FileValidationException("Content type is required");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(declaredType)) {
            throw new FileValidationException("Unsupported media content type");
        }
        if (!isExtensionCompatible(extension, declaredType)) {
            throw new FileValidationException("File extension does not match declared media content type");
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) {
            return "";
        }
        String normalized = contentType.toLowerCase(Locale.ROOT).trim();
        return CONTENT_TYPE_ALIASES.getOrDefault(normalized, normalized);
    }

    private boolean isExtensionCompatible(String extension, String detectedType) {
        switch (extension) {
            case ".jpg":
            case ".jpeg":
                return "image/jpeg".equals(detectedType);
            case ".png":
                return "image/png".equals(detectedType);
            case ".gif":
                return "image/gif".equals(detectedType);
            case ".webp":
                return "image/webp".equals(detectedType);
            case ".bmp":
                return "image/bmp".equals(detectedType);
            case ".mp4":
                return "video/mp4".equals(detectedType);
            case ".webm":
                return "video/webm".equals(detectedType);
            case ".mov":
                return "video/quicktime".equals(detectedType);
            default:
                return false;
        }
    }
}
