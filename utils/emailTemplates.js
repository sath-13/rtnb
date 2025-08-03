export const getResetPasswordTemplate = (fname, lname, email, resetUrl, workspaceName) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f9;
              margin: 0;
              padding: 0;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
              border-radius: 8px;
            }
            h1 {
              color: #333333;
            }
            p {
              color: #555555;
              line-height: 1.5;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              margin: 20px 0;
              color: #ffffff;
              background-color: #4CAF50;
              text-decoration: none;
              border-radius: 5px;
            }
            .footer {
              font-size: 12px;
              color: #777777;
              text-align: center;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Reteam, ${fname} ${lname}</h1>
            <p>Your registered email is: <strong>${email}</strong></p>
            <p>Your workspace name is: <strong>${workspaceName}</strong></p>
            <p>An account has been created for you on Reteam. To set your password and activate your account, please click the button below:</p>
            <a href="${resetUrl}" class="button">Set Your Password</a>
            <p>This link will expire in 15 minutes.</p>
            <p>Best regards,<br>Reteam</p>
            <div class="footer">
              <p>&copy; 2025 Reteam. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };
  