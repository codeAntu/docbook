# 📚 Documentation

This folder contains all project documentation for the healthcare booking system.

## 📁 Documentation Files

### 📘 [SCHEMA_SUMMARY.md](./SCHEMA_SUMMARY.md)

**Complete Database Schema Reference**

Comprehensive guide covering:

- ✅ All database tables and their fields
- ✅ Relationships and foreign keys
- ✅ Demo data examples
- ✅ Business logic requirements (overlap prevention, max bookings)
- ✅ Common query patterns with code examples
- ✅ Migration instructions

**Use this file for:**

- Understanding the database structure
- Writing queries
- Implementing business logic
- Setting up the database

---

### 📗 [plan.md](./plan.md)

**Original SQL Database Plan**

The original SQL Server schema design including:

- ✅ Table creation scripts (SQL Server syntax)
- ✅ Demo data inserts
- ✅ Trigger implementations
- ✅ Constraints and checks

**Use this file for:**

- Understanding the original design intent
- SQL Server reference
- Trigger logic reference

---

## 🚀 Quick Start

1. **Read**: Start with [SCHEMA_SUMMARY.md](./SCHEMA_SUMMARY.md) to understand the schema
2. **Generate**: Run `bun run db:generate` to create migrations
3. **Migrate**: Run `bun run db:migrate` to apply to database
4. **Implement**: Use the business logic examples for schedule validation

## 📊 Database Overview

```
┌─────────────────────┐
│  doctors            │
│  [doctorName PK]    │
└──────────┬──────────┘
           │
           │ has many
           ▼
┌──────────────────────┐       ┌──────────────────────┐
│ doctor_schedules     │◄──────│ healthcare_providers │
│ [scheduleId PK]      │       │ [hpName PK]          │
└──────────┬───────────┘       └──────────────────────┘
           │
           │ has many
           ▼
    ┌─────────────┐
    │  bookings   │
    │[bookingId PK]│
    └──────┬──────┘
           │
           │ belongs to
           ▼
    ┌─────────────┐
    │    users    │
    │   [id PK]   │
    └─────────────┘
```

## 🔑 Key Concepts

### Schedule Types

- **Daily**: Applies every day
- **Weekly**: Applies on specific day of week (0=Sunday, 1=Monday, etc.)
- **Monthly**: Applies on specific day of month (1-31)

### Business Rules

1. **No Schedule Overlaps**: Doctors can't have overlapping schedules at the same facility
2. **Max Bookings**: Each schedule has a capacity limit
3. **Active Schedules**: Only active schedules are considered for bookings

## 🛠️ Tech Stack

- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Runtime**: Bun/Node.js
- **Language**: TypeScript

## 📝 Contributing

When updating schemas:

1. Update the schema files in `src/db/schema/`
2. Document changes in this folder
3. Update `SCHEMA_SUMMARY.md` with new examples
4. Generate and test migrations

## 🔗 Related Files

- Schema files: `src/db/schema/`
- Database config: `drizzle.config.ts`
- Main README: `../README.md`
