from django.contrib import admin

from .models import SolidarityFund, SolidarityContribution


@admin.register(SolidarityFund)
class SolidarityFundAdmin(admin.ModelAdmin):
    list_display = ['title', 'creator', 'target_amount', 'currency', 'category', 'status']
    list_filter = ['category', 'status']


@admin.register(SolidarityContribution)
class SolidarityContributionAdmin(admin.ModelAdmin):
    list_display = ['fund', 'contributor', 'amount', 'is_anonymous', 'contributed_at']
