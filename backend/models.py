from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Manufacturer(db.Model):
    """Manufacturer model for storing manufacturer registration data"""
    __tablename__ = 'manufacturers'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    company_name = db.Column(db.String(255), nullable=False)
    license_number = db.Column(db.String(100), nullable=False, unique=True)
    license_authority = db.Column(db.String(100), nullable=True)
    license_expiry = db.Column(db.Date, nullable=True)
    gstin = db.Column(db.String(20), nullable=True)
    pan = db.Column(db.String(10), nullable=True)
    factory_address = db.Column(db.Text, nullable=True)
    registered_address = db.Column(db.Text, nullable=True)
    contact_name = db.Column(db.String(100), nullable=False)
    contact_designation = db.Column(db.String(100), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=False, unique=True)
    contact_email = db.Column(db.String(150), unique=True, nullable=False)
    official_email = db.Column(db.String(150), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    company_profile = db.Column(db.Text, nullable=True)
    certifications = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    license_file = db.Column(db.String(255), nullable=True)
    other_documents = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<Manufacturer {self.company_name}>'

class Pharmacy(db.Model):
    """Pharmacy model for storing pharmacy registration data"""
    __tablename__ = 'pharmacies'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pharmacy_name = db.Column(db.String(255), nullable=False)
    pharmacy_type = db.Column(db.String(50), nullable=True)
    license_number = db.Column(db.String(100), nullable=False, unique=True)
    license_authority = db.Column(db.String(100), nullable=True)
    license_expiry = db.Column(db.Date, nullable=True)
    gstin = db.Column(db.String(20), nullable=True)
    pharmacy_address = db.Column(db.Text, nullable=False)
    operating_hours = db.Column(db.String(100), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    pharmacy_description = db.Column(db.Text, nullable=True)
    owner_name = db.Column(db.String(100), nullable=False)
    owner_pan = db.Column(db.String(10), nullable=True)
    contact_name = db.Column(db.String(100), nullable=False)
    contact_designation = db.Column(db.String(100), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=False, unique=True)
    contact_email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    license_file = db.Column(db.String(255), nullable=True)
    pharmacist_certificate = db.Column(db.String(255), nullable=True)
    other_documents = db.Column(db.Text, nullable=True)
    certifications = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert model to dictionary for API responses"""
        return {
            'id': self.id,
            'pharmacy_name': self.pharmacy_name,
            'pharmacy_type': self.pharmacy_type,
            'license_number': self.license_number,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Pharmacy {self.pharmacy_name}>'

class MedicineBatch(db.Model):
    """Medicine batch model for storing medicine batch verification data"""
    __tablename__ = 'medicine_batches'
    
    medicine_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    batch_number = db.Column(db.String(100), nullable=False, index=True)
    medicine_name = db.Column(db.String(255), nullable=False)
    manufacture_date = db.Column(db.Date, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    pharmacy_name = db.Column(db.String(255), nullable=True)
    date_uploaded = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<MedicineBatch {self.batch_number}>'
    
    def to_dict(self):
        """Convert model to dictionary for API responses"""
        return {
            'medicine_id': self.medicine_id,
            'batch_number': self.batch_number,
            'medicine_name': self.medicine_name,
            'manufacture_date': self.manufacture_date.strftime('%Y-%m-%d') if self.manufacture_date else None,
            'expiry_date': self.expiry_date.strftime('%Y-%m-%d') if self.expiry_date else None,
            'pharmacy_name': self.pharmacy_name,
            'date_uploaded': self.date_uploaded.strftime('%Y-%m-%d %H:%M:%S') if self.date_uploaded else None
        }
