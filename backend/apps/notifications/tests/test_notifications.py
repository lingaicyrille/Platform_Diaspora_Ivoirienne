import pytest
from apps.users.tests.conftest import UserFactory
from apps.notifications.models import Notification

URL = '/api/notifications/'


def _notif(recipient, **kwargs):
    return Notification.objects.create(
        recipient=recipient, title='Test', type='general', **kwargs
    )


@pytest.mark.django_db
class TestNotificationList:
    def test_list_own_notifications(self, auth_client, user):
        other = UserFactory()
        _notif(user)
        _notif(other)
        res = auth_client.get(URL)
        assert res.status_code == 200
        for n in res.data['results']:
            assert n['title'] == 'Test'
        assert res.data['count'] == 1

    def test_unread_filter(self, auth_client, user):
        _notif(user, is_read=False)
        _notif(user, is_read=True)
        res = auth_client.get(URL + '?unread=true')
        assert res.status_code == 200
        assert res.data['count'] == 1
        assert res.data['results'][0]['is_read'] is False


@pytest.mark.django_db
class TestNotificationActions:
    def test_mark_read(self, auth_client, user):
        n = _notif(user, is_read=False)
        res = auth_client.post(f'{URL}{n.id}/read/')
        assert res.status_code == 200
        n.refresh_from_db()
        assert n.is_read is True

    def test_mark_all_read(self, auth_client, user):
        _notif(user, is_read=False)
        _notif(user, is_read=False)
        res = auth_client.post(URL + 'read-all/')
        assert res.status_code == 200
        assert Notification.objects.filter(recipient=user, is_read=False).count() == 0

    def test_unread_count(self, auth_client, user):
        _notif(user, is_read=False)
        _notif(user, is_read=False)
        _notif(user, is_read=True)
        res = auth_client.get(URL + 'unread-count/')
        assert res.status_code == 200
        assert res.data['count'] == 2

    def test_delete_notification(self, auth_client, user):
        n = _notif(user)
        res = auth_client.delete(f'{URL}{n.id}/')
        assert res.status_code == 204
        assert not Notification.objects.filter(pk=n.id).exists()
