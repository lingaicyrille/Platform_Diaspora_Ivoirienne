import pytest
from rest_framework.test import APIClient

from apps.users.tests.conftest import UserFactory
from apps.business.models import Business, Review

BUSINESSES_URL = '/api/business/businesses/'
REVIEWS_URL = '/api/business/reviews/'


def business_detail_url(pk):
    return f'/api/business/businesses/{pk}/'


def verify_url(pk):
    return f'/api/business/businesses/{pk}/verify/'


def review_detail_url(pk):
    return f'/api/business/reviews/{pk}/'


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def other_user(db):
    return UserFactory()


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def business(db, user):
    return Business.objects.create(
        name='Maquis Abidjan',
        owner=user,
        category='restaurant',
        country='France',
        city='Paris',
    )


@pytest.mark.django_db
class TestBusinessViewSet:
    def test_list_businesses(self, auth_client, business):
        res = auth_client.get(BUSINESSES_URL)
        assert res.status_code == 200
        assert len(res.data['results']) == 1

    def test_create_business(self, auth_client, user):
        payload = {
            'name': 'Tech Côte d\'Ivoire',
            'category': 'tech',
            'country': 'France',
            'city': 'Lyon',
        }
        res = auth_client.post(BUSINESSES_URL, payload, format='json')
        assert res.status_code == 201
        assert res.data['name'] == 'Tech Côte d\'Ivoire'
        assert res.data['owner']['id'] == user.id

    def test_retrieve_business(self, auth_client, business):
        res = auth_client.get(business_detail_url(business.pk))
        assert res.status_code == 200
        assert res.data['id'] == business.pk
        assert res.data['name'] == business.name

    def test_filter_by_category(self, auth_client, user, db):
        Business.objects.create(name='Resto', owner=user, category='restaurant')
        Business.objects.create(name='TechCo', owner=user, category='tech')
        res = auth_client.get(BUSINESSES_URL + '?category=restaurant')
        assert res.status_code == 200
        assert all(b['category'] == 'restaurant' for b in res.data['results'])

    def test_filter_by_country(self, auth_client, user, db):
        Business.objects.create(name='BizFR', owner=user, country='France')
        Business.objects.create(name='BizCI', owner=user, country='Côte d\'Ivoire')
        res = auth_client.get(BUSINESSES_URL + '?country=France')
        assert res.status_code == 200
        assert all(b['country'].lower() == 'france' for b in res.data['results'])

    def test_unauthenticated_cannot_list(self, api_client):
        res = api_client.get(BUSINESSES_URL)
        assert res.status_code == 401

    def test_unauthenticated_cannot_create(self, api_client):
        res = api_client.post(BUSINESSES_URL, {'name': 'X'}, format='json')
        assert res.status_code == 401


@pytest.mark.django_db
class TestAverageRating:
    def test_average_rating_computed_correctly(self, auth_client, business, user, other_user, db):
        third_user = UserFactory()
        Review.objects.create(business=business, author=other_user, rating=4)
        Review.objects.create(business=business, author=third_user, rating=2)
        res = auth_client.get(business_detail_url(business.pk))
        assert res.status_code == 200
        assert res.data['average_rating'] == 3.0
        assert res.data['review_count'] == 2

    def test_average_rating_no_reviews(self, auth_client, business):
        res = auth_client.get(business_detail_url(business.pk))
        assert res.status_code == 200
        assert res.data['average_rating'] == 0
        assert res.data['review_count'] == 0


@pytest.mark.django_db
class TestReviewViewSet:
    def test_create_review(self, api_client, business, other_user, db):
        api_client.force_authenticate(user=other_user)
        payload = {'business': business.pk, 'rating': 5, 'comment': 'Excellent!'}
        res = api_client.post(REVIEWS_URL, payload, format='json')
        assert res.status_code == 201
        assert res.data['rating'] == 5
        assert res.data['author']['id'] == other_user.id

    def test_cannot_review_own_business(self, auth_client, business, user):
        payload = {'business': business.pk, 'rating': 4, 'comment': 'Self review'}
        res = auth_client.post(REVIEWS_URL, payload, format='json')
        assert res.status_code == 400

    def test_duplicate_review_blocked(self, api_client, business, other_user, db):
        api_client.force_authenticate(user=other_user)
        Review.objects.create(business=business, author=other_user, rating=3)
        payload = {'business': business.pk, 'rating': 5, 'comment': 'Again'}
        res = api_client.post(REVIEWS_URL, payload, format='json')
        assert res.status_code == 400

    def test_unauthenticated_cannot_review(self, api_client, business):
        payload = {'business': business.pk, 'rating': 3}
        res = api_client.post(REVIEWS_URL, payload, format='json')
        assert res.status_code == 401

    def test_filter_reviews_by_business(self, api_client, business, other_user, db):
        api_client.force_authenticate(user=other_user)
        Review.objects.create(business=business, author=other_user, rating=4)
        res = api_client.get(REVIEWS_URL + f'?business={business.pk}')
        assert res.status_code == 200
        assert all(r['business'] == business.pk for r in res.data['results'])
