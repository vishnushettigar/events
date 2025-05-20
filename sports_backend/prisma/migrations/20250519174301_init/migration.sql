-- CreateTable
CREATE TABLE "Champion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "temple_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "host_temple_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL,
    CONSTRAINT "Champion_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Mst_temple" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Champion_host_temple_id_fkey" FOREIGN KEY ("host_temple_id") REFERENCES "Mst_temple" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ind_event_registration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "event_result_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Ind_event_registration_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Mst_event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ind_event_registration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ind_event_registration_event_result_id_fkey" FOREIGN KEY ("event_result_id") REFERENCES "Mst_event_result" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mst_age_category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "from_age" INTEGER NOT NULL,
    "to_age" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Mst_event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "event_type_id" INTEGER NOT NULL,
    "age_category_id" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Mst_event_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "Mst_event_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mst_event_age_category_id_fkey" FOREIGN KEY ("age_category_id") REFERENCES "Mst_age_category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mst_event_result" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event_type_id" INTEGER NOT NULL,
    "rank" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    CONSTRAINT "Mst_event_result_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "Mst_event_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mst_event_type" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "participant_count" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "Mst_role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Mst_temple" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "aadhar_number" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "temple_id" INTEGER,
    "dob" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Profile_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Mst_temple" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Profile_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Mst_role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Team_event_registration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "temple_id" INTEGER NOT NULL,
    "event_result_id" INTEGER,
    "member_user_ids" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "event_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Team_event_registration_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Mst_temple" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Team_event_registration_event_result_id_fkey" FOREIGN KEY ("event_result_id") REFERENCES "Mst_event_result" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Team_event_registration_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Mst_event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User_role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    CONSTRAINT "User_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Mst_role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Audit_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" INTEGER,
    "old_value" TEXT,
    "new_value" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Mst_event_type_name_key" ON "Mst_event_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Mst_role_name_key" ON "Mst_role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Mst_temple_code_key" ON "Mst_temple"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_user_id_key" ON "Profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_aadhar_number_key" ON "Profile"("aadhar_number");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_name_key" ON "Settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
