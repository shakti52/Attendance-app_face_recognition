import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_credentials_email(to_email: str, full_name: str, id_number: str, password: str) -> bool:
    """Send login credentials to a newly created student."""
    subject = "Welcome to FaceAttend — Your Login Credentials"
    html_body = f"""
    <html><body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
      <div style="max-width:600px;margin:auto;background:white;border-radius:10px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color:#1a1a2e;">Welcome to <span style="color:#e94560;">FaceAttend</span></h2>
        <p>Hello <strong>{full_name}</strong>,</p>
        <p>Your account has been created. Use the credentials below to log in:</p>
        <table style="margin:20px 0;border-collapse:collapse;width:100%;">
          <tr>
            <td style="padding:10px;background:#f0f0f0;font-weight:bold;border-radius:4px 0 0 4px;">Email</td>
            <td style="padding:10px;background:#fafafa;border-radius:0 4px 4px 0;">{to_email}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#f0f0f0;font-weight:bold;border-radius:4px 0 0 4px;margin-top:4px;">ID Number</td>
            <td style="padding:10px;background:#fafafa;border-radius:0 4px 4px 0;">{id_number}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#f0f0f0;font-weight:bold;border-radius:4px 0 0 4px;margin-top:4px;">Password</td>
            <td style="padding:10px;background:#fafafa;border-radius:0 4px 4px 0;">{password}</td>
          </tr>
        </table>
        <p style="color:#888;font-size:13px;">⚠️ Please change your password after first login.</p>
        <p style="margin-top:30px;color:#aaa;font-size:12px;">This is an automated message from the FaceAttend system. Do not reply.</p>
      </div>
    </body></html>
    """
    return _send_email(to_email, subject, html_body)


def send_attendance_alert_email(to_email: str, full_name: str, subject_name: str, percentage: float) -> bool:
    """Warn student their attendance has dropped below 75%."""
    subject_line = f"⚠️ Low Attendance Alert — {subject_name}"
    html_body = f"""
    <html><body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
      <div style="max-width:600px;margin:auto;background:white;border-radius:10px;padding:30px;">
        <h2 style="color:#e94560;">Attendance Warning</h2>
        <p>Dear <strong>{full_name}</strong>,</p>
        <p>Your attendance in <strong>{subject_name}</strong> has dropped to
           <strong style="color:#e94560;">{percentage:.1f}%</strong>, which is below the required
           <strong>75%</strong> threshold.</p>
        <p>Please ensure you attend upcoming lectures to maintain eligibility for examinations.</p>
        <p style="margin-top:30px;color:#aaa;font-size:12px;">FaceAttend System</p>
      </div>
    </body></html>
    """
    return _send_email(to_email, subject_line, html_body)


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False
