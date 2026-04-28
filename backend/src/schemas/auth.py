from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

class VerifyEmailRequest(BaseModel):
    email: str
    code: str

class LoginResponse(BaseModel):
    access_token: str
    role: str
    require_password_change: bool
    email: str
    display_name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ResetPasswordRequest(BaseModel):
    email: str

class ConfirmResetRequest(BaseModel):
    token: str
    new_password: str
