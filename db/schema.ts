import {integer,sqliteTable,text} from "drizzle-orm/sqlite-core";

export const songs=sqliteTable("songs",{
  id:text("id").primaryKey(),
  userId:text("user_id").notNull(),
  title:text("title").notNull(),
  prompt:text("prompt").notNull(),
  mode:text("mode").notNull(),
  duration:integer("duration").notNull(),
  storageKey:text("storage_key").notNull(),
  createdAt:integer("created_at").notNull(),
});

export const memberships=sqliteTable("memberships",{
  userId:text("user_id").primaryKey(),
  plan:text("plan").notNull().default("Explore"),
  status:text("status").notNull().default("active"),
  updatedAt:integer("updated_at").notNull(),
});
