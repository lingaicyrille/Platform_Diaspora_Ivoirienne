import pytest
from .conftest import UserFactory

URL = '/api/users/me/'


@pytest.mark.django_db
class TestProfileView:
    def test_get_profile_authenticated(self, auth_client, user):
        res = auth_client.get(URL)
        assert res.status_code == 200
        assert res.data['email'] == user.email
        assert res.data['first_name'] == user.first_name

    def test_get_profile_unauthenticated(self, api_client):
        res = api_client.get(URL)
        assert res.status_code == 401

    def test_profile_contains_expected_fields(self, auth_client, user):
        res = auth_client.get(URL)
        expected = {'id', 'email', 'first_name', 'last_name', 'full_name',
                    'phone', 'bio', 'country_of_residence', 'city',
                    'continent', 'preferred_language', 'is_verified', 'trust_score', 'date_joined'}
        assert expected.issubset(res.data.keys())

    def test_profile_does_not_expose_password(self, auth_client):
        res = auth_client.get(URL)
        assert 'password' not in res.data

    def test_patch_profile_success(self, auth_client, user):
        res = auth_client.patch(URL, {'city': 'Lyon', 'bio': 'Ivoirien à Lyon'}, format='json')
        assert res.status_code == 200
        assert res.data['city'] == 'Lyon'
        assert res.data['bio'] == 'Ivoirien à Lyon'

    def test_patch_profile_unauthenticated(self, api_client):
        res = api_client.patch(URL, {'city': 'Lyon'}, format='json')
        assert res.status_code == 401

    def test_patch_cannot_change_trust_score(self, auth_client, user):
        res = auth_client.patch(URL, {'trust_score': 999}, format='json')
        assert res.status_code == 200
        assert res.data['trust_score'] == user.trust_score

    def test_patch_cannot_change_is_verified(self, auth_client, user):
        res = auth_client.patch(URL, {'is_verified': True}, format='json')
        assert res.status_code == 200
        assert res.data['is_verified'] == user.is_verified

    def test_full_name_property(self, auth_client, user):
        res = auth_client.get(URL)
        assert res.data['full_name'] == f'{user.first_name} {user.last_name}'
