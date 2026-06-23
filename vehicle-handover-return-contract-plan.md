# Simple Vehicle Handover and Return Contract Plan

## 1. Goal

Create one simple rental contract for each booking.

The contract records:

- customer and vehicle information;
- rental dates and price;
- rental rules and policy;
- vehicle condition when handed over;
- vehicle condition when returned;
- customer and staff signatures for both events; and
- a downloadable PDF copy.

This feature should reuse the existing booking, condition report, damage, payment, and return code.

## 2. Simple Workflow

### Hand over the vehicle

1. Staff opens a `CONFIRMED` booking.
2. Staff completes a handover form:
   - handover time;
   - odometer;
   - fuel level;
   - vehicle condition;
   - existing damage and notes;
   - vehicle photos;
   - number of keys and included accessories.
3. The screen shows the booking information and rental policy.
4. The customer draws their signature.
5. The staff member draws their signature.
6. Staff submits the form.
7. The system saves the contract and changes the booking to `ONGOING`.

### Return the vehicle

1. Staff opens an `ONGOING` booking.
2. Staff completes the existing return form:
   - actual return time;
   - odometer;
   - fuel level;
   - returned keys and accessories;
   - vehicle condition;
   - damage, notes, and photos.
3. The system shows any late fee and estimated damage fee.
4. The customer and staff sign the return section.
5. Staff submits the form.
6. The existing return logic calculates fees, updates the vehicle, and changes the booking to `COMPLETED`.
7. The system creates the final contract PDF.

For the MVP, both people sign in person on the staff device. Customer login, QR signing, OTP, disputes, and advanced digital-signature verification can be added later if needed.

## 3. Contract Information

Keep the contract short and readable.

### Booking information

- contract number and booking code;
- customer name, phone, and email;
- vehicle name and license plate;
- rental start and end time;
- rental price, deposit, and total amount;
- pickup and return branch.

### Basic rental policy

- only approved drivers may drive the vehicle;
- no illegal use, racing, drunk driving, or sub-renting;
- customer must report accidents, damage, theft, or breakdown immediately;
- customer is responsible for traffic fines during the rental;
- vehicle must be returned on time with the agreed fuel level;
- late return, missing fuel, cleaning, lost accessories, and damage may create extra fees;
- smoking and other prohibited uses, if required by RentCity;
- deposit, cancellation, refund, and damage-payment rules;
- customer agrees that the recorded condition and photos are correct.

Store a copy of the policy text in the contract so old contracts do not change when the policy is updated later.

## 4. Simple Database Design

Add only one new table: `rental_contracts`.

Suggested fields:

```text
id
booking_id                     unique
contract_number                unique
policy_version
policy_text

handover_condition_report_id
handover_customer_signature
handover_customer_signed_at
handover_staff_signature
handover_staff_user_id
handover_staff_signed_at

return_condition_report_id
return_customer_signature
return_customer_signed_at
return_staff_signature
return_staff_user_id
return_staff_signed_at

status                         HANDOVER_DRAFT, ACTIVE, RETURN_DRAFT, COMPLETED
created_at
updated_at
```

The signature fields can store private image paths. Do not store large Base64 images directly in the database.

Also make one small change to the existing condition reports:

- add `HANDOVER` to `CarConditionReportType`;
- connect the handover report to the booking;
- continue using the existing `RETURN` report for return condition.

No policy table, signature table, audit table, revision system, or new booking statuses are needed for the MVP.

## 5. Backend Changes

### New classes

- `RentalContract` entity
- `RentalContractRepository`
- `RentalContractService`
- request and response DTOs
- `RentalContractController`

### Suggested endpoints

```text
GET  /bookings/{bookingId}/contract
POST /admin/bookings/{bookingId}/handover
POST /admin/bookings/{bookingId}/return
GET  /bookings/{bookingId}/contract/pdf
```

The customer can read/download only their own contract. Admin and staff can access contracts through their existing roles.

### Handover service

The handover endpoint should:

1. verify that the booking is `CONFIRMED`;
2. verify required payment is complete;
3. require condition details, photos, and both signatures;
4. create the `HANDOVER` condition report;
5. save the contract;
6. move the booking to `ONGOING`;
7. return the updated contract and booking.

