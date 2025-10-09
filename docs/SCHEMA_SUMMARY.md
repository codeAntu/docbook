# Database Schema Summary

This document summarizes the complete Drizzle ORM schemas for the healthcare booking system based## Key Differences from SQL Plan

1. **Naming Convention**: Using snake_case for table/column names (PostgreSQL convention)
2. **Triggers**: Not implemented in schema files (triggers would need to be added via migrations or database-level scripts)
3. **Database**: Schemas are for PostgreSQL (using `pgTable`) instead of SQL Server
4. **Auto-increment**: Using `serial` type instead of `IDENTITY(1,1)`
5. **Boolean**: Using PostgreSQL `boolean` type instead of SQL Server `BIT`
6. **Extended Schema**: Integrated with existing `doctors`, `users`, and `departments` tables
7. **User Reference**: Using `userId` (UUID FK) instead of `userName` (string) in bookings

---

## Demo Data Examples

### Healthcare Providers

```typescript
// Example data to seed
const providers = [
  {
    hpName: "City Hospital",
    hpType: "Hospital",
    address: "123 Main St",
    contactNumber: "555-1000",
    email: "cityhospital@demo.com",
  },
  {
    hpName: "Sunrise Clinic",
    hpType: "Clinic",
    address: "45 Sunrise Ave",
    contactNumber: "555-1001",
    email: "sunriseclinic@demo.com",
  },
];
```

### Doctors

```typescript
const doctors = [
  {
    doctorName: "Dr. Alice Smith",
    specialization: "Cardiologist",
    contactNumber: "999-2000",
    email: "alice@demo.com",
  },
  {
    doctorName: "Dr. Bob Johnson",
    specialization: "Pediatrician",
    contactNumber: "999-2001",
    email: "bob@demo.com",
  },
];
```

### Doctor Schedules (Edge Cases)

```typescript
const schedules = [
  // Daily schedules
  {
    hpName: "City Hospital",
    doctorName: "Dr. Alice Smith",
    scheduleType: "Daily",
    dayOfWeek: null,
    dayOfMonth: null,
    startTime: "09:00",
    endTime: "12:00",
    maxBookings: 5,
  },
  {
    hpName: "City Hospital",
    doctorName: "Dr. Alice Smith",
    scheduleType: "Daily",
    dayOfWeek: null,
    dayOfMonth: null,
    startTime: "13:00",
    endTime: "16:00",
    maxBookings: 3,
  },

  // Weekly schedules (Monday=1, Wednesday=3)
  {
    hpName: "City Hospital",
    doctorName: "Dr. Alice Smith",
    scheduleType: "Weekly",
    dayOfWeek: 1,
    dayOfMonth: null,
    startTime: "12:30",
    endTime: "14:30",
    maxBookings: 4,
  },
  {
    hpName: "City Hospital",
    doctorName: "Dr. Alice Smith",
    scheduleType: "Weekly",
    dayOfWeek: 3,
    dayOfMonth: null,
    startTime: "09:00",
    endTime: "12:00",
    maxBookings: 4,
  },

  // Monthly schedules (1st and 15th of month)
  {
    hpName: "City Hospital",
    doctorName: "Dr. Alice Smith",
    scheduleType: "Monthly",
    dayOfWeek: null,
    dayOfMonth: 1,
    startTime: "09:00",
    endTime: "11:00",
    maxBookings: 3,
  },
  {
    hpName: "City Hospital",
    doctorName: "Dr. Alice Smith",
    scheduleType: "Monthly",
    dayOfWeek: null,
    dayOfMonth: 15,
    startTime: "13:00",
    endTime: "16:00",
    maxBookings: 2,
  },

  // Multi-facility schedules
  {
    hpName: "Sunrise Clinic",
    doctorName: "Dr. Alice Smith",
    scheduleType: "Daily",
    dayOfWeek: null,
    dayOfMonth: null,
    startTime: "09:00",
    endTime: "12:00",
    maxBookings: 5,
  },
  {
    hpName: "Sunrise Clinic",
    doctorName: "Dr. Alice Smith",
    scheduleType: "Weekly",
    dayOfWeek: 1,
    dayOfMonth: null,
    startTime: "14:00",
    endTime: "17:00",
    maxBookings: 4,
  },

  // Different doctors
  {
    hpName: "City Hospital",
    doctorName: "Dr. Bob Johnson",
    scheduleType: "Weekly",
    dayOfWeek: 1,
    dayOfMonth: null,
    startTime: "09:00",
    endTime: "12:00",
    maxBookings: 2,
  },
  {
    hpName: "Sunrise Clinic",
    doctorName: "Dr. Bob Johnson",
    scheduleType: "Daily",
    dayOfWeek: null,
    dayOfMonth: null,
    startTime: "09:00",
    endTime: "12:00",
    maxBookings: 2,
  },
];
```

---

## Business Logic Requirements

### 1. Schedule Overlap Prevention

**Purpose**: Prevent doctors from having overlapping schedules at the same healthcare provider.

**Logic**:

