from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Country, ImmigrationGuide, ImmigrationQuestion, ImmigrationAnswer


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'name', 'code', 'flag_emoji']


class ImmigrationGuideSerializer(serializers.ModelSerializer):
    country_name = serializers.SerializerMethodField()

    class Meta:
        model = ImmigrationGuide
        fields = ['id', 'country', 'country_name', 'title', 'content', 'category', 'last_updated', 'created_at']

    @extend_schema_field(serializers.CharField())
    def get_country_name(self, obj):
        return obj.country.name


class AnswerAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class ImmigrationAnswerSerializer(serializers.ModelSerializer):
    author = AnswerAuthorSerializer(read_only=True)

    class Meta:
        model = ImmigrationAnswer
        fields = ['id', 'question', 'author', 'content', 'is_accepted', 'created_at']


class QuestionUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class ImmigrationQuestionSerializer(serializers.ModelSerializer):
    user = QuestionUserSerializer(read_only=True)
    answers = ImmigrationAnswerSerializer(many=True, read_only=True)
    answer_count = serializers.SerializerMethodField()

    class Meta:
        model = ImmigrationQuestion
        fields = [
            'id', 'user', 'country', 'content', 'is_answered',
            'answers', 'answer_count', 'created_at',
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_answer_count(self, obj):
        return obj.answers.count()
