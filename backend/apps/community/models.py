from django.conf import settings
from django.db import models
from cloudinary.models import CloudinaryField


class GroupType(models.TextChoices):
    PUBLIC = 'public', 'Public'
    PRIVATE = 'private', 'Privé'


class MemberRole(models.TextChoices):
    MEMBER = 'member', 'Membre'
    MODERATOR = 'moderator', 'Modérateur'
    ADMIN = 'admin', 'Administrateur'


class ReactionType(models.TextChoices):
    LIKE = 'like', "J'aime"
    HEART = 'heart', 'Coeur'
    SUPPORT = 'support', 'Soutien'


class Group(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    avatar = CloudinaryField('group_avatar', blank=True, null=True, folder='groups')
    type = models.CharField(max_length=10, choices=GroupType.choices, default=GroupType.PUBLIC)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_groups',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Membership(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=15, choices=MemberRole.choices, default=MemberRole.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'group')

    def __str__(self):
        return f"{self.user} in {self.group}"


class Post(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts',
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='posts',
        null=True,
        blank=True,
    )
    content = models.TextField()
    image = CloudinaryField('post_image', blank=True, null=True, folder='posts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author}"


class Reaction(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reactions',
    )
    type = models.CharField(max_length=10, choices=ReactionType.choices, default=ReactionType.LIKE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        return f"{self.user} {self.type} on {self.post}"
