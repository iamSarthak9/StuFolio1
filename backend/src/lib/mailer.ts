import nodemailer from "nodemailer";

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendMail = async ({ to, subject, html }: SendMailOptions) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("EMAIL_USER or EMAIL_PASS not set. Emails will not be sent.");
            return;
        }

        const info = await transporter.sendMail({
            from: `"StuFolio Mentor System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        console.log("Message sent to %s: %s", to, info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
