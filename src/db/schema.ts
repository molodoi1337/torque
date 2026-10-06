import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

import { ROLES, STATUSES, CATEGORIES, CAR_CLASSES } from "./enums";
export * from "./enums";

const createdAt = () =>
  // Москва (UTC+3, без перехода на летнее время) — как и остальные даты в базе
  text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%S', 'now', '+3 hours'))`);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ROLES }).notNull().default("client"),
  createdAt: createdAt(),
});

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category", { enum: CATEGORIES }).notNull(),
  description: text("description").notNull().default(""),
  basePrice: integer("base_price").notNull(),
  durationMin: integer("duration_min").notNull(),
  popular: integer("popular", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const masters = sqliteTable("masters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
  experience: integer("experience").notNull().default(1),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const bays = sqliteTable("bays", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export const bookings = sqliteTable(
  "bookings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull().unique(),
    userId: integer("user_id").references(() => users.id),
    clientName: text("client_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    carMake: text("car_make").notNull(),
    carModel: text("car_model").notNull(),
    carYear: integer("car_year"),
    carClass: text("car_class", { enum: CAR_CLASSES }).notNull(),
    plate: text("plate"),
    // Время мастерской без часового пояса: "YYYY-MM-DDTHH:mm"
    startsAt: text("starts_at").notNull(),
    durationMin: integer("duration_min").notNull(),
    bayId: integer("bay_id").notNull().references(() => bays.id),
    masterId: integer("master_id").references(() => masters.id),
    status: text("status", { enum: STATUSES }).notNull().default("new"),
    totalPrice: integer("total_price").notNull(),
    comment: text("comment"),
    adminNote: text("admin_note"),
    createdAt: createdAt(),
  },
  (t) => [index("bookings_starts_idx").on(t.startsAt), index("bookings_phone_idx").on(t.phone)],
);

export const bookingServices = sqliteTable(
  "booking_services",
  {
    bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    serviceId: integer("service_id").notNull().references(() => services.id),
    price: integer("price").notNull(),
  },
  (t) => [primaryKey({ columns: [t.bookingId, t.serviceId] })],
);

export const statusEvents = sqliteTable("status_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  status: text("status", { enum: STATUSES }).notNull(),
  note: text("note"),
  createdAt: createdAt(),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  author: text("author").notNull(),
  car: text("car").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  createdAt: createdAt(),
});

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  bay: one(bays, { fields: [bookings.bayId], references: [bays.id] }),
  master: one(masters, { fields: [bookings.masterId], references: [masters.id] }),
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  items: many(bookingServices),
  events: many(statusEvents),
}));

export const bookingServicesRelations = relations(bookingServices, ({ one }) => ({
  booking: one(bookings, { fields: [bookingServices.bookingId], references: [bookings.id] }),
  service: one(services, { fields: [bookingServices.serviceId], references: [services.id] }),
}));

export const statusEventsRelations = relations(statusEvents, ({ one }) => ({
  booking: one(bookings, { fields: [statusEvents.bookingId], references: [bookings.id] }),
}));

export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Master = typeof masters.$inferSelect;
export type Bay = typeof bays.$inferSelect;
