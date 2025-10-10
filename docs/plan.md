# Database Schema & Demo Data

## 0️⃣ Drop tables if they exist

```sql
IF OBJECT_ID('Bookings', 'U') IS NOT NULL DROP TABLE Bookings;
IF OBJECT_ID('DoctorSchedules', 'U') IS NOT NULL DROP TABLE DoctorSchedules;
IF OBJECT_ID('Doctors', 'U') IS NOT NULL DROP TABLE Doctors;
IF OBJECT_ID('HealthcareProviders', 'U') IS NOT NULL DROP TABLE HealthcareProviders;
```

---

## 1️⃣ Create tables

### HealthcareProviders

```sql
CREATE TABLE HealthcareProviders (
    HPName NVARCHAR(100) PRIMARY KEY,
    HPType NVARCHAR(50),
    Address NVARCHAR(200),
    ContactNumber NVARCHAR(20),
    Email NVARCHAR(100),
    CreatedDate DATETIME DEFAULT GETDATE()
);
```

### Doctors

```sql
CREATE TABLE Doctors (
    DoctorName NVARCHAR(100) PRIMARY KEY,
    Specialization NVARCHAR(100),
    ContactNumber NVARCHAR(20),
    Email NVARCHAR(100),
    CreatedDate DATETIME DEFAULT GETDATE()
);
```

### DoctorSchedules

```sql
CREATE TABLE DoctorSchedules (
    ScheduleID INT PRIMARY KEY IDENTITY(1,1),
    HPName NVARCHAR(100) NOT NULL,
    DoctorName NVARCHAR(100) NOT NULL,
    ScheduleType NVARCHAR(20) NOT NULL, -- 'Daily','Weekly','Monthly'
    DayOfWeek INT NULL,                 -- 0=Sun...6=Sat
    DayOfMonth INT NULL,                -- 1-31
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    MaxBookings INT NOT NULL DEFAULT 1,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (HPName) REFERENCES HealthcareProviders(HPName),
    FOREIGN KEY (DoctorName) REFERENCES Doctors(DoctorName),
    CONSTRAINT CHK_ScheduleType CHECK (ScheduleType IN ('Daily','Weekly','Monthly')),
    CONSTRAINT CHK_DayOfWeek CHECK (DayOfWeek BETWEEN 0 AND 6),
    CONSTRAINT CHK_DayOfMonth CHECK (DayOfMonth BETWEEN 1 AND 31)
);
```

### Bookings

```sql
CREATE TABLE Bookings (
    BookingID INT PRIMARY KEY IDENTITY(1,1),
    ScheduleID INT NOT NULL,
    UserName NVARCHAR(100) NOT NULL,
    BookingForDate DATE NOT NULL,
    BookingStatus NVARCHAR(20) DEFAULT 'Booked',
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ScheduleID) REFERENCES DoctorSchedules(ScheduleID)
);
```

---

## 2️⃣ Insert demo data

### Healthcare Providers

```sql
INSERT INTO HealthcareProviders (HPName, HPType, Address, ContactNumber, Email)
VALUES
('City Hospital','Hospital','123 Main St','555-1000','cityhospital@demo.com'),
('Sunrise Clinic','Clinic','45 Sunrise Ave','555-1001','sunriseclinic@demo.com');
```

### Doctors

```sql
INSERT INTO Doctors (DoctorName, Specialization, ContactNumber, Email)
VALUES
('Dr. Alice Smith','Cardiologist','999-2000','alice@demo.com'),
('Dr. Bob Johnson','Pediatrician','999-2001','bob@demo.com');
```

### DoctorSchedules (Edge Cases)