- Check if doctor already has an active schedule at the same healthcare provider
- Compare time ranges: `newStartTime < existingEndTime AND newEndTime > existingStartTime`
- Consider schedule types:
  - **Daily**: Conflicts with ANY schedule (daily/weekly/monthly)
  - **Weekly**: Conflicts only if same day of week
  - **Monthly**: Conflicts only if same day of month

**Implementation** (Application Code):

```typescript
async function validateScheduleOverlap(
  doctorName: string,
  hpName: string,
  scheduleType: "Daily" | "Weekly" | "Monthly",
  startTime: string,
  endTime: string,
  dayOfWeek?: number,
  dayOfMonth?: number
) {
  const existingSchedules = await db
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.doctorName, doctorName),
        eq(doctorSchedules.hpName, hpName),
        eq(doctorSchedules.isActive, true)
      )
    );

  for (const existing of existingSchedules) {
    // Check time overlap
    if (startTime < existing.endTime && endTime > existing.startTime) {
      // Check schedule type conflicts
      if (
        scheduleType === "Daily" ||
        existing.scheduleType === "Daily" ||
        (scheduleType === "Weekly" &&
          existing.scheduleType === "Weekly" &&
          dayOfWeek === existing.dayOfWeek) ||
        (scheduleType === "Monthly" &&
          existing.scheduleType === "Monthly" &&
          dayOfMonth === existing.dayOfMonth)
      ) {
        throw new Error(
          "Schedule conflict: overlapping time exists for this doctor at this healthcare provider."
        );
      }
    }
  }
}
```

### 2. Max Bookings Enforcement

**Purpose**: Prevent overbooking by enforcing the `maxBookings` limit per schedule.

**Logic**:

- Count existing bookings for a specific schedule
- Compare with `maxBookings` limit
- Reject if limit reached

**Implementation** (Application Code):

```typescript
async function validateMaxBookings(scheduleId: number, bookingDate: Date) {
  const schedule = await db
    .select()
    .from(doctorSchedules)
    .where(eq(doctorSchedules.scheduleId, scheduleId))
    .limit(1);

  if (!schedule[0]) {
    throw new Error("Schedule not found.");
  }

  const currentBookings = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.scheduleId, scheduleId),
        eq(bookings.bookingForDate, bookingDate),
        eq(bookings.bookingStatus, "Booked")
      )
    );

  if (currentBookings[0].count >= schedule[0].maxBookings) {
    throw new Error("Cannot book: maximum bookings reached for this slot.");
  }
}
```

### 3. Schedule Type Interpretation

**Daily Schedules**:

- `dayOfWeek`: NULL
- `dayOfMonth`: NULL
- Applies every day

**Weekly Schedules**:

- `dayOfWeek`: 0-6 (Sunday=0, Monday=1, ..., Saturday=6)
- `dayOfMonth`: NULL
- Applies on specific day of the week

**Monthly Schedules**:

- `dayOfWeek`: NULL
- `dayOfMonth`: 1-31
- Applies on specific day of the month

---

## Common Queries

### Find Available Slots for a Date

```typescript
// Find all schedules that apply to a specific date
async function findAvailableSchedules(date: Date) {
  const dayOfWeek = date.getDay(); // 0-6
  const dayOfMonth = date.getDate(); // 1-31

  return await db
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.isActive, true),
        or(
          eq(doctorSchedules.scheduleType, "Daily"),
          and(
            eq(doctorSchedules.scheduleType, "Weekly"),
            eq(doctorSchedules.dayOfWeek, dayOfWeek)
          ),
          and(
            eq(doctorSchedules.scheduleType, "Monthly"),
            eq(doctorSchedules.dayOfMonth, dayOfMonth)
          )
        )
      )
    );
}
```

### Get Doctor's Schedule at a Healthcare Provider

```typescript
async function getDoctorScheduleAtProvider(doctorName: string, hpName: string) {
  return await db
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.doctorName, doctorName),
        eq(doctorSchedules.hpName, hpName),
        eq(doctorSchedules.isActive, true)
      )
    );
}
```

### Check Booking Availability

```typescript
async function checkAvailability(scheduleId: number, bookingDate: Date) {
  const [schedule] = await db
    .select({
      maxBookings: doctorSchedules.maxBookings,
      currentBookings: count(bookings.bookingId),
    })
    .from(doctorSchedules)
    .leftJoin(
      bookings,
      and(
        eq(bookings.scheduleId, doctorSchedules.scheduleId),
        eq(bookings.bookingForDate, bookingDate),
        eq(bookings.bookingStatus, "Booked")
      )
    )
    .where(eq(doctorSchedules.scheduleId, scheduleId))
    .groupBy(doctorSchedules.scheduleId);

  return {
    available: schedule.currentBookings < schedule.maxBookings,
    slotsRemaining: schedule.maxBookings - schedule.currentBookings,
  };
}
```

### Get User's Bookings

```typescript
async function getUserBookings(userId: string) {
  return await db
    .select({
      bookingId: bookings.bookingId,
      bookingDate: bookings.bookingForDate,
      status: bookings.bookingStatus,
      doctorName: doctorSchedules.doctorName,
      hpName: doctorSchedules.hpName,
      startTime: doctorSchedules.startTime,
      endTime: doctorSchedules.endTime,
    })
    .from(bookings)
    .innerJoin(
      doctorSchedules,
      eq(bookings.scheduleId, doctorSchedules.scheduleId)
    )
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.bookingForDate));
}
```

