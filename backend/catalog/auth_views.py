from rest_framework import serializers
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class StaffTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_staff:
            raise serializers.ValidationError("Compte non autorise pour l'administration.")
        data["user"] = {
            "username": self.user.username,
            "is_staff": self.user.is_staff,
        }
        return data


class StaffTokenObtainPairView(TokenObtainPairView):
    """Rate-limited: a brute-forcer gets 5 tries/min per IP, then locked out
    for a minute, regardless of whether the username exists."""

    serializer_class = StaffTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"
