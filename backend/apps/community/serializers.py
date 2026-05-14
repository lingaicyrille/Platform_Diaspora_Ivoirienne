from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Group, Membership, Post, Comment, Reaction


class CreatorSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class GroupSerializer(serializers.ModelSerializer):
    creator = CreatorSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'avatar', 'type',
            'creator', 'member_count', 'is_member',
            'created_at', 'updated_at',
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_member_count(self, obj):
        return obj.memberships.count()

    @extend_schema_field(serializers.BooleanField())
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.memberships.filter(user=request.user).exists()
        return False


class MembershipSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    group = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Membership
        fields = ['id', 'user', 'group', 'role', 'joined_at']


class PostAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class PostSerializer(serializers.ModelSerializer):
    author = PostAuthorSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()
    reaction_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'group', 'content', 'image',
            'comment_count', 'reaction_count',
            'created_at', 'updated_at',
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_comment_count(self, obj):
        return obj.comments.count()

    @extend_schema_field(serializers.IntegerField())
    def get_reaction_count(self, obj):
        return obj.reactions.count()


class CommentSerializer(serializers.ModelSerializer):
    author = PostAuthorSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'content', 'created_at']


class ReactionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Reaction
        fields = ['id', 'post', 'user', 'type', 'created_at']
