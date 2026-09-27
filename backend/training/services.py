from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from core.utils import notify


@transaction.atomic
def complete_enrollment(enrollment, issue_certificate=True, completion_date=None):
    """Mark completion, schedule longitudinal follow-ups, register training skills and
    (optionally) issue a certificate into the provider's issuer registry."""
    from credentials.models import IssuedCertificate, SkillRecord, SkillTaxonomy
    from outcomes.models import FollowUpSchedule

    enrollment.status = "COMPLETED"
    enrollment.provider_confirmed = True
    enrollment.completion_date = completion_date or enrollment.completion_date or timezone.localdate()
    programme = enrollment.programme
    trainee = enrollment.trainee

    if issue_certificate and not enrollment.certificate_number and programme.provider.issuer_id:
        seq = IssuedCertificate.objects.filter(issuer=programme.provider.issuer).count() + 1
        number = f"{programme.provider.issuer.code}-{enrollment.completion_date.year}-{seq:05d}"
        IssuedCertificate.objects.create(
            issuer=programme.provider.issuer, cert_number=number, holder_name=trainee.full_name,
            course_name=programme.name, issue_date=enrollment.completion_date,
            holder_uti=getattr(getattr(trainee, "profile", None), "uti", ""),
        )
        enrollment.certificate_number = number
    enrollment.save()

    for name in programme.target_skills:
        skill = SkillTaxonomy.objects.filter(name__iexact=name).first()
        if skill:
            SkillRecord.objects.get_or_create(trainee=trainee, skill=skill, defaults={"source": "TRAINING", "evidence_note": f"Target skill of {programme.name}"})

    for code, days in settings.SKILLTRACE["FOLLOWUP_MILESTONES"]:
        FollowUpSchedule.objects.get_or_create(
            enrollment=enrollment, milestone=code,
            defaults={"trainee": trainee, "due_date": enrollment.completion_date + timedelta(days=days)},
        )
    notify(trainee, "Training completed", f"{programme.name} is marked complete. Follow-ups are scheduled at 30, 90, 180 and 365 days.", "/trainee/training", "SUCCESS")
    return enrollment
