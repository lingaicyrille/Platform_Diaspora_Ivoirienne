import pytest
from datetime import date, timedelta
from apps.users.tests.conftest import UserFactory
from apps.ads.models import Ad

URL = '/api/ads/ads/'


def _make_ad(user, **kwargs):
    today = date.today()
    kwargs.setdefault('placement', 'feed')
    kwargs.setdefault('title', 'Test Ad')
    return Ad.objects.create(
        advertiser=user,
        body='Body text',
        link='https://example.com',
        start_date=today - timedelta(days=1),
        end_date=today + timedelta(days=7),
        is_active=True,
        **kwargs,
    )


@pytest.mark.django_db
class TestAdList:
    def test_list_active_ads(self, auth_client, user):
        _make_ad(user)
        res = auth_client.get(URL)
        assert res.status_code == 200
        assert res.data['count'] >= 1

    def test_expired_ad_excluded(self, auth_client, user):
        today = date.today()
        Ad.objects.create(
            advertiser=user, title='Expired', body='x', link='https://x.com',
            placement='feed',
            start_date=today - timedelta(days=10),
            end_date=today - timedelta(days=1),
            is_active=True,
        )
        res = auth_client.get(URL)
        assert res.status_code == 200
        titles = [a['title'] for a in res.data['results']]
        assert 'Expired' not in titles

    def test_filter_by_placement(self, auth_client, user):
        _make_ad(user, placement='banner', title='Banner Ad')
        _make_ad(user, placement='sidebar', title='Sidebar Ad')
        res = auth_client.get(URL + '?placement=banner')
        assert res.status_code == 200
        for a in res.data['results']:
            assert a['placement'] == 'banner'


@pytest.mark.django_db
class TestAdTracking:
    def test_track_impression(self, auth_client, user):
        ad = _make_ad(user)
        res = auth_client.post(f'{URL}{ad.id}/track_impression/')
        assert res.status_code == 204
        ad.refresh_from_db()
        assert ad.impressions == 1

    def test_track_click(self, auth_client, user):
        ad = _make_ad(user)
        res = auth_client.post(f'{URL}{ad.id}/track_click/')
        assert res.status_code == 204
        ad.refresh_from_db()
        assert ad.clicks == 1
