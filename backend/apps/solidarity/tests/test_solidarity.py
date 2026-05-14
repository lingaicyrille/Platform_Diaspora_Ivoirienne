import pytest
from apps.users.tests.conftest import UserFactory
from apps.solidarity.models import SolidarityFund, SolidarityContribution

URL = '/api/solidarity/funds/'


def _fund(creator, **kwargs):
    kwargs.setdefault('category', 'medical')
    kwargs.setdefault('status', 'active')
    kwargs.setdefault('title', 'Test Fund')
    return SolidarityFund.objects.create(
        creator=creator,
        description='Help needed',
        target_amount='1000.00',
        **kwargs,
    )


@pytest.mark.django_db
class TestFundList:
    def test_list_funds(self, auth_client, user):
        _fund(user)
        res = auth_client.get(URL)
        assert res.status_code == 200
        assert res.data['count'] >= 1

    def test_filter_by_category(self, auth_client, user):
        _fund(user, category='medical', title='Medical Fund')
        _fund(user, category='education', title='Education Fund')
        res = auth_client.get(URL + '?category=medical')
        assert res.status_code == 200
        for f in res.data['results']:
            assert f['category'] == 'medical'

    def test_filter_by_status(self, auth_client, user):
        _fund(user, status='active', title='Active Fund')
        _fund(user, status='completed', title='Completed Fund')
        res = auth_client.get(URL + '?status=active')
        assert res.status_code == 200
        for f in res.data['results']:
            assert f['status'] == 'active'


@pytest.mark.django_db
class TestFundCreate:
    def test_create_fund(self, auth_client, user):
        res = auth_client.post(URL, {
            'title': 'New Fund',
            'description': 'Help description',
            'target_amount': '500.00',
            'category': 'emergency',
        }, format='json')
        assert res.status_code == 201
        assert SolidarityFund.objects.filter(title='New Fund', creator=user).exists()


@pytest.mark.django_db
class TestFundContribute:
    def test_contribute_to_active_fund(self, auth_client, user):
        other = UserFactory()
        fund = _fund(other)
        res = auth_client.post(f'{URL}{fund.id}/contribute/', {
            'amount': '50.00', 'message': 'Stay strong'
        }, format='json')
        assert res.status_code == 201
        assert SolidarityContribution.objects.filter(fund=fund, contributor=user).exists()

    def test_cannot_contribute_to_closed_fund(self, auth_client, user):
        other = UserFactory()
        fund = _fund(other, status='completed')
        res = auth_client.post(f'{URL}{fund.id}/contribute/', {'amount': '20.00'}, format='json')
        assert res.status_code == 400

    def test_creator_can_close_fund(self, auth_client, user):
        fund = _fund(user)
        res = auth_client.post(f'{URL}{fund.id}/close/')
        assert res.status_code == 200
        fund.refresh_from_db()
        assert fund.status == 'completed'

    def test_non_creator_cannot_close_fund(self, auth_client, user):
        other = UserFactory()
        fund = _fund(other)
        res = auth_client.post(f'{URL}{fund.id}/close/')
        assert res.status_code == 403
