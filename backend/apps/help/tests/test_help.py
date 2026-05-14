import pytest
from apps.users.tests.conftest import UserFactory
from apps.help.models import HelpRequest, HelpOffer

URL = '/api/help/requests/'


def _payload(**kwargs):
    return {'title': 'Need help', 'description': 'Details here',
            'category': 'housing', 'urgency': 'medium', **kwargs}


@pytest.mark.django_db
class TestHelpRequestList:
    def test_list_open_requests(self, auth_client):
        res = auth_client.get(URL)
        assert res.status_code == 200

    def test_filter_by_urgency(self, auth_client, user):
        HelpRequest.objects.create(requester=user, title='High', description='x',
                                   category='housing', urgency='high')
        HelpRequest.objects.create(requester=user, title='Low', description='x',
                                   category='housing', urgency='low')
        res = auth_client.get(URL + '?urgency=high')
        assert res.status_code == 200
        for r in res.data['results']:
            assert r['urgency'] == 'high'

    def test_mine_filter(self, auth_client, user):
        other = UserFactory()
        HelpRequest.objects.create(requester=user, title='Mine', description='x',
                                   category='housing', urgency='low')
        HelpRequest.objects.create(requester=other, title='Other', description='x',
                                   category='housing', urgency='low')
        res = auth_client.get(URL + '?mine=true')
        assert res.status_code == 200
        for r in res.data['results']:
            assert r['requester']['id'] == user.id


@pytest.mark.django_db
class TestHelpRequestCreate:
    def test_create(self, auth_client, user):
        res = auth_client.post(URL, _payload(), format='json')
        assert res.status_code == 201
        assert HelpRequest.objects.filter(requester=user).exists()


@pytest.mark.django_db
class TestHelpOffer:
    def test_offer_on_others_request(self, auth_client):
        other = UserFactory()
        req = HelpRequest.objects.create(requester=other, title='Need', description='x',
                                         category='housing', urgency='low')
        res = auth_client.post(f'{URL}{req.id}/offer/', {'message': 'I can help'}, format='json')
        assert res.status_code == 201

    def test_cannot_offer_own_request(self, auth_client, user):
        req = HelpRequest.objects.create(requester=user, title='Mine', description='x',
                                         category='housing', urgency='low')
        res = auth_client.post(f'{URL}{req.id}/offer/', {'message': 'I can help'}, format='json')
        assert res.status_code == 400

    def test_no_duplicate_offers(self, auth_client, user):
        other = UserFactory()
        req = HelpRequest.objects.create(requester=other, title='Need', description='x',
                                         category='housing', urgency='low')
        auth_client.post(f'{URL}{req.id}/offer/', {'message': 'First offer'}, format='json')
        res = auth_client.post(f'{URL}{req.id}/offer/', {'message': 'Second offer'}, format='json')
        assert res.status_code == 400


@pytest.mark.django_db
class TestHelpResolve:
    def test_requester_can_resolve(self, auth_client, user):
        req = HelpRequest.objects.create(requester=user, title='Mine', description='x',
                                         category='housing', urgency='low')
        res = auth_client.post(f'{URL}{req.id}/resolve/')
        assert res.status_code == 200
        req.refresh_from_db()
        assert req.status == 'resolved'

    def test_non_requester_cannot_resolve(self, auth_client):
        other = UserFactory()
        req = HelpRequest.objects.create(requester=other, title='Other', description='x',
                                         category='housing', urgency='low')
        res = auth_client.post(f'{URL}{req.id}/resolve/')
        assert res.status_code == 403
