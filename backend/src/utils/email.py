import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.config.settings import settings

_HEADER = """
<div style="background:#4f46e5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
  <h1 style="color:#fff;margin:0;font-size:22px;">EduAI Platform</h1>
  <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Campus Information System</p>
</div>
"""

def _send(to_email: str, subject: str, html_body: str):
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        raise RuntimeError("Email is not configured. Set SMTP_USER and SMTP_PASSWORD in .env")
    full_html = f'<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">{_HEADER}{html_body}</div>'
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(full_html, "html"))
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(msg["From"], [to_email], msg.as_string())


def _code_box(code: str) -> str:
    return f"""
    <div style="background:#fff;border:2px solid #e5e7eb;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
      <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Your verification code</p>
      <p style="font-size:40px;font-weight:700;letter-spacing:12px;color:#4f46e5;margin:0;font-family:monospace;">{code}</p>
    </div>"""


def send_reset_code(to_email: str, code: str, display_name: str = ""):
    name = display_name or to_email.split("@")[0]
    body = f"""
      <p style="color:#374151;font-size:15px;">Hi <strong>{name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">We received a request to reset your password. Use the code below — it expires in <strong>10 minutes</strong>.</p>
      {_code_box(code)}
      <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    """
    _send(to_email, f"{code} — Your EduAI password reset code", body)


def send_verification_code(to_email: str, code: str, full_name: str = ""):
    name = full_name or to_email.split("@")[0]
    body = f"""
      <p style="color:#374151;font-size:15px;">Hi <strong>{name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">Thanks for registering! Please verify your email address using the code below — it expires in <strong>15 minutes</strong>.</p>
      {_code_box(code)}
      <p style="color:#6b7280;font-size:13px;">Once verified, your account will be reviewed by an administrator.</p>
    """
    _send(to_email, f"{code} — Verify your EduAI account", body)


def send_approval_email(to_email: str, full_name: str, role: str):
    name = full_name or to_email.split("@")[0]
    role_label = role.replace("_", " ").title()
    body = f"""
      <p style="color:#374151;font-size:15px;">Hi <strong>{name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">Great news — your EduAI account has been <strong style="color:#16a34a;">approved</strong>!</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:#374151;font-size:14px;margin:0;">Your role: <strong>{role_label}</strong></p>
      </div>
      <p style="color:#374151;font-size:15px;">You can now sign in at <strong>localhost:8080</strong> using your registered email and password.</p>
    """
    _send(to_email, "Your EduAI account has been approved", body)


def send_refusal_email(to_email: str, full_name: str, reason: str = ""):
    name = full_name or to_email.split("@")[0]
    reason_block = f'<p style="color:#6b7280;font-size:14px;">Reason: {reason}</p>' if reason else ""
    body = f"""
      <p style="color:#374151;font-size:15px;">Hi <strong>{name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">We regret to inform you that your EduAI account registration has been <strong style="color:#dc2626;">refused</strong>.</p>
      {reason_block}
      <p style="color:#6b7280;font-size:13px;">If you believe this is a mistake, please contact your university administrator.</p>
    """
    _send(to_email, "EduAI account registration update", body)
