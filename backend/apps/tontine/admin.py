from django.contrib import admin

from .models import Tontine, TontineMembership, TontineRound, TontineContribution


@admin.register(Tontine)
class TontineAdmin(admin.ModelAdmin):
    list_display = ['name', 'organizer', 'contribution_amount', 'currency', 'frequency', 'status']
    list_filter = ['status', 'frequency', 'currency']


@admin.register(TontineRound)
class TontineRoundAdmin(admin.ModelAdmin):
    list_display = ['tontine', 'round_number', 'beneficiary', 'start_date', 'end_date', 'status']


@admin.register(TontineContribution)
class TontineContributionAdmin(admin.ModelAdmin):
    list_display = ['round', 'contributor', 'amount', 'paid_at']
