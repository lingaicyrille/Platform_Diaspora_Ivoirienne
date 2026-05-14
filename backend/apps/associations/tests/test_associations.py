import pytest
from rest_framework.test import APIClient

from apps.users.tests.conftest import UserFactory
from apps.associations.models import Association, AssociationMember, MemberRole

ASSOC_LIST_URL = '/api/associations/associations/'


def assoc_detail_url(pk):
    return f'/api/associations/associations/{pk}/'


def join_url(pk):
    return f'/api/associations/associations/{pk}/join/'


def leave_url(pk):
    return f'/api/associations/associations/{pk}/leave/'


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
def assoc_payload():
    return {
        'name': 'Diaspora Culturelle Paris',
        'description': 'Association culturelle ivoirienne à Paris.',
        'category': 'cultural',
        'country': 'France',
        'city': 'Paris',
    }


# ── LIST ──────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAssociationList:
    def test_list_returns_200(self, auth_client):
        res = auth_client.get(ASSOC_LIST_URL)
        assert res.status_code == 200

    def test_unauthenticated_returns_401(self, api_client):
        res = api_client.get(ASSOC_LIST_URL)
        assert res.status_code == 401

    def test_list_contains_created_association(self, auth_client, user, assoc_payload):
        auth_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        res = auth_client.get(ASSOC_LIST_URL)
        assert res.data['count'] >= 1

    def test_filter_by_category(self, auth_client, assoc_payload):
        auth_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        res = auth_client.get(ASSOC_LIST_URL + '?category=cultural')
        assert res.status_code == 200
        for item in res.data['results']:
            assert item['category'] == 'cultural'

    def test_filter_by_country(self, auth_client, assoc_payload):
        auth_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        res = auth_client.get(ASSOC_LIST_URL + '?country=France')
        assert res.status_code == 200
        for item in res.data['results']:
            assert item['country'] == 'France'


# ── CREATE ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAssociationCreate:
    def test_create_returns_201(self, auth_client, assoc_payload):
        res = auth_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assert res.status_code == 201

    def test_unauthenticated_create_returns_401(self, api_client, assoc_payload):
        res = api_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assert res.status_code == 401

    def test_creator_is_auto_joined_as_president(self, auth_client, user, assoc_payload):
        res = auth_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assert res.status_code == 201
        assoc_id = res.data['id']
        membership = AssociationMember.objects.get(association_id=assoc_id, user=user)
        assert membership.role == MemberRole.PRESIDENT

    def test_member_count_is_1_after_create(self, auth_client, assoc_payload):
        res = auth_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assert res.data['member_count'] == 1

    def test_is_member_true_for_creator(self, auth_client, assoc_payload):
        res = auth_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assert res.data['is_member'] is True

    def test_created_by_is_request_user(self, auth_client, user, assoc_payload):
        res = auth_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assert res.data['created_by']['id'] == user.id


# ── JOIN ──────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAssociationJoin:
    def test_join_returns_201_on_first_join(self, auth_client, user, other_user, assoc_payload):
        # other_user creates the association
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        create_res = other_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assoc_id = create_res.data['id']

        res = auth_client.post(join_url(assoc_id))
        assert res.status_code == 201

    def test_join_returns_200_on_second_join(self, auth_client, user, other_user, assoc_payload):
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        create_res = other_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assoc_id = create_res.data['id']

        auth_client.post(join_url(assoc_id))
        res = auth_client.post(join_url(assoc_id))
        assert res.status_code == 200

    def test_join_increments_member_count(self, auth_client, user, other_user, assoc_payload):
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        create_res = other_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assoc_id = create_res.data['id']

        auth_client.post(join_url(assoc_id))
        res = auth_client.get(assoc_detail_url(assoc_id))
        assert res.data['member_count'] == 2

    def test_unauthenticated_join_returns_401(self, api_client, user, assoc_payload):
        client = APIClient()
        client.force_authenticate(user=user)
        create_res = client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assoc_id = create_res.data['id']

        res = api_client.post(join_url(assoc_id))
        assert res.status_code == 401

    def test_join_sets_role_as_member(self, auth_client, user, other_user, assoc_payload):
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        create_res = other_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assoc_id = create_res.data['id']

        auth_client.post(join_url(assoc_id))
        membership = AssociationMember.objects.get(association_id=assoc_id, user=user)
        assert membership.role == MemberRole.MEMBER


# ── LEAVE ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAssociationLeave:
    def test_leave_returns_204(self, auth_client, user, other_user, assoc_payload):
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        create_res = other_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assoc_id = create_res.data['id']

        auth_client.post(join_url(assoc_id))
        res = auth_client.post(leave_url(assoc_id))
        assert res.status_code == 204

    def test_leave_removes_membership(self, auth_client, user, other_user, assoc_payload):
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        create_res = other_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assoc_id = create_res.data['id']

        auth_client.post(join_url(assoc_id))
        auth_client.post(leave_url(assoc_id))
        assert not AssociationMember.objects.filter(association_id=assoc_id, user=user).exists()

    def test_leave_when_not_member_returns_400(self, auth_client, user, other_user, assoc_payload):
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        create_res = other_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assoc_id = create_res.data['id']

        res = auth_client.post(leave_url(assoc_id))
        assert res.status_code == 400

    def test_leave_decrements_member_count(self, auth_client, user, other_user, assoc_payload):
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        create_res = other_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assoc_id = create_res.data['id']

        auth_client.post(join_url(assoc_id))
        auth_client.post(leave_url(assoc_id))
        res = auth_client.get(assoc_detail_url(assoc_id))
        assert res.data['member_count'] == 1


# ── MEMBER COUNT ──────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMemberCount:
    def test_member_count_reflects_actual_members(self, db, assoc_payload):
        creator = UserFactory()
        extra1 = UserFactory()
        extra2 = UserFactory()

        creator_client = APIClient()
        creator_client.force_authenticate(user=creator)
        create_res = creator_client.post(ASSOC_LIST_URL, assoc_payload, format='json')
        assoc_id = create_res.data['id']

        for u in [extra1, extra2]:
            c = APIClient()
            c.force_authenticate(user=u)
            c.post(join_url(assoc_id))

        res = creator_client.get(assoc_detail_url(assoc_id))
        assert res.data['member_count'] == 3
