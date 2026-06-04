from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import HelpRequest, HelpOffer
from .serializers import HelpRequestSerializer, HelpOfferSerializer


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class HelpRequestViewSet(viewsets.ModelViewSet):
    serializer_class = HelpRequestSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = HelpRequest.objects.select_related('requester').prefetch_related('offers__helper')
        category = self.request.query_params.get('category')
        urgency = self.request.query_params.get('urgency')
        req_status = self.request.query_params.get('status')
        mine = self.request.query_params.get('mine')

        if category:
            qs = qs.filter(category=category)
        if urgency:
            qs = qs.filter(urgency=urgency)
        if req_status:
            qs = qs.filter(status=req_status)
        if mine == 'true':
            qs = qs.filter(requester=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

    @action(detail=True, methods=['post'], url_path='offer')
    def offer(self, request, pk=None):
        help_request = self.get_object()
        if help_request.requester == request.user:
            raise ValidationError("Vous ne pouvez pas offrir de l'aide sur votre propre demande.")
        if HelpOffer.objects.filter(request=help_request, helper=request.user).exists():
            raise ValidationError("Vous avez déjà proposé votre aide.")
        serializer = HelpOfferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        offer = serializer.save(request=help_request, helper=request.user)
        return Response(HelpOfferSerializer(offer).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        help_request = self.get_object()
        if help_request.requester != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seul le demandeur peut marquer cette demande comme résolue.")
        help_request.status = 'resolved'
        help_request.save()
        return Response(HelpRequestSerializer(help_request).data)
