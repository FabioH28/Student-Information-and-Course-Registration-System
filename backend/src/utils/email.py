import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.config.settings import settings

_HEADER = """
<div style="background:#4f46e5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
  <h1 style="color:#fff;margin:0;font-size:22px;">CIS Platform</h1>
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
    _send(to_email, f"{code} — Your CIS password reset code", body)


def send_verification_code(to_email: str, code: str, full_name: str = ""):
    name = full_name or to_email.split("@")[0]
    body = f"""
      <p style="color:#374151;font-size:15px;">Hi <strong>{name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">Thanks for registering! Please verify your email address using the code below — it expires in <strong>15 minutes</strong>.</p>
      {_code_box(code)}
      <p style="color:#6b7280;font-size:13px;">Once verified, your account will be reviewed by an administrator.</p>
    """
    _send(to_email, f"{code} — Verify your CIS account", body)


def send_approval_email(to_email: str, full_name: str, role: str):
    name = full_name or to_email.split("@")[0]
    role_label = role.replace("_", " ").title()
    body = f"""
      <p style="color:#374151;font-size:15px;">Hi <strong>{name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">Great news — your CIS account has been <strong style="color:#16a34a;">approved</strong>!</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:#374151;font-size:14px;margin:0;">Your role: <strong>{role_label}</strong></p>
      </div>
      <p style="color:#374151;font-size:15px;">You can now sign in at <strong>localhost:8088</strong> using your registered email and password.</p>
    """
    _send(to_email, "Your CIS account has been approved", body)


def send_refusal_email(to_email: str, full_name: str, reason: str = ""):
    name = full_name or to_email.split("@")[0]
    reason_block = f'<p style="color:#6b7280;font-size:14px;">Reason: {reason}</p>' if reason else ""
    body = f"""
      <p style="color:#374151;font-size:15px;">Hi <strong>{name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">We regret to inform you that your CIS account registration has been <strong style="color:#dc2626;">refused</strong>.</p>
      {reason_block}
      <p style="color:#6b7280;font-size:13px;">If you believe this is a mistake, please contact your CIS administrator.</p>
    """
    _send(to_email, "CIS account registration update", body)


def _credentials_box(email: str, password: str) -> str:
    return f"""
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#374151;font-size:14px;margin:0 0 6px;">Email: <strong>{email}</strong></p>
      <p style="color:#374151;font-size:14px;margin:0;">Temporary password: <strong style="font-family:monospace;">{password}</strong></p>
    </div>"""


def send_account_created_email(to_email: str, full_name: str, role: str, temp_password: str):
    name = full_name or to_email.split("@")[0]
    role_label = role.replace("_", " ").title()
    body = f"""
      <p style="color:#374151;font-size:15px;">Hi <strong>{name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">An administrator has created a CIS account for you with the role <strong>{role_label}</strong>.</p>
      {_credentials_box(to_email, temp_password)}
      <p style="color:#374151;font-size:15px;">Sign in at <strong>localhost:8088</strong>. You'll be asked to change your password on first login.</p>
    """
    _send(to_email, "Your CIS account has been created", body)


def send_account_update_email(to_email: str, full_name: str, role: str | None = None, is_active: bool | None = None):
    name = full_name or to_email.split("@")[0]
    changes = []
    if role is not None:
        changes.append(f"Your role is now <strong>{role.replace('_', ' ').title()}</strong>.")
    if is_active is not None:
        state = "activated" if is_active else "deactivated"
        color = "#16a34a" if is_active else "#dc2626"
        changes.append(f'Your account has been <strong style="color:{color};">{state}</strong>.')
    changes_block = "".join(f'<p style="color:#374151;font-size:15px;">{c}</p>' for c in changes)
    body = f"""
      <p style="color:#374151;font-size:15px;">Hi <strong>{name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">An administrator has updated your CIS account.</p>
      {changes_block}
      <p style="color:#6b7280;font-size:13px;">If you have questions, contact your CIS administrator.</p>
    """
    _send(to_email, "Your CIS account was updated", body)


def send_admin_password_reset_email(to_email: str, full_name: str, temp_password: str):
    name = full_name or to_email.split("@")[0]
    body = f"""
      <p style="color:#374151;font-size:15px;">Hi <strong>{name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">An administrator has reset your CIS password. Use the temporary password below to sign in, then change it immediately.</p>
      {_credentials_box(to_email, temp_password)}
      <p style="color:#6b7280;font-size:13px;">If you didn't expect this, contact your CIS administrator right away.</p>
    """
    _send(to_email, "Your CIS password has been reset", body)
