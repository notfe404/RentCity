package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.AdminReviewReplyRequest;
import com.rentcity.Rentcity.dto.AdminReviewVisibilityRequest;
import com.rentcity.Rentcity.dto.CarReviewsResponse;
import com.rentcity.Rentcity.dto.CreateReviewRequest;
import com.rentcity.Rentcity.dto.PublicReviewResponse;
import com.rentcity.Rentcity.dto.ReviewResponse;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import com.rentcity.Rentcity.repository.ReviewRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;

    @Transactional
    public ReviewResponse createReview(String email, CreateReviewRequest request) {
        User user = findUserByEmail(email);
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("booking", request.getBookingId()));

        if (!booking.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException("booking", request.getBookingId());
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Chỉ có thể đánh giá sau khi chuyến xe hoàn thành");
        }
        if (!booking.getCarId().equals(request.getVehicleId())) {
            throw new IllegalArgumentException("Xe trong đánh giá không khớp với booking");
        }
        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new IllegalArgumentException("Booking này đã được đánh giá");
        }

        Review review = Review.builder()
                .bookingId(booking.getId())
                .userId(user.getId())
                .carId(booking.getCarId())
                .overallRating(request.getOverallRating())
                .vehicleRating(request.getVehicleRating())
                .serviceRating(request.getServiceRating())
                .comment(normalizeText(request.getComment()))
                .isVisible(true)
                .build();

        return mapToResponse(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public ReviewResponse getMyBookingReview(String email, Long bookingId) {
        User user = findUserByEmail(email);
        Review review = reviewRepository.findByBookingIdAndUserId(bookingId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("review", bookingId));
        return mapToResponse(review);
    }

    @Transactional(readOnly = true)
    public CarReviewsResponse getPublicCarReviews(Long carId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size < 1 ? 5 : Math.min(size, 20);
        Page<Review> reviewPage = reviewRepository.findByCarIdAndIsVisibleTrueOrderByCreatedAtDesc(
                carId,
                PageRequest.of(safePage, safeSize)
        );
        List<Review> reviews = reviewPage.getContent();

        Set<Long> userIds = reviews.stream()
                .flatMap(review -> buildUserIds(review).stream())
                .collect(Collectors.toSet());
        Map<Long, User> usersById = userIds.isEmpty() ? Map.of() : userRepository.findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<PublicReviewResponse> content = reviews.stream()
                .map(review -> mapToPublicResponse(review, usersById))
                .toList();

        return CarReviewsResponse.builder()
                .content(content)
                .page(reviewPage.getNumber())
                .size(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .reviewCount(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .first(reviewPage.isFirst())
                .last(reviewPage.isLast())
                .averageRating(getAverageVisibleRating(carId))
                .ratingCounts(getVisibleRatingCounts(carId))
                .build();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAdminReviews() {
        return mapToResponses(reviewRepository.findAllByOrderByCreatedAtDesc());
    }

    @Transactional
    public ReviewResponse updateVisibility(Long reviewId, AdminReviewVisibilityRequest request) {
        Review review = findReview(reviewId);
        review.setVisible(Boolean.TRUE.equals(request.getVisible()));
        return mapToResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse replyToReview(String actorEmail, Long reviewId, AdminReviewReplyRequest request) {
        User actor = findUserByEmail(actorEmail);
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("Chỉ admin hoặc staff mới được phản hồi review");
        }

        Review review = findReview(reviewId);
        review.setStaffReply(normalizeText(request.getStaffReply()));
        review.setRepliedBy(review.getStaffReply() == null ? null : actor.getId());
        return mapToResponse(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public double getAverageVisibleRating(Long carId) {
        double average = reviewRepository.averageVisibleOverallRatingByCarId(carId);
        return BigDecimal.valueOf(average)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    @Transactional(readOnly = true)
    public long getVisibleReviewCount(Long carId) {
        return reviewRepository.countByCarIdAndIsVisibleTrue(carId);
    }

    @Transactional(readOnly = true)
    public Map<Integer, Long> getVisibleRatingCounts(Long carId) {
        Map<Integer, Long> counts = new LinkedHashMap<>();
        for (int rating = 1; rating <= 5; rating++) {
            counts.put(rating, 0L);
        }
        reviewRepository.countVisibleReviewsByRating(carId)
                .forEach(row -> counts.put((Integer) row[0], (Long) row[1]));
        return counts;
    }

    private Review findReview(Long reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("review", reviewId));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private ReviewResponse mapToResponse(Review review) {
        Map<Long, User> usersById = userRepository.findAllById(buildUserIds(review))
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Booking> bookingsById = bookingRepository.findAllById(Set.of(review.getBookingId()))
                .stream()
                .collect(Collectors.toMap(Booking::getId, Function.identity()));
        Map<Long, Car> carsById = carRepository.findAllById(Set.of(review.getCarId()))
                .stream()
                .collect(Collectors.toMap(Car::getId, Function.identity()));
        return mapToResponse(review, usersById, bookingsById, carsById);
    }

    private List<ReviewResponse> mapToResponses(List<Review> reviews) {
        if (reviews.isEmpty()) {
            return List.of();
        }

        Set<Long> userIds = reviews.stream()
                .flatMap(review -> buildUserIds(review).stream())
                .collect(Collectors.toSet());
        Set<Long> bookingIds = reviews.stream().map(Review::getBookingId).collect(Collectors.toSet());
        Set<Long> carIds = reviews.stream().map(Review::getCarId).collect(Collectors.toSet());

        Map<Long, User> usersById = userRepository.findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Booking> bookingsById = bookingRepository.findAllById(bookingIds)
                .stream()
                .collect(Collectors.toMap(Booking::getId, Function.identity()));
        Map<Long, Car> carsById = carRepository.findAllById(carIds)
                .stream()
                .collect(Collectors.toMap(Car::getId, Function.identity()));

        return reviews.stream()
                .map(review -> mapToResponse(review, usersById, bookingsById, carsById))
                .toList();
    }

    private Set<Long> buildUserIds(Review review) {
        if (review.getRepliedBy() == null) {
            return Set.of(review.getUserId());
        }
        return Set.of(review.getUserId(), review.getRepliedBy());
    }

    private ReviewResponse mapToResponse(
            Review review,
            Map<Long, User> usersById,
            Map<Long, Booking> bookingsById,
            Map<Long, Car> carsById
    ) {
        User customer = usersById.get(review.getUserId());
        User repliedBy = review.getRepliedBy() != null ? usersById.get(review.getRepliedBy()) : null;
        Booking booking = bookingsById.get(review.getBookingId());
        Car car = carsById.get(review.getCarId());

        return ReviewResponse.builder()
                .id(review.getId())
                .bookingId(review.getBookingId())
                .bookingCode(booking != null ? booking.getBookingCode() : null)
                .userId(review.getUserId())
                .customerName(customer != null ? customer.getFullName() : null)
                .customerEmail(customer != null ? customer.getEmail() : null)
                .vehicleId(review.getCarId())
                .vehicleName(car != null ? (car.getBrand() + " " + car.getModel()).trim() : null)
                .vehicleLicensePlate(car != null ? car.getLicensePlate() : null)
                .overallRating(review.getOverallRating())
                .vehicleRating(review.getVehicleRating())
                .serviceRating(review.getServiceRating())
                .comment(review.getComment())
                .isVisible(review.isVisible())
                .staffReply(review.getStaffReply())
                .repliedBy(review.getRepliedBy())
                .repliedByName(repliedBy != null ? repliedBy.getFullName() : null)
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    private PublicReviewResponse mapToPublicResponse(Review review, Map<Long, User> usersById) {
        User customer = usersById.get(review.getUserId());
        User repliedBy = review.getRepliedBy() != null ? usersById.get(review.getRepliedBy()) : null;

        return PublicReviewResponse.builder()
                .id(review.getId())
                .customerName(customer != null ? customer.getFullName() : null)
                .overallRating(review.getOverallRating())
                .vehicleRating(review.getVehicleRating())
                .serviceRating(review.getServiceRating())
                .comment(review.getComment())
                .staffReply(review.getStaffReply())
                .repliedByName(repliedBy != null ? repliedBy.getFullName() : null)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
