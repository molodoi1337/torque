// Перечисления без зависимостей от ORM — их можно импортировать и в клиентских компонентах
export const ROLES = ["client", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ["new", "confirmed", "in_progress", "ready", "done", "cancelled"] as const;
export type Status = (typeof STATUSES)[number];

export const CATEGORIES = ["maintenance", "diagnostics", "repair", "suspension", "tires", "electrical"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CAR_CLASSES = ["A", "B", "C"] as const;
export type CarClass = (typeof CAR_CLASSES)[number];
