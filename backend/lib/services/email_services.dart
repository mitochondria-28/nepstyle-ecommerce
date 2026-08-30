import 'package:mailer/mailer.dart';
import 'package:mailer/smtp_server.dart';

class EmailService {
  // SMTP configuration for the email service (using Gmail in this case)
  final String smtpServer = 'smtp.gmail.com';
  final int smtpPort = 587;
  final String emailAddress =
      'nepstyle@gmail.com'; // Replace with your email
  final String emailPassword =
      'NepStyle@123'; // Replace with your email password (or app password)

  // Send OTP Email to the user
  Future<void> sendOtpEmail(String recipientEmail, String otpCode) async {
    try {
      // Set up the SMTP server
      final smtpServer = SmtpServer(
        this.smtpServer,
        username: emailAddress,
        password: emailPassword,
        port: smtpPort,
        ssl: false,
      );

      // Create the message
      final message = Message()
        ..from =
            Address(emailAddress, 'NepStyle') // Sender email and name
        ..recipients.add(recipientEmail) // Recipient email
        ..subject = 'Your OTP Code'
        ..text = 'Your OTP code is: $otpCode';

      // Send the email
      final sendReport = await send(message, smtpServer);
      print('Email sent: ${sendReport.toString()}');
    } catch (e) {
      print('Error sending OTP email: $e');
      rethrow; // Rethrow the error if you need to handle it in the calling code
    }
  }

  // Additional method to send welcome email or other types of emails
  Future<void> sendWelcomeEmail(String recipientEmail) async {
    try {
      final smtpServer = SmtpServer(
        this.smtpServer,
        username: emailAddress,
        password: emailPassword,
        port: smtpPort,
        ssl: false,
      );

      final message = Message()
        ..from = Address(emailAddress, 'Your App Name')
        ..recipients.add(recipientEmail)
        ..subject = 'Welcome to Your App'
        ..text = 'Thank you for registering with us. Welcome to our community!';

      final sendReport = await send(message, smtpServer);
      print('Welcome email sent: ${sendReport.toString()}');
    } catch (e) {
      print('Error sending welcome email: $e');
      rethrow;
    }
  }
}
