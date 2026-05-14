import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()
URL = '/api/users/register/'


@pytest.mark.django_db
class TestRegisterView:
    def test_register_success(self, api_client, user_payload):
        res = api_client.post(URL, user_payload, format='json')
        assert res.status_code == 201
        assert User.objects.filter(email=user_payload['email']).exists()

    def test_register_returns_no_password(self, api_client, user_payload):
        res = api_client.post(URL, user_payload, format='json')
        assert 'password' not in res.data

    def test_register_password_mismatch(self, api_client, user_payload):
        user_payload['password_confirm'] = 'wrongpassword'
        res = api_client.post(URL, user_payload, format='json')
        assert res.status_code == 400
        assert 'password_confirm' in res.data

    def test_register_password_too_short(self, api_client, user_payload):
        user_payload['password'] = '123'
        user_payload['password_confirm'] = '123'
        res = api_client.post(URL, user_payload, format='json')
        assert res.status_code == 400

    def test_register_duplicate_email(self, api_client, user_payload, user):
        user_payload['email'] = user.email
        res = api_client.post(URL, user_payload, format='json')
        assert res.status_code == 400

    def test_register_missing_email(self, api_client, user_payload):
        del user_payload['email']
        res = api_client.post(URL, user_payload, format='json')
        assert res.status_code == 400
        assert 'email' in res.data

    def test_register_missing_first_name(self, api_client, user_payload):
        del user_payload['first_name']
        res = api_client.post(URL, user_payload, format='json')
        assert res.status_code == 400

    def test_register_email_is_normalized(self, api_client, user_payload):
        user_payload['email'] = 'TEST@EXAMPLE.COM'
        res = api_client.post(URL, user_payload, format='json')
        assert res.status_code == 201
        assert User.objects.filter(email='TEST@example.com').exists()
