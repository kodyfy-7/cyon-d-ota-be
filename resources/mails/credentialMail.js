module.exports = (employeeName, username, password) => {
  return {
    body: {
      greeting: false,
      signature: false,
      intro: [
        `Dear ${employeeName},`,
        `Your account has been successfully created in the system.`,
        `Below are your login credentials:`,
        `Username: <strong>${username}</strong>`,
        `Temporary Password: <strong>${password}</strong>`,
        `Please use the button below to log in and change your password:`
      ],
      action: {
        instructions: 'Log in to your account to get started:',
        button: {
          color: '#22BC66', // Same green color as the approval email
          text: 'Log In',
          link: "https://flowwhiz.gamequiz.live"
        }
      },
      outro: [
        `For security, please change your password after logging in.`,
        `If you have any issues, contact the admin team.`,
        `<strong>Powered by the Workflow System</strong>`
      ]
    }
  };
};