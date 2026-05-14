import pytest
from rest_framework.test import APIClient

# Use the same UserFactory as users/tests/conftest.py so sequence counters are shared
from apps.users.tests.conftest import UserFactory  # noqa: F401  (re-exported for other tests)


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
