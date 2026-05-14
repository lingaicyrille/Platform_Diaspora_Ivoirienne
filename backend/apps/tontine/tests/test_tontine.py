import pytest
from datetime import date, timedelta
from apps.users.tests.conftest import UserFactory
from apps.tontine.models import Tontine, TontineMembership

URL = '/api/tontine/tontines/'


def _tontine(organizer, **kwargs):
    kwargs.setdefault('max_members', 5)
    return Tontine.objects.create(
        name='Test Tontine',
        organizer=organizer,
        contribution_amount='50.00',
        frequency='monthly',
        start_date=date.today(),
        **kwargs,
    )


@pytest.mark.django_db
class TestTontineList:
    def test_list_tontines(self, auth_client, user):
        _tontine(user)
        res = auth_client.get(URL)
        assert res.status_code == 200
        assert res.data['count'] >= 1

    def test_unauthenticated_denied(self, api_client):
        res = api_client.get(URL)
        assert res.status_code == 401


@pytest.mark.django_db
class TestTontineCreate:
    def test_create_tontine(self, auth_client, user):
        res = auth_client.post(URL, {
            'name': 'My Tontine',
            'contribution_amount': '100.00',
            'frequency': 'monthly',
            'start_date': str(date.today()),
            'max_members': 10,
        }, format='json')
        assert res.status_code == 201
        t = Tontine.objects.get(name='My Tontine')
        assert t.organizer == user
        assert TontineMembership.objects.filter(tontine=t, member=user).exists()


@pytest.mark.django_db
class TestTontineJoinLeave:
    def test_join_tontine(self, auth_client, user):
        organizer = UserFactory()
        t = _tontine(organizer)
        res = auth_client.post(f'{URL}{t.id}/join/')
        assert res.status_code == 200
        assert TontineMembership.objects.filter(tontine=t, member=user).exists()

    def test_cannot_join_twice(self, auth_client, user):
        organizer = UserFactory()
        t = _tontine(organizer)
        TontineMembership.objects.create(tontine=t, member=user, position=2)
        res = auth_client.post(f'{URL}{t.id}/join/')
        assert res.status_code == 400

    def test_cannot_join_full_tontine(self, auth_client, user):
        organizer = UserFactory()
        t = _tontine(organizer, max_members=1)
        TontineMembership.objects.create(tontine=t, member=organizer, position=1)
        res = auth_client.post(f'{URL}{t.id}/join/')
        assert res.status_code == 400

    def test_leave_tontine(self, auth_client, user):
        organizer = UserFactory()
        t = _tontine(organizer)
        TontineMembership.objects.create(tontine=t, member=user, position=2)
        res = auth_client.post(f'{URL}{t.id}/leave/')
        assert res.status_code == 200
        assert not TontineMembership.objects.filter(tontine=t, member=user).exists()

    def test_organizer_cannot_leave(self, auth_client, user):
        t = _tontine(user)
        res = auth_client.post(f'{URL}{t.id}/leave/')
        assert res.status_code == 400
