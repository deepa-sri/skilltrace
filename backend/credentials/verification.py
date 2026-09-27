"""Certificate verification engine.

Each check returns a dict {key, label, result: pass|fail|warn|skip, detail}. The final status is
derived from the combination. Document parsing is never treated as proof of authenticity: only a
match in the issuer registry yields ISSUER_VERIFIED.
"""
import difflib
import hashlib
import os
import re

from django.conf import settings
from django.utils import timezone

from .models import CertificateRecord, IssuedCertificate, Issuer

CFG = settings.SKILLTRACE


def _check(key, label, result, detail):
    return {"key": key, "label": label, "result": result, "detail": detail}


def sha256_file(f):
    h = hashlib.sha256()
    for chunk in f.chunks():
        h.update(chunk)
    f.seek(0)
    return h.hexdigest()


def validate_upload(f):
    """Returns an error string or None. Runs before the record is created."""
    if f is None:
        return None
    ext = os.path.splitext(f.name)[1].lower()
    if ext not in CFG["CERT_ALLOWED_EXT"]:
        return f"Unsupported file type {ext or '(none)'}. Upload PDF, PNG or JPG."
    if f.size == 0:
        return "The uploaded file is empty."
    if f.size > CFG["CERT_MAX_BYTES"]:
        return "File is larger than 5 MB."
    head = f.read(8)
    f.seek(0)
    sig_ok = (ext == ".pdf" and head.startswith(b"%PDF")) or (ext == ".png" and head.startswith(b"\x89PNG")) or (ext in (".jpg", ".jpeg") and head.startswith(b"\xff\xd8"))
    if not sig_ok:
        return "File content does not match its extension. The file may be corrupted or renamed."
    return None


def match_issuer(name):
    name_l = (name or "").strip().lower()
    best, best_ratio = None, 0.0
    for issuer in Issuer.objects.all():
        for candidate in [issuer.name, issuer.code, *issuer.aliases]:
            r = difflib.SequenceMatcher(None, name_l, candidate.lower()).ratio()
            if r > best_ratio:
                best, best_ratio = issuer, r
    return (best, best_ratio) if best_ratio >= 0.8 else (None, best_ratio)


def _pdf_text(record):
    if not record.file or not record.file.name.lower().endswith(".pdf"):
        return None
    try:
        from pypdf import PdfReader
        reader = PdfReader(record.file.path)
        return " ".join((p.extract_text() or "") for p in reader.pages[:3])
    except Exception:
        return ""


