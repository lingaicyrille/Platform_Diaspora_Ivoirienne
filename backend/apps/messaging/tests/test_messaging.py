import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.tests.conftest import UserFactory
from apps.messaging.models import Conversation, Message


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
def conversation(db, user, other_user):
    conv = Conversation.objects.create()
    conv.participants.add(user, other_user)
    return conv


# ── ConversationViewSet ────────────────────────────────────────────────────


@pytest.mark.django_db
def test_create_conversation(auth_client, user, other_user):
    payload = {'participant_ids': [other_user.pk]}
    response = auth_client.post('/api/messaging/conversations/', payload, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    conv_id = response.data['id']
    conv = Conversation.objects.get(pk=conv_id)
    participant_ids = list(conv.participants.values_list('id', flat=True))
    assert user.pk in participant_ids
    assert other_user.pk in participant_ids


@pytest.mark.django_db
def test_list_only_own_conversations(api_client, db):
    owner = UserFactory()
    stranger = UserFactory()

    own_conv = Conversation.objects.create()
    own_conv.participants.add(owner)

    other_conv = Conversation.objects.create()
    other_conv.participants.add(stranger)

    api_client.force_authenticate(user=owner)
    response = api_client.get('/api/messaging/conversations/')

    assert response.status_code == status.HTTP_200_OK
    ids = [c['id'] for c in response.data['results']]
    assert own_conv.pk in ids
    assert other_conv.pk not in ids


# ── send action ────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_send_creates_message(auth_client, user, conversation):
    url = f'/api/messaging/conversations/{conversation.pk}/send/'
    response = auth_client.post(url, {'content': 'Bonjour !'}, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    assert Message.objects.filter(conversation=conversation, sender=user).exists()
    msg = Message.objects.get(conversation=conversation, sender=user)
    assert msg.content == 'Bonjour !'
    # sender is auto-marked as read
    assert msg.read_by.filter(pk=user.pk).exists()


@pytest.mark.django_db
def test_send_empty_content_rejected(auth_client, conversation):
    url = f'/api/messaging/conversations/{conversation.pk}/send/'
    response = auth_client.post(url, {'content': '   '}, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ── permission checks ──────────────────────────────────────────────────────


@pytest.mark.django_db
def test_user_cannot_access_other_conversation(api_client, db, conversation):
    outsider = UserFactory()
    api_client.force_authenticate(user=outsider)

    response = api_client.get(f'/api/messaging/conversations/{conversation.pk}/')
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_unauthenticated_returns_401(api_client, db):
    response = api_client.get('/api/messaging/conversations/')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
