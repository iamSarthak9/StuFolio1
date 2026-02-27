import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Starting enrollment update...");
    const students = await prisma.student.findMany({ include: { user: true } });
    let updated = 0;

    for (const student of students) {
        const email = student.user.email;
        if (!email) continue;

        const emailUsername = email.split('@')[0].toLowerCase();
        const emailMatch = emailUsername.match(/^(.+?)(\d+)([a-z]{2,4})(\d{2})$/);

        if (emailMatch) {
            const [, , rollDigits, , yearDigits] = emailMatch;
            const startYear = parseInt("20" + yearDigits, 10);
            const rollNumber = parseInt(rollDigits, 10).toString();
            const paddedRoll = rollNumber.padStart(3, '0');
            const finalEnrollment = paddedRoll + "208027" + startYear.toString().slice(-2);

            if (student.enrollment !== finalEnrollment) {
                console.log("Updating " + email + ": " + student.enrollment + " -> " + finalEnrollment);
                await prisma.student.update({
                    where: { id: student.id },
                    data: { enrollment: finalEnrollment }
                });
                updated++;
            }
        }
    }
    console.log("Finished updating " + updated + " records.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
