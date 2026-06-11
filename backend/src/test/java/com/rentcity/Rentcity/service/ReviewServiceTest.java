package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.CreateReviewRequest;
import com.rentcity.Rentcity.dto.ReviewResponse;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import com.rentcity.Rentcity.repository.ReviewRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarRepository carRepository;

    private ReviewService reviewService;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewService(reviewRepository, bookingRepository, userRepository, carRepository);
    }

    @Test
    void createReviewSucceedsForCompletedBookingOwnedByCustomer() {
        User customer = customer();
        Booking booking = completedBooking(customer.getId());
        Car car = car();
        CreateReviewRequest request = new CreateReviewRequest(booking.getId(), car.getId(), 5, 4, 5, "  Great trip  ");

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(reviewRepository.existsByBookingId(booking.getId())).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> {
            Review review = invocation.getArgument(0);
            review.setId(50L);
            return review;
        });
        when(userRepository.findAllById(any())).thenReturn(List.of(customer));
        when(bookingRepository.findAllById(any())).thenReturn(List.of(booking));
        when(carRepository.findAllById(any())).thenReturn(List.of(car));

        ReviewResponse response = reviewService.createReview(customer.getEmail(), request);

        assertThat(response.getId()).isEqualTo(50L);
        assertThat(response.getBookingId()).isEqualTo(booking.getId());
        assertThat(response.getVehicleId()).isEqualTo(car.getId());
        assertThat(response.getComment()).isEqualTo("Great trip");
        assertThat(response.isVisible()).isTrue();

        ArgumentCaptor<Review> reviewCaptor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).save(reviewCaptor.capture());
        assertThat(reviewCaptor.getValue().getUserId()).isEqualTo(customer.getId());
    }

    @Test
    void createReviewRejectsBookingThatIsNotCompleted() {
        User customer = customer();
        Booking booking = completedBooking(customer.getId());
        booking.setStatus(BookingStatus.ONGOING);

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> reviewService.createReview(customer.getEmail(), requestFor(booking)))
                .isInstanceOf(IllegalArgumentException.class);

        verify(reviewRepository, never()).save(any());
    }

    @Test
    void createReviewHidesAnotherCustomersBooking() {
        User customer = customer();
        Booking booking = completedBooking(999L);

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> reviewService.createReview(customer.getEmail(), requestFor(booking)))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(reviewRepository, never()).save(any());
    }

    @Test
    void createReviewRejectsDuplicateBookingReview() {
        User customer = customer();
        Booking booking = completedBooking(customer.getId());

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(reviewRepository.existsByBookingId(booking.getId())).thenReturn(true);

        assertThatThrownBy(() -> reviewService.createReview(customer.getEmail(), requestFor(booking)))
                .isInstanceOf(IllegalArgumentException.class);

        verify(reviewRepository, never()).save(any());
    }

    @Test
    void publicCarReviewsReturnPaginationAndRatingSummary() {
        when(reviewRepository.findByCarIdAndIsVisibleTrueOrderByCreatedAtDesc(20L, PageRequest.of(0, 5)))
                .thenReturn(Page.empty(PageRequest.of(0, 5)));
        when(reviewRepository.averageVisibleOverallRatingByCarId(20L)).thenReturn(4.25);
        when(reviewRepository.countVisibleReviewsByRating(20L)).thenReturn(List.<Object[]>of(new Object[]{5, 3L}));

        var response = reviewService.getPublicCarReviews(20L, 0, 5);

        assertThat(response.getContent()).isEmpty();
        assertThat(response.getTotalElements()).isZero();
        assertThat(response.getAverageRating()).isEqualTo(4.3);
        assertThat(response.getRatingCounts()).containsEntry(5, 3L).containsEntry(1, 0L);
        verify(reviewRepository).findByCarIdAndIsVisibleTrueOrderByCreatedAtDesc(20L, PageRequest.of(0, 5));
        verify(reviewRepository, never()).findAllByOrderByCreatedAtDesc();
    }

    private CreateReviewRequest requestFor(Booking booking) {
        return new CreateReviewRequest(booking.getId(), booking.getCarId(), 5, 5, 5, "Good");
    }

    private User customer() {
        return User.builder()
                .id(1L)
                .email("customer@rentcity.test")
                .fullName("Customer")
                .password("password")
                .role(Role.CUSTOMER)
                .kycStatus(KycStatus.VERIFIED)
                .build();
    }

    private Booking completedBooking(Long userId) {
        return Booking.builder()
                .id(10L)
                .bookingCode("RC-10")
                .userId(userId)
                .carId(20L)
                .status(BookingStatus.COMPLETED)
                .build();
    }

    private Car car() {
        return Car.builder()
                .id(20L)
                .brand("Toyota")
                .model("Vios")
                .licensePlate("30A-123.45")
                .status(CarStatus.AVAILABLE)
                .build();
    }
}
