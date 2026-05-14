from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Article, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class ArticleAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class ArticleSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True,
        source='tags', required=False,
    )

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'content', 'category', 'cover_image',
            'tags', 'tag_ids', 'is_published', 'published_at',
            'author', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'author', 'published_at', 'created_at', 'updated_at']

    @extend_schema_field(ArticleAuthorSerializer)
    def get_author(self, obj):
        return {
            'id': obj.author.id,
            'first_name': obj.author.first_name,
            'last_name': obj.author.last_name,
        }
