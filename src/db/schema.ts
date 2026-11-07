import { pgTable, text, varchar, timestamp, numeric, boolean, smallint, integer, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Businesses Table
export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  businessName: varchar("business_name", { length: 150 }).notNull(),
  category: varchar("category", { length: 50 }).notNull().default("kuliner"),
  subCategory: varchar("sub_category", { length: 100 }),
  description: text("description").notNull(),
  location: varchar("location", { length: 150 }).notNull().default("Sumatera Barat"),
  targetAudience: text("target_audience").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Products Table
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  advantages: text("advantages").notNull(),
  originalImageUrl: text("original_image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Brand Kits Table
export const brandKits = pgTable("brand_kits", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#2563EB").notNull(),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#F59E0B").notNull(),
  visualPreset: varchar("visual_preset", { length: 50 }).default("clean_modern").notNull(),
  toneOfVoice: varchar("tone_of_voice", { length: 50 }).default("ramah_santai").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Marketing Goals Table
export const marketingGoals = pgTable("marketing_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  goalType: varchar("goal_type", { length: 50 }).notNull(), // product_launch, brand_awareness, promo_diskon, edukasi_pelanggan
  targetProductId: uuid("target_product_id").references(() => products.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Content Plans Table (7 Days)
export const contentPlans = pgTable("content_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id").references(() => marketingGoals.id, { onDelete: "cascade" }).notNull(),
  dayNumber: smallint("day_number").notNull(), // 1 to 7
  scheduledDate: varchar("scheduled_date", { length: 20 }).notNull(),
  topic: varchar("topic", { length: 200 }).notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // product_spotlight, promo_offer, behind_the_scenes, tips_edukasi, social_proof
  description: text("description").notNull(),
  recommendedProductId: uuid("recommended_product_id").references(() => products.id),
  status: varchar("status", { length: 30 }).default("planned").notNull(), // planned, generated, published
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Marketing Contents Table
export const marketingContents = pgTable("marketing_contents", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id),
  contentPlanId: uuid("content_plan_id").references(() => contentPlans.id),
  originalImageUrl: text("original_image_url").notNull(),
  cutoutImageUrl: text("cutout_image_url"),
  finalImageUrl: text("final_image_url").notNull(),
  captionOption1: text("caption_option_1").notNull(),
  captionOption2: text("caption_option_2").notNull(),
  selectedCaption: text("selected_caption"),
  templateId: varchar("template_id", { length: 50 }).notNull().default("modern_card"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. Marketing Activities Table
export const marketingActivities = pgTable("marketing_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentId: uuid("content_id").references(() => marketingContents.id, { onDelete: "cascade" }).notNull().unique(),
  publicationStatus: varchar("publication_status", { length: 30 }).default("draft").notNull(), // draft, published
  publishedAt: timestamp("published_at", { withTimezone: true }),
  targetChannel: varchar("target_channel", { length: 50 }).default("instagram_feed"),
  inquiryCount: integer("inquiry_count").default(0).notNull(),
  orderCount: integer("order_count").default(0).notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Database Relations
export const usersRelations = relations(users, ({ one }) => ({
  business: one(businesses, {
    fields: [users.id],
    references: [businesses.userId],
  }),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, {
    fields: [businesses.userId],
    references: [users.id],
  }),
  products: many(products),
  brandKit: one(brandKits, {
    fields: [businesses.id],
    references: [brandKits.businessId],
  }),
  marketingGoals: many(marketingGoals),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  business: one(businesses, {
    fields: [products.businessId],
    references: [businesses.id],
  }),
  contents: many(marketingContents),
}));

export const marketingGoalsRelations = relations(marketingGoals, ({ one, many }) => ({
  business: one(businesses, {
    fields: [marketingGoals.businessId],
    references: [businesses.id],
  }),
  contentPlans: many(contentPlans),
}));

export const contentPlansRelations = relations(contentPlans, ({ one }) => ({
  goal: one(marketingGoals, {
    fields: [contentPlans.goalId],
    references: [marketingGoals.id],
  }),
  product: one(products, {
    fields: [contentPlans.recommendedProductId],
    references: [products.id],
  }),
}));

export const marketingContentsRelations = relations(marketingContents, ({ one }) => ({
  business: one(businesses, {
    fields: [marketingContents.businessId],
    references: [businesses.id],
  }),
  product: one(products, {
    fields: [marketingContents.productId],
    references: [products.id],
  }),
  contentPlan: one(contentPlans, {
    fields: [marketingContents.contentPlanId],
    references: [contentPlans.id],
  }),
  activity: one(marketingActivities, {
    fields: [marketingContents.id],
    references: [marketingActivities.contentId],
  }),
}));

