from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Group, Membership, MemberRole, Post, Comment, Reaction
from .serializers import (
    GroupSerializer,
    MembershipSerializer,
    PostSerializer,
    CommentSerializer,
    ReactionSerializer,
)


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().select_related('creator').prefetch_related('memberships', 'posts')
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        group = serializer.save(creator=self.request.user)
        Membership.objects.create(
            user=self.request.user,
            group=group,
            role=MemberRole.ADMIN,
        )

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        group = self.get_object()
        membership, created = Membership.objects.get_or_create(
            user=request.user,
            group=group,
            defaults={'role': MemberRole.MEMBER},
        )
        serializer = MembershipSerializer(membership)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()
        Membership.objects.filter(user=request.user, group=group).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        group = self.get_object()
        memberships = group.memberships.select_related('user').order_by('joined_at')
        serializer = MembershipSerializer(memberships, many=True)
        return Response(serializer.data)


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().select_related('author').prefetch_related('comments', 'reactions')
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        group = serializer.validated_data.get('group')
        if group and group.type == 'private':
            is_member = Membership.objects.filter(user=self.request.user, group=group).exists()
            if not is_member:
                raise PermissionDenied("Vous devez être membre pour poster dans ce groupe privé.")
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        group_id = self.request.query_params.get('group')
        if group_id is not None:
            queryset = queryset.filter(group__id=group_id)
        return queryset


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().select_related('author', 'post')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        post_id = self.request.query_params.get('post')
        if post_id is not None:
            queryset = queryset.filter(post__id=post_id)
        return queryset


class ReactionViewSet(viewsets.ModelViewSet):
    queryset = Reaction.objects.all().select_related('user', 'post')
    serializer_class = ReactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError as DRFValidationError
        post = serializer.validated_data.get('post')
        if post and Reaction.objects.filter(post=post, user=self.request.user).exists():
            raise DRFValidationError("Vous avez déjà réagi à cette publication.")
        serializer.save(user=self.request.user)
