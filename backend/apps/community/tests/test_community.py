import pytest
import factory
from rest_framework.test import APIClient

from apps.users.tests.conftest import UserFactory
from apps.community.models import Group, Membership, MemberRole, Post, Comment, Reaction


# ─── Module-level factories ───────────────────────────────────────────────────

class GroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Group

    name = factory.Sequence(lambda n: f'Group {n}')
    description = 'A test group'
    type = 'public'
    creator = factory.SubFactory(UserFactory)


class PostFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Post

    author = factory.SubFactory(UserFactory)
    content = factory.Sequence(lambda n: f'Post content {n}')
    group = None


class CommentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Comment

    post = factory.SubFactory(PostFactory)
    author = factory.SubFactory(UserFactory)
    content = factory.Sequence(lambda n: f'Comment content {n}')


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


# ─── GroupViewSet tests ───────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGroupViewSet:

    def test_list_groups_authenticated(self, auth_client):
        GroupFactory.create_batch(3)
        res = auth_client.get('/api/community/groups/')
        assert res.status_code == 200
        assert res.data['count'] >= 3

    def test_list_groups_unauthenticated_returns_401(self, api_client):
        res = api_client.get('/api/community/groups/')
        assert res.status_code == 401

    def test_create_group(self, auth_client, user):
        payload = {'name': 'Ivoiriens de Paris', 'description': 'Groupe pour Ivoiriens', 'type': 'public'}
        res = auth_client.post('/api/community/groups/', payload, format='json')
        assert res.status_code == 201
        assert res.data['name'] == 'Ivoiriens de Paris'
        # creator should be the authenticated user
        assert res.data['creator']['id'] == user.id
        # auto-membership as admin should be created
        assert Membership.objects.filter(user=user, role=MemberRole.ADMIN).exists()

    def test_create_group_sets_creator(self, auth_client, user):
        payload = {'name': 'Test Group', 'type': 'public'}
        res = auth_client.post('/api/community/groups/', payload, format='json')
        assert res.status_code == 201
        group = Group.objects.get(id=res.data['id'])
        assert group.creator == user

    def test_join_group(self, auth_client, user):
        other_user = UserFactory()
        group = GroupFactory(creator=other_user)
        res = auth_client.post(f'/api/community/groups/{group.id}/join/')
        assert res.status_code == 201
        assert Membership.objects.filter(user=user, group=group).exists()

    def test_join_group_already_member_returns_200(self, auth_client, user):
        other_user = UserFactory()
        group = GroupFactory(creator=other_user)
        Membership.objects.create(user=user, group=group)
        res = auth_client.post(f'/api/community/groups/{group.id}/join/')
        assert res.status_code == 200

    def test_leave_group(self, auth_client, user):
        other_user = UserFactory()
        group = GroupFactory(creator=other_user)
        Membership.objects.create(user=user, group=group)
        res = auth_client.post(f'/api/community/groups/{group.id}/leave/')
        assert res.status_code == 204
        assert not Membership.objects.filter(user=user, group=group).exists()

    def test_is_member_field_true_when_member(self, auth_client, user):
        other_user = UserFactory()
        group = GroupFactory(creator=other_user)
        Membership.objects.create(user=user, group=group)
        res = auth_client.get(f'/api/community/groups/{group.id}/')
        assert res.status_code == 200
        assert res.data['is_member'] is True

    def test_is_member_field_false_when_not_member(self, auth_client, user):
        other_user = UserFactory()
        group = GroupFactory(creator=other_user)
        res = auth_client.get(f'/api/community/groups/{group.id}/')
        assert res.status_code == 200
        assert res.data['is_member'] is False

    def test_member_count(self, auth_client, user):
        other_user = UserFactory()
        group = GroupFactory(creator=other_user)
        Membership.objects.create(user=user, group=group)
        Membership.objects.create(user=other_user, group=group)
        res = auth_client.get(f'/api/community/groups/{group.id}/')
        assert res.data['member_count'] == 2


