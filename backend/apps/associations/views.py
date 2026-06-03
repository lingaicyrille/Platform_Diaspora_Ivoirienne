from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Association, AssociationMember, MemberRole
from .serializers import AssociationSerializer, AssociationMemberSerializer


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AssociationViewSet(viewsets.ModelViewSet):
    serializer_class = AssociationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        qs = Association.objects.all().select_related('created_by').prefetch_related('members')
        category = self.request.query_params.get('category')
        country = self.request.query_params.get('country')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if country:
            qs = qs.filter(country__iexact=country)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def perform_create(self, serializer):
        association = serializer.save(created_by=self.request.user)
        AssociationMember.objects.create(
            association=association,
            user=self.request.user,
            role=MemberRole.PRESIDENT,
        )

    @action(detail=True, methods=['post'], url_path='join')
    def join(self, request, pk=None):
        association = self.get_object()
        member, created = AssociationMember.objects.get_or_create(
            association=association,
            user=request.user,
            defaults={'role': MemberRole.MEMBER},
        )
        serializer = AssociationMemberSerializer(member)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    @action(detail=True, methods=['post'], url_path='leave')
    def leave(self, request, pk=None):
        association = self.get_object()
        deleted, _ = AssociationMember.objects.filter(
            association=association,
            user=request.user,
        ).delete()
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {'detail': 'You are not a member of this association.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


class AssociationMemberViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AssociationMemberSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = AssociationMember.objects.all().select_related('association', 'user')
        association_id = self.request.query_params.get('association')
        if association_id:
            qs = qs.filter(association_id=association_id)
        return qs
