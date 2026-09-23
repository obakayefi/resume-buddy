-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobUrl" TEXT NOT NULL DEFAULT '',
    "salary" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "jobDescription" TEXT NOT NULL,
    "extraInfo" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'saved',
    "atsScore" INTEGER NOT NULL DEFAULT 0,
    "optimizedResume" TEXT NOT NULL DEFAULT '',
    "coverLetter" TEXT NOT NULL DEFAULT '',
    "linkedinMessage" TEXT NOT NULL DEFAULT '',
    "recruiterName" TEXT NOT NULL DEFAULT '',
    "recruiterLinkedin" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "appliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "masterResumeId" TEXT NOT NULL,
    CONSTRAINT "Application_masterResumeId_fkey" FOREIGN KEY ("masterResumeId") REFERENCES "MasterResume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("appliedAt", "atsScore", "company", "coverLetter", "createdAt", "id", "jobDescription", "jobTitle", "jobUrl", "location", "masterResumeId", "notes", "optimizedResume", "salary", "status", "updatedAt") SELECT "appliedAt", "atsScore", "company", "coverLetter", "createdAt", "id", "jobDescription", "jobTitle", "jobUrl", "location", "masterResumeId", "notes", "optimizedResume", "salary", "status", "updatedAt" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE TABLE "new_MasterResume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "linkedin" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "skills" TEXT NOT NULL DEFAULT '[]',
    "skillGroups" TEXT NOT NULL DEFAULT '[]',
    "experience" TEXT NOT NULL DEFAULT '[]',
    "education" TEXT NOT NULL DEFAULT '[]',
    "projects" TEXT NOT NULL DEFAULT '[]',
    "certifications" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MasterResume" ("createdAt", "education", "email", "experience", "id", "isActive", "linkedin", "location", "name", "phone", "skills", "summary", "title", "updatedAt", "website") SELECT "createdAt", "education", "email", "experience", "id", "isActive", "linkedin", "location", "name", "phone", "skills", "summary", "title", "updatedAt", "website" FROM "MasterResume";
DROP TABLE "MasterResume";
ALTER TABLE "new_MasterResume" RENAME TO "MasterResume";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