---

## Next Steps`.

## All Schema Files

### Existing Schemas (Updated)

#### 1. **doctor.ts** (Updated & Simplified)

- **Table**: `doctors`
- **Fields**:
  - `doctorName` (varchar 100) - Primary Key
  - `specialization` (varchar 256)
  - `contactNumber` (varchar 15)
  - `email` (varchar 256)
  - `createdAt` (timestamp)
- **Relations**:
  - Has many `doctorSchedules`

#### 2. **users.ts**

- **Table**: `users`
- **Fields**:
  - `id` (uuid) - Primary Key
  - `name` (varchar 256)
  - `phone` (varchar 15) - Unique
  - `email` (varchar 256) - Unique
  - `dateOfBirth` (varchar 10)
  - `profilePicture` (varchar 512)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
- **Relations**:
  - Has many `bookings`

#### 3. **department.ts**

- **Table**: `departments`
- **Fields**:
  - `id` (uuid) - Primary Key
  - `name` (varchar 256) - Unique
  - `description` (text)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
- **Relations**:
  - Has many `doctors`

### New Schemas (Created)

#### 4. **healthcareProvider.ts**

- **Table**: `healthcare_providers`
- **Fields**:
  - `hpName` (varchar 100) - Primary Key
  - `hpType` (varchar 50) - Type of healthcare provider
  - `address` (varchar 200)
  - `contactNumber` (varchar 15)
  - `email` (varchar 256)
  - `createdAt` (timestamp)
- **Relations**:
  - Has many `doctorSchedules`

#### 5. **doctorSchedule.ts** (Updated)

- **Table**: `doctor_schedules`
- **Fields**:
  - `scheduleId` (serial) - Primary Key
  - `hpName` (varchar 100) - Foreign Key → `healthcare_providers.hpName`
  - `doctorName` (varchar 100) - Foreign Key → `doctors.doctorName`
  - `scheduleType` (varchar 20) - 'Daily', 'Weekly', or 'Monthly'
  - `dayOfWeek` (integer) - 0=Sunday...6=Saturday (nullable)
  - `dayOfMonth` (integer) - 1-31 (nullable)
  - `startTime` (time)
  - `endTime` (time)
  - `maxBookings` (integer) - Default: 1
  - `isActive` (boolean) - Default: true
  - `createdAt` (timestamp)
- **Constraints**:
  - Check: `scheduleType` must be 'Daily', 'Weekly', or 'Monthly'
  - Check: `dayOfWeek` must be between 0 and 6
  - Check: `dayOfMonth` must be between 1 and 31
- **Relations**:
  - Belongs to one `healthcareProvider`
  - Belongs to one `doctor`

#### 6. **booking.ts** (Updated)

- **Table**: `bookings`
- **Fields**:
  - `bookingId` (serial) - Primary Key
  - `scheduleId` (integer) - Foreign Key → `doctor_schedules.scheduleId`
  - `userId` (uuid) - Foreign Key → `users.id`
  - `bookingForDate` (date)
  - `bookingStatus` (varchar 20) - Default: 'Booked'
  - `createdAt` (timestamp)
- **Relations**:
  - Belongs to one `doctorSchedule`
  - Belongs to one `user`

## Schema Relationships

```
doctors
  └── has many doctor_schedules
       └── belongs to healthcare_provider
       └── has many bookings
            └── belongs to users

healthcare_providers
  └── has many doctor_schedules

users
  └── has many bookings
```

**Note:** The `departments` table is still available but decoupled from the booking system for flexibility.

## Key Features

1. **Flexible Scheduling**: Supports Daily, Weekly, and Monthly schedule patterns
2. **Multi-facility Support**: Doctors can work at multiple healthcare providers
3. **Capacity Management**: `maxBookings` field controls appointment slots
4. **Active/Inactive Schedules**: `isActive` flag for schedule management
5. **Complete Audit Trail**: All tables include `createdAt` timestamps
6. **Referential Integrity**: Proper foreign key relationships throughout

## Key Differences from SQL Plan

1. **Naming Convention**: Using snake_case for table/column names (PostgreSQL convention)
2. **Triggers**: Not implemented in schema files (triggers would need to be added via migrations or database-level scripts)
3. **Database**: Schemas are for PostgreSQL (using `pgTable`) instead of SQL Server
4. **Auto-increment**: Using `serial` type instead of `IDENTITY(1,1)`
5. **Boolean**: Using PostgreSQL `boolean` type instead of SQL Server `BIT`
6. **Extended Schema**: Integrated with existing `doctors`, `users`, and `departments` tables

## Notes

- All schemas export their relations for Drizzle ORM query capabilities
- The schemas maintain referential integrity through foreign keys
- Constraints are implemented using Drizzle's `check()` utility
- All tables include `createdAt` timestamp for audit trails
- Existing schemas (`doctors`, `users`, `departments`) have been updated with new relations
