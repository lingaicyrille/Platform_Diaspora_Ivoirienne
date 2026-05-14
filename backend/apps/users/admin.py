from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'country_of_residence', 'continent', 'is_verified', 'trust_score']
    list_filter = ['is_verified', 'continent', 'preferred_language', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name', 'country_of_residence']
    ordering = ['-date_joined']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'phone', 'bio', 'avatar')}),
        ('Localisation', {'fields': ('country_of_residence', 'city', 'continent')}),
        ('Paramètres', {'fields': ('preferred_language', 'is_verified', 'trust_score')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
