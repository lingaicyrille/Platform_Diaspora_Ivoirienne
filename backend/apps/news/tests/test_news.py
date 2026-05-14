import pytest
from apps.users.tests.conftest import UserFactory
from apps.news.models import Article, Tag

URL = '/api/news/articles/'
TAGS_URL = '/api/news/tags/'


class TagFactory:
    @staticmethod
    def create(name='test-tag'):
        return Tag.objects.create(name=name)


@pytest.mark.django_db
class TestArticleList:
    def test_list_published_only(self, auth_client):
        user = UserFactory()
        Article.objects.create(title='Published', content='x', author=user,
                               category='culture', is_published=True)
        Article.objects.create(title='Draft', content='y', author=user,
                               category='culture', is_published=False)
        res = auth_client.get(URL + '?published=true')
        assert res.status_code == 200
        titles = [a['title'] for a in res.data['results']]
        assert 'Published' in titles
        assert 'Draft' not in titles

    def test_filter_by_category(self, auth_client):
        user = UserFactory()
        Article.objects.create(title='Sports Art', content='x', author=user,
                               category='sports', is_published=True)
        Article.objects.create(title='Culture Art', content='x', author=user,
                               category='culture', is_published=True)
        res = auth_client.get(URL + '?category=sports&published=true')
        assert res.status_code == 200
        for a in res.data['results']:
            assert a['category'] == 'sports'

    def test_unauthenticated_denied(self, api_client):
        res = api_client.get(URL)
        assert res.status_code == 401


@pytest.mark.django_db
class TestArticleCreate:
    def test_create_article(self, auth_client, user):
        res = auth_client.post(URL, {
            'title': 'New Article', 'content': 'Body text',
            'category': 'tech', 'is_published': False,
        }, format='json')
        assert res.status_code == 201
        assert Article.objects.filter(title='New Article', author=user).exists()

    def test_publish_action_requires_admin(self, auth_client, user):
        article = Article.objects.create(title='Draft', content='x',
                                         author=user, category='tech')
        res = auth_client.post(f'{URL}{article.id}/publish/')
        assert res.status_code == 403


@pytest.mark.django_db
class TestTagEndpoint:
    def test_tag_list(self, auth_client):
        Tag.objects.create(name='diaspora')
        Tag.objects.create(name='abidjan')
        res = auth_client.get(TAGS_URL)
        assert res.status_code == 200
        names = [t['name'] for t in res.data['results']]
        assert 'diaspora' in names
