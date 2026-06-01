package com.rentcity.Rentcity.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Lưu file ảnh vào ổ đĩa local.
 * File được lưu trong thư mục cấu hình bởi app.upload-dir và phục vụ lại qua URL /uploads/**.
 */
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "webp", "gif");

    private final Path rootDir;

    public FileStorageService(@Value("${app.upload-dir:./uploads}") String uploadDir) {
        this.rootDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    /**
     * Lưu một file ảnh vào thư mục con cho trước.
     *
     * @param file   file ảnh upload lên
     * @param subDir thư mục con, ví dụ "cars"
     * @return đường dẫn URL công khai, ví dụ /uploads/cars/abc.jpg
     */
    public String store(MultipartFile file, String subDir) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không được để trống");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File tải lên phải là ảnh");
        }

        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        ext = (ext == null) ? "" : ext.toLowerCase();
        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("Định dạng ảnh không hợp lệ. Chỉ chấp nhận: " + ALLOWED_EXT);
        }

        try {
            Path targetDir = rootDir.resolve(subDir).normalize();
            Files.createDirectories(targetDir);

            String fileName = UUID.randomUUID().toString().replace("-", "") + "." + ext;
            Path target = targetDir.resolve(fileName);

            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return "/uploads/" + subDir + "/" + fileName;
        } catch (IOException e) {
            throw new UncheckedIOException("Lưu file ảnh thất bại", e);
        }
    }

    /**
     * Xóa file theo đường dẫn URL công khai (ví dụ /uploads/cars/abc.jpg).
     * Không ném lỗi nếu file không tồn tại.
     */
    public void delete(String publicUrl) {
        if (publicUrl == null || publicUrl.isBlank()) {
            return;
        }
        // /uploads/cars/abc.jpg → cars/abc.jpg
        String relative = publicUrl.startsWith("/uploads/") ? publicUrl.substring("/uploads/".length()) : publicUrl;
        try {
            Path target = rootDir.resolve(relative).normalize();
            // Ngăn path traversal
            if (!target.startsWith(rootDir)) {
                return;
            }
            Files.deleteIfExists(target);
        } catch (IOException e) {
            // Log but don't fail — file may already be gone
        }
    }
}
