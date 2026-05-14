from rest_framework.permissions import BasePermission


class IsVerifiedUser(BasePermission):
    """Allow access only to users with a verified account."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_verified)


class IsTrustedUser(BasePermission):
    """Allow access only to users with a minimum trust score."""
    min_score = 10

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.trust_score >= self.min_score
        )
