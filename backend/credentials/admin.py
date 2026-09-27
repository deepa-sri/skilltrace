from django.contrib import admin

from .models import CertificateRecord, IssuedCertificate, Issuer, SkillRecord, SkillTaxonomy

admin.site.register(Issuer, list_display=("name", "code", "issuer_type", "supports_lookup", "is_authorised"))
admin.site.register(IssuedCertificate, list_display=("cert_number", "issuer", "holder_name", "course_name", "revoked"), search_fields=("cert_number", "holder_name"))
admin.site.register(CertificateRecord, list_display=("cert_number", "trainee", "issuer_name", "status", "created_at"), list_filter=("status",))
admin.site.register(SkillTaxonomy, list_display=("name", "category"))
admin.site.register(SkillRecord, list_display=("trainee", "skill", "source", "assessment_status", "competency_level", "best_score"))