Update the current check-in/payment flow so payment alone does not change the booking to `ONGOING`. The signed handover should be the action that starts the rental.

### Return service

Refactor the existing `completeReturnInspection(...)` method instead of replacing its business logic.

The new return endpoint should:

1. verify that the booking is `ONGOING`;
2. require return condition, photos, and both signatures;
3. call the existing overdue-fee and damage logic;
4. save the return condition ID and signatures in the contract;
5. update the vehicle to `AVAILABLE` or `MAINTENANCE`;
6. move the booking to `COMPLETED`;
7. generate the final PDF.

All of these operations should run inside one database transaction to avoid a half-completed return.

## 6. Frontend Changes

### Staff/Admin booking page

Add two actions to the existing `AdminBookings` page:

- `Hand over vehicle` for `CONFIRMED` bookings;
- `Return vehicle` for `ONGOING` bookings.

Create two modals or pages:

- `HandoverContractModal`
- extend the existing `ReturnConditionModal`

Both should show:

- booking/customer/vehicle summary;
- condition fields and photo upload;
- short rental policy;
- customer signature pad;
- staff signature pad;
- final confirmation button.

A small React canvas signature component is enough. It should support draw, clear, and validation that it is not empty.

### Customer booking page

Add a `Rental contract` section to the existing booking details page.

The customer can:

- view handover information after pickup;
- view return information after return;
- see both signatures and signing times;
- download the PDF.

The customer does not need a separate signing page in the MVP because signing happens in person on the staff device.

## 7. PDF

Extend the existing PDFBox implementation instead of introducing another PDF library.

The final PDF should contain:

1. booking, customer, and vehicle information;
2. price and deposit information;
3. rental policy;
4. handover condition, photos, and signatures;
5. return condition, photos, fees, and signatures.

Use an embedded Unicode font so Vietnamese text renders correctly.

Generate the final PDF when the return is completed. A handover-only PDF can also be generated while the booking is ongoing.

## 8. Validation and Security

Keep the essential protections:

- only admin/staff can submit handover and return forms;
- customer can view only their own contract;
- both signature images are required;
- handover requires a `CONFIRMED` booking;
- return requires an `ONGOING` booking;
- return odometer cannot be lower than handover odometer;
- fuel level must be between 0 and 100;
- at least one condition photo is required for each event;
- signature and contract files must not be publicly accessible without authorization;
- repeated submission must not create duplicate fees or status changes.

## 9. Implementation Order

### Step 1 — Database and backend model

- add the `rental_contracts` migration;
- add `HANDOVER` condition report type;
- create entity, repository, DTOs, and service.

### Step 2 — Handover

- build the handover endpoint;
- stop payment/check-in from automatically starting the rental;
- build the staff handover modal with photo and signature inputs;
- transition to `ONGOING` after successful submission.

### Step 3 — Return

- add signatures and policy summary to the existing return modal;
- refactor the existing return method to save the contract;
- keep existing fee, damage, wallet, vehicle-status, and completion behavior.

### Step 4 — Customer view and PDF

- show the contract on the booking details page;
- generate handover and final PDFs;
- add authorized PDF download.

### Step 5 — Tests

- handover succeeds only with valid condition, photos, and two signatures;
- handover changes `CONFIRMED -> ONGOING` once;
- return changes `ONGOING -> COMPLETED` once;
- fees and damage behavior still work;
- customer cannot read another customer's contract;
- PDF contains the correct contract data.

## 10. MVP Definition of Done

The feature is complete when:

- staff can record vehicle handover with photos and two signatures;
- the signed handover starts the rental;
- staff can record vehicle return with photos, fees, and two signatures;
- the signed return completes the rental;
- customer and staff can view the saved contract;
- customer can download the contract PDF;
- the existing payment, overdue, damage, and vehicle-status behavior still works.

Advanced features such as OTP signatures, QR signing, policy-management screens, contract revisions, disputes, refusal handling, and detailed audit logs should be added only when the business actually needs them.
