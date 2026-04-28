import logging
from app.config import get_settings

logger = logging.getLogger(__name__)


def send_not_selected_email(to_email: str, job_post_title: str) -> bool:
    """Send automatic email to non-selected applicant. Returns True if sent."""
    settings = get_settings()

    message_body = (
        f"Hola, gracias por postular a '{job_post_title}' en Parche. "
        "El owner ya seleccionó a otro postulante para esta vacante. "
        "Te invitamos a revisar nuevas publicaciones disponibles."
    )

    if settings.EMAIL_PROVIDER == "stub":
        logger.info(
            "[EMAIL STUB] To: %s | Subject: No fuiste seleccionado | Body: %s",
            to_email,
            message_body,
        )
        return False

    if settings.EMAIL_PROVIDER == "sendgrid":
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            mail = Mail(
                from_email=settings.FROM_EMAIL,
                to_emails=to_email,
                subject="Resultado de tu postulación en Parche",
                plain_text_content=message_body,
            )
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            sg.send(mail)
            logger.info("Email sent to %s via SendGrid", to_email)
            return True
        except Exception as e:
            logger.error("SendGrid error: %s", e)
            return False

    logger.warning("Unknown EMAIL_PROVIDER: %s", settings.EMAIL_PROVIDER)
    return False
