import pytest
from django.db import connection
from apps.users.tests.conftest import UserFactory
from apps.mentorship.models import MentorProfile, MentorshipRequest

PROFILES_URL = '/api/mentorship/profiles/'
REQUESTS_URL = '/api/mentorship/requests/'


def _profile(user, **kwargs):
    kwargs.setdefault('areas', ['career', 'immigration'])
    kwargs.setdefault('is_available', True)
    return MentorProfile.objects.create(
        mentor=user,
        bio='Experienced professional',
        languages=['fr', 'en'],
        max_mentees=3,
        **kwargs,
    )


@pytest.mark.django_db
class TestMentorProfileList:
    def test_list_profiles(self, auth_client):
        mentor = UserFactory()
        _profile(mentor)
        res = auth_client.get(PROFILES_URL)
        assert res.status_code == 200
        assert res.data['count'] >= 1

    def test_filter_by_area(self, auth_client):
        if connection.vendor == 'sqlite':
            pytest.skip('JSONField __contains lookup not supported on SQLite')
        m1 = UserFactory()
        m2 = UserFactory()
        _profile(m1, areas=['career'])
        _profile(m2, areas=['business'])
        res = auth_client.get(PROFILES_URL + '?area=career')
        assert res.status_code == 200
        for p in res.data['results']:
            assert 'career' in p['areas']

    def test_filter_available_only(self, auth_client):
        m1 = UserFactory()
        m2 = UserFactory()
        _profile(m1, is_available=True)
        _profile(m2, is_available=False)
        res = auth_client.get(PROFILES_URL + '?available=true')
        assert res.status_code == 200
        for p in res.data['results']:
            assert p['is_available'] is True


@pytest.mark.django_db
class TestMentorProfileCreate:
    def test_create_own_profile(self, auth_client, user):
        res = auth_client.post(PROFILES_URL, {
            'bio': 'I am a mentor',
            'areas': ['career'],
            'languages': ['fr'],
            'max_mentees': 2,
        }, format='json')
        assert res.status_code == 201
        assert MentorProfile.objects.filter(mentor=user).exists()


@pytest.mark.django_db
class TestMentorshipRequest:
    def test_send_request(self, auth_client, user):
        mentor = UserFactory()
        profile = _profile(mentor)
        res = auth_client.post(REQUESTS_URL, {
            'mentor_profile_id': profile.id,
            'areas_requested': ['career'],
            'message': 'I need guidance on my career path.',
        }, format='json')
        assert res.status_code == 201
        assert MentorshipRequest.objects.filter(mentee=user, mentor_profile=profile).exists()

    def test_no_duplicate_request(self, auth_client, user):
        mentor = UserFactory()
        profile = _profile(mentor)
        MentorshipRequest.objects.create(
            mentee=user, mentor_profile=profile,
            areas_requested=['career'], message='First request', status='pending'
        )
        res = auth_client.post(REQUESTS_URL, {
            'mentor_profile': profile.id,
            'areas_requested': ['career'],
            'message': 'Second request',
        }, format='json')
        assert res.status_code == 400

    def test_mentor_can_accept(self, auth_client, user):
        mentee = UserFactory()
        profile = _profile(user)
        req = MentorshipRequest.objects.create(
            mentee=mentee, mentor_profile=profile,
            areas_requested=['career'], message='Please mentor me', status='pending'
        )
        res = auth_client.post(f'{REQUESTS_URL}{req.id}/accept/')
        assert res.status_code == 200
        req.refresh_from_db()
        assert req.status == 'accepted'

    def test_non_mentor_cannot_accept(self, auth_client, user):
        mentor = UserFactory()
        mentee = UserFactory()
        profile = _profile(mentor)
        req = MentorshipRequest.objects.create(
            mentee=mentee, mentor_profile=profile,
            areas_requested=['career'], message='Please mentor me', status='pending'
        )
        res = auth_client.post(f'{REQUESTS_URL}{req.id}/accept/')
        assert res.status_code in (403, 404)

    def test_mentor_can_reject(self, auth_client, user):
        mentee = UserFactory()
        profile = _profile(user)
        req = MentorshipRequest.objects.create(
            mentee=mentee, mentor_profile=profile,
            areas_requested=['career'], message='Please mentor me', status='pending'
        )
        res = auth_client.post(f'{REQUESTS_URL}{req.id}/reject/')
        assert res.status_code == 200
        req.refresh_from_db()
        assert req.status == 'rejected'
