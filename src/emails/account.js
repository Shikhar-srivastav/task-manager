const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'shikharsr100@gmail.com',
        subject: 'Welcome to Task Manager',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app!`
    });
};

const sendPartingMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'shikharsr100@gmail.com',
        subject: 'Leaving Task Manager',
        text: `Goodbye, ${name}. Is there something we could've done to keep you onboard?`
    });
}

module.exports = {
    sendWelcomeMail,
    sendPartingMail
};