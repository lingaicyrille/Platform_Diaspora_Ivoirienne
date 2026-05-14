import uuid
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from cloudinary.models import CloudinaryField


class Continent(models.TextChoices):
    AFRICA = 'AF', 'Afrique'
    EUROPE = 'EU', 'Europe'
    NORTH_AMERICA = 'NA', 'Amérique du Nord'
    SOUTH_AMERICA = 'SA', 'Amérique du Sud'
    ASIA = 'AS', 'Asie'
    OCEANIA = 'OC', 'Océanie'
    MIDDLE_EAST = 'ME', 'Moyen-Orient'


class Language(models.TextChoices):
    FRENCH = 'fr', 'Français'
    ENGLISH = 'en', 'English'
    DIOULA = 'di', 'Dioula'
    BAOULE = 'ba', 'Baoulé'
    BETE = 'be', 'Bété'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Un email est requis.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    bio = models.TextField(blank=True)
    avatar = CloudinaryField('avatar', blank=True, null=True, folder='avatars')

    country_of_residence = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    continent = models.CharField(max_length=2, choices=Continent.choices, blank=True)

    preferred_language = models.CharField(
        max_length=2, choices=Language.choices, default=Language.FRENCH
    )

    is_verified = models.BooleanField(default=False)
    trust_score = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='verification_tokens',
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Verification token for {self.user}"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='password_reset_tokens',
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Password reset token for {self.user}"
