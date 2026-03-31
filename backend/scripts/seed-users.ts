import argon2 from "argon2";
import { SessionStatus } from "@prisma/client";
import { db } from "../src/lib/db.ts";

async function main() {
  const passwordHash = await argon2.hash("demo123");

  const mentor = await db.user.upsert({
    where: { email: "mentor@demo.com" },
    update: {
      name: "Alex Mentor",
      passwordHash,
      role: "MENTOR",
      bio: "Senior engineer focused on interview prep and pair programming.",
    },
    create: {
      email: "mentor@demo.com",
      name: "Alex Mentor",
      passwordHash,
      role: "MENTOR",
      bio: "Senior engineer focused on interview prep and pair programming.",
      defaultLanguage: "javascript",
    },
  });

  const student = await db.user.upsert({
    where: { email: "student@demo.com" },
    update: {
      name: "Sam Student",
      passwordHash,
      role: "STUDENT",
      bio: "Frontend learner practicing data structures and algorithms.",
    },
    create: {
      email: "student@demo.com",
      name: "Sam Student",
      passwordHash,
      role: "STUDENT",
      bio: "Frontend learner practicing data structures and algorithms.",
      defaultLanguage: "typescript",
    },
  });

  await db.session.upsert({
    where: { inviteCode: "DEVPAIR1" },
    update: {
      title: "Two Sum Practice",
      mentorId: mentor.id,
      studentId: student.id,
      status: SessionStatus.ACTIVE,
      language: "typescript",
      code: "// Start coding here...",
    },
    create: {
      title: "Two Sum Practice",
      mentorId: mentor.id,
      studentId: student.id,
      status: SessionStatus.ACTIVE,
      inviteCode: "DEVPAIR1",
      language: "typescript",
      code: "// Start coding here...",
    },
  });

  await db.session.upsert({
    where: { inviteCode: "DEVPAIR2" },
    update: {
      title: "Graph Algorithms",
      mentorId: mentor.id,
      studentId: null,
      status: SessionStatus.SCHEDULED,
      language: "python",
      code: "# Start coding here...",
    },
    create: {
      title: "Graph Algorithms",
      mentorId: mentor.id,
      studentId: null,
      status: SessionStatus.SCHEDULED,
      inviteCode: "DEVPAIR2",
      language: "python",
      code: "# Start coding here...",
    },
  });

  await db.session.upsert({
    where: { inviteCode: "DEVPAIR3" },
    update: {
      title: "Linked List Review",
      mentorId: mentor.id,
      studentId: student.id,
      status: SessionStatus.ENDED,
      inviteCode: "DEVPAIR3",
      language: "javascript",
      code: "// Session completed",
      endedAt: new Date(),
    },
    create: {
      title: "Linked List Review",
      mentorId: mentor.id,
      studentId: student.id,
      status: SessionStatus.ENDED,
      inviteCode: "DEVPAIR3",
      language: "javascript",
      code: "// Session completed",
      endedAt: new Date(),
    },
  });

  console.log("Demo users and sessions seeded.");
  console.log("Mentor login: mentor@demo.com / demo123");
  console.log("Student login: student@demo.com / demo123");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