```sql
INSERT INTO DoctorSchedules (HPName, DoctorName, ScheduleType, DayOfWeek, DayOfMonth, StartTime, EndTime, MaxBookings)
VALUES
('City Hospital','Dr. Alice Smith','Daily',NULL,NULL,'09:00','12:00',5),
('City Hospital','Dr. Alice Smith','Daily',NULL,NULL,'13:00','16:00',3),
('City Hospital','Dr. Alice Smith','Weekly',1,NULL,'12:30','14:30',4),
('City Hospital','Dr. Alice Smith','Weekly',3,NULL,'09:00','12:00',4),
('City Hospital','Dr. Alice Smith','Monthly',NULL,1,'09:00','11:00',3),
('City Hospital','Dr. Alice Smith','Monthly',NULL,15,'13:00','16:00',2),
('Sunrise Clinic','Dr. Alice Smith','Daily',NULL,NULL,'09:00','12:00',5),
('Sunrise Clinic','Dr. Alice Smith','Weekly',1,NULL,'14:00','17:00',4),
('City Hospital','Dr. Bob Johnson','Weekly',1,NULL,'09:00','12:00',2),
('Sunrise Clinic','Dr. Bob Johnson','Daily',NULL,NULL,'09:00','12:00',2);
```

### Bookings

```sql
INSERT INTO Bookings (ScheduleID, UserName, BookingForDate)
VALUES
(1,'John Doe','2025-10-13'),
(2,'Jane Smith','2025-10-13'),
(3,'Mike Brown','2025-10-13'),
(1,'Grace Wu','2025-10-14'),
(4,'Alice Lee','2025-10-13'),
(5,'Bob Green','2025-10-15'),
(7,'Carol King','2025-10-01'),
(8,'David Park','2025-10-15'),
(9,'Emma Stone','2025-10-13'),
(10,'Frank Liu','2025-10-13');
```

---

## 3️⃣ Trigger: Prevent overlapping schedules

```sql
CREATE TRIGGER TR_PreventScheduleOverlap
ON DoctorSchedules
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM DoctorSchedules ds
        JOIN inserted i
          ON ds.DoctorName = i.DoctorName
         AND ds.HPName = i.HPName
         AND ds.IsActive = 1
         AND ds.StartTime < i.EndTime
         AND ds.EndTime > i.StartTime
         AND (
                ds.ScheduleType='Daily' OR i.ScheduleType='Daily'
             OR (ds.ScheduleType='Weekly' AND i.ScheduleType='Weekly' AND ds.DayOfWeek = i.DayOfWeek)
             OR (ds.ScheduleType='Monthly' AND i.ScheduleType='Monthly' AND ds.DayOfMonth = i.DayOfMonth)
             )
    )
    BEGIN
        RAISERROR('Schedule conflict: overlapping time exists for this doctor at this HP.',16,1);
        ROLLBACK;
        RETURN;
    END

    INSERT INTO DoctorSchedules (HPName, DoctorName, ScheduleType, DayOfWeek, DayOfMonth, StartTime, EndTime, MaxBookings, IsActive)
    SELECT HPName, DoctorName, ScheduleType, DayOfWeek, DayOfMonth, StartTime, EndTime, MaxBookings, IsActive
    FROM inserted;
END
```

---

## 4️⃣ Trigger: Enforce MaxBookings in Bookings

```sql
CREATE TRIGGER TR_CheckMaxBookings
ON Bookings
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ScheduleID INT;
    SELECT @ScheduleID = ScheduleID FROM inserted;

    DECLARE @CurrentCount INT;
    SELECT @CurrentCount = COUNT(*)
    FROM Bookings
    WHERE ScheduleID = @ScheduleID;

    DECLARE @MaxAllowed INT;
    SELECT @MaxAllowed = MaxBookings
    FROM DoctorSchedules
    WHERE ScheduleID = @ScheduleID;

    IF @CurrentCount >= @MaxAllowed
    BEGIN
        RAISERROR('Cannot book: maximum bookings reached for this slot.',16,1);
        ROLLBACK;
        RETURN;
    END

    INSERT INTO Bookings (ScheduleID, UserName, BookingForDate)
    SELECT ScheduleID, UserName, BookingForDate
    FROM inserted;
END
```
