import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_email(to_email: str, subject: str, body: str) -> None:
    if not settings.smtp_username or not settings.smtp_password or not settings.from_email:
        raise ValueError("SMTP credentials are not configured")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.from_email
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)
