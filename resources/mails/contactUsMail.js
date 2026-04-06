module.exports = ({ name, email, phoneNumber, subject, message, submittedAt }) => {
    return {
        body: {
            greeting: false,
            signature: false,
            intro: [
                "A new Contact Us message was received.",
                `Submitted at: <strong>${submittedAt}</strong>`
            ],
            table: {
                data: [
                    {
                        Name: name,
                        Email: email,
                        "Phone Number": phoneNumber || "-",
                        Subject: subject,
                        Message: message
                    }
                ],
                columns: {
                    customWidth: {
                        Name: "18%",
                        Email: "22%",
                        "Phone Number": "15%",
                        Subject: "20%",
                        Message: "25%"
                    }
                }
            }
        }
    };
};