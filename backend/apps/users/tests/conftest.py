import factory
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f'user{n}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    country_of_residence = 'France'
    city = 'Paris'
    continent = 'EU'
    preferred_language = 'fr'
    is_active = True

    @factory.post_generation
    def password(obj, create, extracted, **kwargs):
        raw = extracted or 'testpass123'
        obj.set_password(raw)
        if create:
            obj.save()


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


@pytest.fixture
def user_payload():
    return {
        'email': 'nouveau@example.com',
        'password': 'motdepasse123',
        'password_confirm': 'motdepasse123',
        'first_name': 'Kouamé',
        'last_name': 'Diallo',
        'country_of_residence': 'France',
        'city': 'Paris',
        'continent': 'EU',
        'preferred_language': 'fr',
    }