def run_verification(record: CertificateRecord):
    checks = []
    trainee_name = record.trainee.full_name or ""

    # 1. Document validation
    missing = [f for f in ("holder_name", "issuer_name", "cert_number", "course_name", "issue_date") if not getattr(record, f)]
    if missing:
        checks.append(_check("document", "Document validation", "fail", f"Missing required fields: {', '.join(missing)}"))
    elif record.file:
        text = _pdf_text(record)
        if text is None:
            checks.append(_check("document", "Document validation", "pass", "Image file accepted. Fields were entered by the trainee."))
        elif text == "":
            checks.append(_check("document", "Document validation", "warn", "PDF could not be read. It may be scanned or damaged."))
        else:
            found = record.cert_number.lower() in text.lower()
            checks.append(_check("document", "Document validation", "pass" if found else "warn",
                                 "Certificate number found in document text." if found else "Certificate number was not found in the PDF text."))
    else:
        checks.append(_check("document", "Document validation", "warn", "No file attached. Only entered details can be checked."))

    # 2. Issuer validation
    issuer, ratio = match_issuer(record.issuer_name)
    record.issuer = issuer
    if issuer and issuer.is_authorised:
        checks.append(_check("issuer", "Issuer validation", "pass", f"Matched authorised issuer: {issuer.name}"))
    elif issuer:
        checks.append(_check("issuer", "Issuer validation", "fail", f"{issuer.name} is not an authorised issuer"))
    else:
        checks.append(_check("issuer", "Issuer validation", "warn", "Issuer is not in the authorised registry"))

    # 3. Certificate reference check
    reg = None
    if issuer and issuer.supports_lookup:
        reg = IssuedCertificate.objects.filter(issuer=issuer, cert_number__iexact=record.cert_number.strip()).first()
        if reg and reg.revoked:
            checks.append(_check("reference", "Certificate reference check", "fail", "Issuer registry marks this certificate as revoked"))
        elif reg:
            name_ratio = difflib.SequenceMatcher(None, reg.holder_name.lower(), record.holder_name.lower()).ratio()
            if name_ratio >= 0.85:
                checks.append(_check("reference", "Certificate reference check", "pass", f"Issuer record found for {reg.course_name}, issued {reg.issue_date:%d %b %Y}"))
            else:
                checks.append(_check("reference", "Certificate reference check", "fail", "Issuer record exists but the holder name does not match"))
        else:
            checks.append(_check("reference", "Certificate reference check", "fail", "No certificate with this number in the issuer registry"))
    else:
        checks.append(_check("reference", "Certificate reference check", "skip", "Issuer does not support automated lookup"))

    # 4. Duplicate detection
    dup = CertificateRecord.objects.exclude(pk=record.pk).exclude(trainee=record.trainee).filter(cert_number__iexact=record.cert_number)
    dup_file = record.file_hash and CertificateRecord.objects.exclude(pk=record.pk).exclude(trainee=record.trainee).filter(file_hash=record.file_hash).exists()
    if dup.exists() or dup_file:
        checks.append(_check("duplicate", "Duplicate detection", "fail", "This certificate is already linked to another trainee"))
    else:
        checks.append(_check("duplicate", "Duplicate detection", "pass", "No duplicate found"))

    # 5. Tampering indicators
    flags, severe = [], False
    if difflib.SequenceMatcher(None, trainee_name.lower(), record.holder_name.lower()).ratio() < 0.75:
        flags.append("holder name differs from the account name")
        severe = True
    today = timezone.localdate()
    if record.issue_date and record.issue_date > today:
        flags.append("issue date is in the future")
        severe = True
    if record.expiry_date and record.expiry_date < today:
        flags.append("certificate has expired")
    if record.expiry_date and record.issue_date and record.expiry_date < record.issue_date:
        flags.append("expiry is before issue date")
    if not re.match(r"^[A-Za-z0-9/\-_.]{4,60}$", record.cert_number.strip()):
        flags.append("certificate number has an unusual format")
    if reg and reg.issue_date != record.issue_date:
        flags.append("issue date differs from issuer record")
        severe = True
    checks.append(_check("tampering", "Tampering indicators", ("fail" if severe else "warn") if flags else "pass",
                         ("Review: " + "; ".join(flags)) if flags else "No inconsistencies detected"))

    record.checks = checks
    record.status = _derive_status(checks)
    record.save()
    return record


def _derive_status(checks):
    r = {c["key"]: c["result"] for c in checks}
    if r["document"] == "fail":
        return "REJECTED"
    if r["duplicate"] == "fail" or r["tampering"] == "fail":
        return "MANUAL_REVIEW"
    if r["issuer"] == "fail" or r["reference"] == "fail":
        return "MANUAL_REVIEW" if r["issuer"] == "pass" else "REJECTED" if r["issuer"] == "fail" else "MANUAL_REVIEW"
    if r["reference"] == "pass":
        return "ISSUER_VERIFIED" if r["tampering"] == "pass" else "PARTIALLY_VERIFIED"
    if r["reference"] == "skip" and r["issuer"] == "pass":
        return "PARTIALLY_VERIFIED"
    if r["issuer"] == "warn":
        return "VERIFICATION_UNAVAILABLE" if r["tampering"] == "pass" else "MANUAL_REVIEW"
    return "DOCUMENT_CHECKED"