# ─── PostViewSet tests ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPostViewSet:

    def test_create_post(self, auth_client, user):
        payload = {'content': 'Hello Diaspora!'}
        res = auth_client.post('/api/community/posts/', payload, format='json')
        assert res.status_code == 201
        assert res.data['content'] == 'Hello Diaspora!'
        assert res.data['author']['id'] == user.id

    def test_create_post_sets_author(self, auth_client, user):
        payload = {'content': 'Another post'}
        res = auth_client.post('/api/community/posts/', payload, format='json')
        post = Post.objects.get(id=res.data['id'])
        assert post.author == user

    def test_list_posts_all(self, auth_client):
        PostFactory.create_batch(5)
        res = auth_client.get('/api/community/posts/')
        assert res.status_code == 200
        assert res.data['count'] >= 5

    def test_list_posts_filtered_by_group(self, auth_client, user):
        group1 = GroupFactory(creator=user)
        group2 = GroupFactory(creator=user)
        PostFactory(author=user, group=group1)
        PostFactory(author=user, group=group1)
        PostFactory(author=user, group=group2)
        res = auth_client.get(f'/api/community/posts/?group={group1.id}')
        assert res.status_code == 200
        assert res.data['count'] == 2

    def test_create_post_unauthenticated_returns_401(self, api_client):
        res = api_client.post('/api/community/posts/', {'content': 'test'}, format='json')
        assert res.status_code == 401

    def test_post_comment_count(self, auth_client, user):
        post = PostFactory(author=user)
        CommentFactory.create_batch(3, post=post)
        res = auth_client.get(f'/api/community/posts/{post.id}/')
        assert res.data['comment_count'] == 3

    def test_post_reaction_count(self, auth_client, user):
        post = PostFactory(author=user)
        other1 = UserFactory()
        other2 = UserFactory()
        Reaction.objects.create(post=post, user=other1, type='like')
        Reaction.objects.create(post=post, user=other2, type='heart')
        res = auth_client.get(f'/api/community/posts/{post.id}/')
        assert res.data['reaction_count'] == 2


# ─── CommentViewSet tests ─────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCommentViewSet:

    def test_create_comment(self, auth_client, user):
        post = PostFactory(author=user)
        payload = {'post': post.id, 'content': 'Great post!'}
        res = auth_client.post('/api/community/comments/', payload, format='json')
        assert res.status_code == 201
        assert res.data['content'] == 'Great post!'
        assert res.data['author']['id'] == user.id

    def test_create_comment_sets_author(self, auth_client, user):
        post = PostFactory(author=user)
        payload = {'post': post.id, 'content': 'Nice!'}
        res = auth_client.post('/api/community/comments/', payload, format='json')
        comment = Comment.objects.get(id=res.data['id'])
        assert comment.author == user

    def test_list_comments_filtered_by_post(self, auth_client, user):
        post1 = PostFactory(author=user)
        post2 = PostFactory(author=user)
        CommentFactory.create_batch(3, post=post1)
        CommentFactory.create_batch(2, post=post2)
        res = auth_client.get(f'/api/community/comments/?post={post1.id}')
        assert res.status_code == 200
        assert res.data['count'] == 3

    def test_create_comment_unauthenticated_returns_401(self, api_client):
        res = api_client.post('/api/community/comments/', {'content': 'test', 'post': 1}, format='json')
        assert res.status_code == 401

    def test_delete_comment(self, auth_client, user):
        post = PostFactory(author=user)
        comment = CommentFactory(post=post, author=user)
        res = auth_client.delete(f'/api/community/comments/{comment.id}/')
        assert res.status_code == 204
        assert not Comment.objects.filter(id=comment.id).exists()


# ─── ReactionViewSet tests ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestReactionViewSet:

    def test_create_reaction(self, auth_client, user):
        other_user = UserFactory()
        post = PostFactory(author=other_user)
        payload = {'post': post.id, 'type': 'like'}
        res = auth_client.post('/api/community/reactions/', payload, format='json')
        assert res.status_code == 201
        assert res.data['type'] == 'like'
        assert res.data['user'] == user.id

    def test_create_reaction_sets_user(self, auth_client, user):
        other_user = UserFactory()
        post = PostFactory(author=other_user)
        payload = {'post': post.id, 'type': 'heart'}
        res = auth_client.post('/api/community/reactions/', payload, format='json')
        reaction = Reaction.objects.get(id=res.data['id'])
        assert reaction.user == user

    def test_duplicate_reaction_returns_400(self, auth_client, user):
        other_user = UserFactory()
        post = PostFactory(author=other_user)
        Reaction.objects.create(post=post, user=user, type='like')
        payload = {'post': post.id, 'type': 'like'}
        res = auth_client.post('/api/community/reactions/', payload, format='json')
        assert res.status_code == 400

    def test_create_reaction_unauthenticated_returns_401(self, api_client):
        res = api_client.post('/api/community/reactions/', {'post': 1, 'type': 'like'}, format='json')
        assert res.status_code == 401

    def test_delete_reaction(self, auth_client, user):
        other_user = UserFactory()
        post = PostFactory(author=other_user)
        reaction = Reaction.objects.create(post=post, user=user, type='like')
        res = auth_client.delete(f'/api/community/reactions/{reaction.id}/')
        assert res.status_code == 204
        assert not Reaction.objects.filter(id=reaction.id).exists()
