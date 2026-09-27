from rest_framework.permissions import BasePermission


def role_permission(*roles):
    class _RolePermission(BasePermission):
        message = "Your role does not have access to this resource."

        def has_permission(self, request, view):
            return bool(request.user and request.user.is_authenticated and request.user.role in roles)

    _RolePermission.__name__ = "Is" + "Or".join(r.title() for r in roles)
    return _RolePermission


IsTrainee = role_permission("TRAINEE")
IsProvider = role_permission("PROVIDER")
IsEmployer = role_permission("EMPLOYER")
IsOfficer = role_permission("OFFICER", "ADMIN")
IsAdmin = role_permission("ADMIN")
IsAdminOrProvider = role_permission("ADMIN", "PROVIDER")
