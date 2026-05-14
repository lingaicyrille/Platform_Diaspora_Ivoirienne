import pytest
from .conftest import UserFactory

URL = '/api/users/login/'


@pytest.mark.django_db
class TestLoginView:
    def test_login_success(self, api_client, db):
        user = UserFactory(email='test@example.com', password='pass1234!')
        res = api_client.post(URL, {'email': 'test@example.com', 'password': 'pass1234!'}, format='json')
        assert res.status_code == 200
        assert 'access' in res.data
        assert 'refresh' in res.data

    def test_login_returns_user_data(self, api_client, db):
        user = UserFactory(email='test@example.com', password='pass1234!')
        res = api_client.post(URL, {'email': 'test@example.com', 'password': 'pass1234!'}, format='json')
        assert res.status_code == 200
        assert 'user' in res.data
        assert res.data['user']['email'] == 'test@example.com'

    def test_login_wrong_password(self, api_client, db):
        UserFactory(email='test@example.com', password='correctpass')
        res = api_client.post(URL, {'email': 'test@example.com', 'password': 'wrongpass'}, format='json')
        assert res.status_code == 401

    def test_login_unknown_email(self, api_client, db):
        res = api_client.post(URL, {'email': 'ghost@example.com', 'password': 'anypass'}, format='json')
        assert res.status_code == 401

    def test_login_missing_fields(self, api_client, db):
        res = api_client.post(URL, {'email': 'test@example.com'}, format='json')
        assert res.status_code == 400

    def test_login_inactive_user(self, api_client, db):
        user = UserFactory(email='inactive@example.com', password='pass1234!', is_active=False)
        res = api_client.post(URL, {'email': 'inactive@example.com', 'password': 'pass1234!'}, format='json')
        assert res.status_code == 401

    def test_token_refresh(self, api_client, db):
        UserFactory(email='test@example.com', password='pass1234!')
        login_res = api_client.post(URL, {'email': 'test@example.com', 'password': 'pass1234!'}, format='json')
        refresh = login_res.data['refresh']
        res = api_client.post('/api/users/token/refresh/', {'refresh': refresh}, format='json')
        assert res.status_code == 200
        assert 'access' in res.data
