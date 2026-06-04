from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

from .models import Country, ImmigrationGuide, ImmigrationQuestion, ImmigrationAnswer
from .serializers import (
    CountrySerializer,
    ImmigrationGuideSerializer,
    ImmigrationQuestionSerializer,
    ImmigrationAnswerSerializer,
)


class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        code = self.request.query_params.get('code')
        if code is not None:
            queryset = queryset.filter(code__iexact=code)
        return queryset


class ImmigrationGuideViewSet(viewsets.ModelViewSet):
    queryset = ImmigrationGuide.objects.all().select_related('country')
    serializer_class = ImmigrationGuideSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        country_id = self.request.query_params.get('country')
        category = self.request.query_params.get('category')
        if country_id is not None:
            queryset = queryset.filter(country__id=country_id)
        if category is not None:
            queryset = queryset.filter(category=category)
        return queryset


class ImmigrationQuestionViewSet(viewsets.ModelViewSet):
    queryset = ImmigrationQuestion.objects.all().select_related('user', 'country').prefetch_related('answers')
    serializer_class = ImmigrationQuestionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        country_id = self.request.query_params.get('country')
        if country_id is not None:
            queryset = queryset.filter(country__id=country_id)
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def answer(self, request, pk=None):
        question = self.get_object()
        serializer = ImmigrationAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answer = serializer.save(question=question, author=request.user)
        question.is_answered = True
        question.save(update_fields=['is_answered'])
        return Response(ImmigrationAnswerSerializer(answer).data, status=status.HTTP_201_CREATED)


class ImmigrationAnswerViewSet(viewsets.ModelViewSet):
    queryset = ImmigrationAnswer.objects.all().select_related('author', 'question')
    serializer_class = ImmigrationAnswerSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        question_id = self.request.query_params.get('question')
        if question_id is not None:
            queryset = queryset.filter(question__id=question_id)
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept(self, request, pk=None):
        answer = self.get_object()
        if answer.question.user != request.user:
            return Response(
                {'detail': 'Only the question author can accept an answer.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        answer.is_accepted = True
        answer.save(update_fields=['is_accepted'])
        return Response(ImmigrationAnswerSerializer(answer).data)
