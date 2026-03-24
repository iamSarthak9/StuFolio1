import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const studentId = "c010c6e8-e641-4741-94ad-dad996e0858c";

async function main() {
    console.log(`🧹 Clearing records for student: ${studentId}`);

    try {
        const deletedRecords = await prisma.academicRecord.deleteMany({
            where: { studentId }
        });
        console.log(`✅ Deleted ${deletedRecords.count} academic records.`);

        const deletedCGPAs = await prisma.semesterCGPA.deleteMany({
            where: { studentId }
        });
        console.log(`✅ Deleted ${deletedCGPAs.count} semester CGPA records.`);

        await prisma.student.update({
            where: { id: studentId },
            data: { cgpa: 0 }
        });
        console.log(`✅ Reset student CGPA to 0.`);

    } catch (error) {
        console.error("❌ Error clearing records:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
