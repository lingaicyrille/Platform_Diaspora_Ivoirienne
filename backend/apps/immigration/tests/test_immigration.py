import pytest
from apps.users.tests.conftest import UserFactory
from apps.immigration.models import Country, ImmigrationGuide, ImmigrationQuestion

COUNTRIES_URL = '/api/immigration/countries/'
GUIDES_URL = '/api/immigration/guides/'
QUESTIONS_URL = '/api/immigration/questions/'


def _country(**kwargs):
    return Country.objects.create(name='France', code='FR', **kwargs)


@pytest.mark.django_db
class TestCountryList:
    def test_list_countries(self, auth_client):
        _country()
        res = auth_client.get(COUNTRIES_URL)
        assert res.status_code == 200
        assert res.data['count'] >= 1

    def test_filter_by_code(self, auth_client):
        _country()
        Country.objects.create(name='Germany', code='DE')
        res = auth_client.get(COUNTRIES_URL + '?code=FR')
        assert res.status_code == 200
        for c in res.data['results']:
            assert c['code'].upper() == 'FR'

    def test_unauthenticated_can_list(self, api_client):
        res = api_client.get(COUNTRIES_URL)
        assert res.status_code == 200


@pytest.mark.django_db
class TestImmigrationGuides:
    def test_list_guides(self, auth_client):
        country = _country()
        ImmigrationGuide.objects.create(
            country=country, title='Visa Guide', content='Details', category='visa'
        )
        res = auth_client.get(GUIDES_URL)
        assert res.status_code == 200
        assert res.data['count'] >= 1

    def test_filter_by_country(self, auth_client):
        c1 = _country()
        c2 = Country.objects.create(name='Germany', code='DE')
        ImmigrationGuide.objects.create(country=c1, title='FR Visa', content='x', category='visa')
        ImmigrationGuide.objects.create(country=c2, title='DE Visa', content='x', category='visa')
        res = auth_client.get(GUIDES_URL + f'?country={c1.id}')
        assert res.status_code == 200
        for g in res.data['results']:
            assert g['country'] == c1.id

    def test_filter_by_category(self, auth_client):
        country = _country()
        ImmigrationGuide.objects.create(country=country, title='Visa', content='x', category='visa')
        ImmigrationGuide.objects.create(country=country, title='Work', content='x', category='work')
        res = auth_client.get(GUIDES_URL + '?category=visa')
        assert res.status_code == 200
        for g in res.data['results']:
            assert g['category'] == 'visa'

    def test_create_requires_admin(self, auth_client):
        country = _country()
        res = auth_client.post(GUIDES_URL, {
            'country': country.id, 'title': 'New', 'content': 'x', 'category': 'visa'
        }, format='json')
        assert res.status_code == 403


@pytest.mark.django_db
class TestImmigrationQA:
    def test_create_question(self, auth_client, user):
        country = _country()
        res = auth_client.post(QUESTIONS_URL, {
            'country': country.id, 'content': 'How to apply for a visa?'
        }, format='json')
        assert res.status_code == 201
        assert ImmigrationQuestion.objects.filter(user=user).exists()

    def test_answer_question(self, auth_client, user):
        other = UserFactory()
        country = _country()
        q = ImmigrationQuestion.objects.create(user=other, country=country, content='Question?')
        res = auth_client.post(f'{QUESTIONS_URL}{q.id}/answer/', {'content': 'Answer!', 'question': q.id}, format='json')
        assert res.status_code == 201
        q.refresh_from_db()
        assert q.is_answered is True

    def test_filter_questions_by_country(self, auth_client, user):
        c1 = _country()
        c2 = Country.objects.create(name='Germany', code='DE')
        ImmigrationQuestion.objects.create(user=user, country=c1, content='Q1')
        ImmigrationQuestion.objects.create(user=user, country=c2, content='Q2')
        res = auth_client.get(QUESTIONS_URL + f'?country={c1.id}')
        assert res.status_code == 200
        for q in res.data['results']:
            assert q['country'] == c1.id
