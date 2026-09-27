from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.ai import ai_enabled, gemini
from core.permissions import IsAdmin
from training.models import SkillingProgramme, SkillingProvider

from .compute import compute


@api_view(["GET"])
@permission_classes([IsAdmin])
def dashboard(request):
    filters = {k: v for k, v in request.query_params.items() if v}
    data = compute(filters)
    data["filters"] = {
        "programmes": list(SkillingProgramme.objects.values("id", "name", "code")),
        "providers": list(SkillingProvider.objects.values("id", "name")),
        "sectors": sorted(set(SkillingProgramme.objects.values_list("sector", flat=True))),
        "cohorts": ["2024", "2025", "2026"],
    }
    data["applied"] = filters
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAdmin])
def insights(request):
    filters = {k: v for k, v in (request.data.get("filters") or {}).items() if v}
    data = compute(filters)
    summary = {k: data[k] for k in ("kpis", "recommendations", "non_placement", "soft_domains")}
    summary["top_programmes"] = data["programmes"][:3]
    summary["bottom_programmes"] = data["programmes"][-3:]
    text = gemini(
        "You are a policy analyst for the Maharashtra Skills Department. Using ONLY this aggregate demo data, "
        "write 5 short bullet insights for a decision maker, each with a suggested action. Do not invent numbers. "
        "Note that outcomes cannot be fully attributed to providers without an evaluation design. Data: " + str(summary)[:6000]
    ) if ai_enabled() else None
    if text:
        return Response({"source": "gemini", "text": text})
    lines = [f"- {r['finding']} ({r['target']}): {r['action']}" for r in data["recommendations"][:5]]
    return Response({"source": "rules", "text": "\n".join(lines) or "Not enough data for insights yet."})


@api_view(["GET"])
@permission_classes([AllowAny])
def public_stats(request):
    data = cache.get("public_stats")
    if not data:
        full = compute({})
        k = full["kpis"]
        data = {"registered": k["registered"], "completed": k["completed"], "placement_rate": k["placement_rate"],
                "districts": sum(1 for d in full["districts"] if d["trainees"]), "certificates": k["certificates"],
                "assessments": k["soft_assessed"] + k["tech_assessed"], "demo_data": True}
        cache.set("public_stats", data, 60)
    return Response(data)
