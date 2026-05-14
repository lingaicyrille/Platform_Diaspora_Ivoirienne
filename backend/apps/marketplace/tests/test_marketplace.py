import pytest
from rest_framework.test import APIClient

from apps.users.tests.conftest import UserFactory
from apps.marketplace.models import Listing, Offer, OfferStatus

LISTINGS_URL = '/api/marketplace/listings/'
OFFERS_URL = '/api/marketplace/offers/'


def listing_detail_url(pk):
    return f'/api/marketplace/listings/{pk}/'


def make_offer_url(pk):
    return f'/api/marketplace/listings/{pk}/make_offer/'


def offer_detail_url(pk):
    return f'/api/marketplace/offers/{pk}/'


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
def listing(db, user):
    return Listing.objects.create(
        title='iPhone 14',
        seller=user,
        description='Almost new phone.',
        price='500.00',
        category='electronics',
        condition='used',
    )


@pytest.mark.django_db
class TestListingViewSet:
    def test_list_listings(self, auth_client, listing):
        res = auth_client.get(LISTINGS_URL)
        assert res.status_code == 200
        assert len(res.data['results']) == 1

    def test_create_listing(self, auth_client, user):
        payload = {
            'title': 'Chaussures Nike',
            'description': 'Pointure 42',
            'price': '60.00',
            'category': 'clothing',
            'condition': 'new',
        }
        res = auth_client.post(LISTINGS_URL, payload, format='json')
        assert res.status_code == 201
        assert res.data['title'] == 'Chaussures Nike'
        assert res.data['seller']['id'] == user.id

    def test_filter_by_category(self, auth_client, user, db):
        Listing.objects.create(
            title='Laptop', seller=user, description='Good', price='800.00', category='electronics'
        )
        Listing.objects.create(
            title='Sofa', seller=user, description='Comfortable', price='200.00', category='furniture'
        )
        res = auth_client.get(LISTINGS_URL + '?category=electronics')
        assert res.status_code == 200
        assert all(l['category'] == 'electronics' for l in res.data['results'])

    def test_filter_by_condition(self, auth_client, user, db):
        Listing.objects.create(
            title='New TV', seller=user, description='Brand new', price='400.00', condition='new'
        )
        Listing.objects.create(
            title='Old Bike', seller=user, description='Used', price='80.00', condition='used'
        )
        res = auth_client.get(LISTINGS_URL + '?condition=new')
        assert res.status_code == 200
        assert all(l['condition'] == 'new' for l in res.data['results'])

    def test_unauthenticated_cannot_list(self, api_client):
        res = api_client.get(LISTINGS_URL)
        assert res.status_code == 401

    def test_unauthenticated_cannot_create(self, api_client):
        res = api_client.post(LISTINGS_URL, {'title': 'X', 'description': 'Y', 'price': '10.00'}, format='json')
        assert res.status_code == 401


@pytest.mark.django_db
class TestMakeOfferAction:
    def test_create_offer(self, api_client, listing, other_user, db):
        api_client.force_authenticate(user=other_user)
        payload = {'amount': '450.00', 'message': 'Is this still available?'}
        res = api_client.post(make_offer_url(listing.pk), payload, format='json')
        assert res.status_code == 201
        assert res.data['buyer']['id'] == other_user.id
        assert res.data['listing'] == listing.pk

    def test_seller_cannot_offer_own_listing(self, auth_client, listing, user):
        payload = {'amount': '490.00', 'message': 'Self offer'}
        res = auth_client.post(make_offer_url(listing.pk), payload, format='json')
        assert res.status_code == 400

    def test_unauthenticated_cannot_make_offer(self, api_client, listing):
        payload = {'amount': '300.00'}
        res = api_client.post(make_offer_url(listing.pk), payload, format='json')
        assert res.status_code == 401


@pytest.mark.django_db
class TestOfferViewSet:
    def test_owner_can_accept_offer(self, api_client, listing, other_user, user, db):
        offer = Offer.objects.create(listing=listing, buyer=other_user, amount='480.00')
        api_client.force_authenticate(user=user)
        res = api_client.patch(offer_detail_url(offer.pk), {'status': 'accepted'}, format='json')
        assert res.status_code == 200
        assert res.data['status'] == 'accepted'

    def test_buyer_cannot_patch_status(self, api_client, listing, other_user, db):
        offer = Offer.objects.create(listing=listing, buyer=other_user, amount='480.00')
        api_client.force_authenticate(user=other_user)
        res = api_client.patch(offer_detail_url(offer.pk), {'status': 'accepted'}, format='json')
        assert res.status_code == 403

    def test_unauthenticated_cannot_list_offers(self, api_client):
        res = api_client.get(OFFERS_URL)
        assert res.status_code == 401

    def test_filter_offers_by_listing(self, api_client, listing, other_user, user, db):
        offer = Offer.objects.create(listing=listing, buyer=other_user, amount='300.00')
        api_client.force_authenticate(user=user)
        res = api_client.get(OFFERS_URL + f'?listing={listing.pk}')
        assert res.status_code == 200
        assert all(o['listing'] == listing.pk for o in res.data['results'])
