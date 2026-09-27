from django.conf import settings

from .models import AuditLog, ConsentRecord, Notification


def client_ip(request):
    if request is None:
        return None
    fwd = request.META.get("HTTP_X_FORWARDED_FOR")
    return (fwd.split(",")[0].strip() if fwd else request.META.get("REMOTE_ADDR")) or None


def audit(request, action, entity="", entity_id="", actor=None, **meta):
    AuditLog.objects.create(
        actor=actor or (request.user if request is not None and request.user.is_authenticated else None),
        action=action,
        entity=entity,
        entity_id=str(entity_id or ""),
        meta=meta,
        ip_address=client_ip(request),
    )


def notify(user, title, body="", link="", kind="INFO"):
    return Notification.objects.create(user=user, title=title, body=body, link=link, kind=kind)


def set_consent(user, purpose, granted, request=None):
    ConsentRecord.objects.create(
        user=user,
        purpose=purpose,
        granted=granted,
        version=settings.SKILLTRACE["CONSENT_VERSION"],
        ip_address=client_ip(request),
        user_agent=(request.META.get("HTTP_USER_AGENT", "")[:255] if request else ""),
    )
    profile = getattr(user, "profile", None)
    if profile:
        profile.consent_state[purpose] = granted
        profile.save(update_fields=["consent_state", "updated_at"])
