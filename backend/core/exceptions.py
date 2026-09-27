from rest_framework.views import exception_handler as drf_handler


def exception_handler(exc, context):
    """Always return {"detail": "...", ...} so the frontend can show one message."""
    response = drf_handler(exc, context)
    if response is None:
        return None
    data = response.data
    if isinstance(data, dict) and "detail" not in data:
        first = None
        for key, val in data.items():
            msg = val[0] if isinstance(val, list) and val else val
            first = f"{key.replace('_', ' ').capitalize()}: {msg}" if key != "non_field_errors" else str(msg)
            break
        response.data = {"detail": first or "Invalid request", "errors": data}
    elif isinstance(data, list):
        response.data = {"detail": str(data[0]) if data else "Invalid request"}
    return response
