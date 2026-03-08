from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    Float, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# ─────────── Enums ───────────

class UserRole(str, enum.Enum):
    citizen = "citizen"
    admin = "admin"
    officer = "officer"


class SchemeCategory(str, enum.Enum):
    agriculture = "Agriculture"
    health = "Health"
    housing = "Housing"
    education = "Education"
    employment = "Employment"
    women = "Women & Child"
    disability = "Disability"
    senior = "Senior Citizen"
    other = "Other"


class GrievanceStatus(str, enum.Enum):
    submitted = "Submitted"
    under_review = "Under Review"
    actioned = "Actioned"
    resolved = "Resolved"
    closed = "Closed"


class ApplicationStatus(str, enum.Enum):
    draft = "Draft"
    submitted = "Submitted"
    under_review = "Under Review"
    approved = "Approved"
    rejected = "Rejected"


# ─────────── Models ───────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    phone = Column(String(15), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    aadhaar_last4 = Column(String(4), nullable=True)
    preferred_language = Column(String(10), default="hi")
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    annual_income = Column(Float, nullable=True)
    caste_category = Column(String(50), nullable=True)
    land_holdings_hectares = Column(Float, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.citizen)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    profile_complete = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applications = relationship("Application", back_populates="user")
    grievances = relationship("Grievance", back_populates="user")
    documents = relationship("UserDocument", back_populates="user")
    scheme_matches = relationship("SchemeMatch", back_populates="user")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(200), nullable=False)
    relation = Column(String(50), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)
    occupation = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    benefit_amount = Column(String(255), nullable=True)       # e.g. "₹6,000 per year"
    benefit_type = Column(String(100), nullable=True)
    eligibility_criteria = Column(Text, nullable=True)
    required_documents = Column(Text, nullable=True)
    applying_authority = Column(Text, nullable=True)
    scheme_type = Column(String(50), default="central")
    state = Column(String(100), default="all", index=True)
    ministry = Column(String(255), nullable=True)
    deadline = Column(DateTime, nullable=True)
    launch_year = Column(Integer, nullable=True)
    beneficiary_type = Column(String(100), nullable=True, index=True)
    min_age = Column(Integer, nullable=True)
    max_age = Column(Integer, nullable=True)
    income_limit = Column(Float, nullable=True)
    land_limit_acres = Column(Float, nullable=True)
    gender = Column(String(20), default="all")
    caste = Column(String(100), default="all")
    is_active = Column(Boolean, default=True, index=True)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Multilingual translations (27 columns) ────────────────────────────
    description_hi = Column(Text, nullable=True)
    description_gu = Column(Text, nullable=True)
    description_bn = Column(Text, nullable=True)
    description_ta = Column(Text, nullable=True)
    description_te = Column(Text, nullable=True)
    description_mr = Column(Text, nullable=True)
    description_pa = Column(Text, nullable=True)
    description_kn = Column(Text, nullable=True)
    description_ml = Column(Text, nullable=True)

    eligibility_criteria_hi = Column(Text, nullable=True)
    eligibility_criteria_gu = Column(Text, nullable=True)
    eligibility_criteria_bn = Column(Text, nullable=True)
    eligibility_criteria_ta = Column(Text, nullable=True)
    eligibility_criteria_te = Column(Text, nullable=True)
    eligibility_criteria_mr = Column(Text, nullable=True)
    eligibility_criteria_pa = Column(Text, nullable=True)
    eligibility_criteria_kn = Column(Text, nullable=True)
    eligibility_criteria_ml = Column(Text, nullable=True)

    required_documents_hi = Column(Text, nullable=True)
    required_documents_gu = Column(Text, nullable=True)
    required_documents_bn = Column(Text, nullable=True)
    required_documents_ta = Column(Text, nullable=True)
    required_documents_te = Column(Text, nullable=True)
    required_documents_mr = Column(Text, nullable=True)
    required_documents_pa = Column(Text, nullable=True)
    required_documents_kn = Column(Text, nullable=True)
    required_documents_ml = Column(Text, nullable=True)

    applications = relationship("Application", back_populates="scheme")
    matches = relationship("SchemeMatch", back_populates="scheme")


class SchemeMatch(Base):
    __tablename__ = "scheme_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"))
    match_percentage = Column(Float, default=0.0)
    match_reasons = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="scheme_matches")
    scheme = relationship("Scheme", back_populates="matches")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"))
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.draft)
    current_step = Column(Integer, default=1)
    completed_steps = Column(JSON, default=list)
    notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="applications")
    scheme = relationship("Scheme", back_populates="applications")


class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    ticket_id = Column(String(20), unique=True, index=True)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(GrievanceStatus), default=GrievanceStatus.submitted)
    resolution_notes = Column(Text, nullable=True)
    assigned_to = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="grievances")


class UserDocument(Base):
    __tablename__ = "user_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    document_type = Column(String(100), nullable=False)
    file_name = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size_kb = Column(Integer, nullable=True)
    ocr_extracted_data = Column(JSON, nullable=True)
    ai_summary = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="documents")


class OfficeLocation(Base):
    __tablename__ = "office_locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    office_type = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    district = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    phone = Column(String(20), nullable=True)
    operating_hours = Column(String(100), nullable=True)
    services = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(10), nullable=False)   # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DeadlineAlert(Base):
    __tablename__ = "deadline_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"))
    alert_sent = Column(Boolean, default=False)
    alert_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
