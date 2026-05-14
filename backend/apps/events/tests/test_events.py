import pytest
import factory
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from apps.users.tests.conftest import UserFactory
from apps.events.models import Event, RSVP, RSVPStatus


# ─── Module-level factories ───────────────────────────────────────────────────

def _future_dt(offset_hours=1):
    return timezone.now() + timedelta(hours=offset_hours)


class EventFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Event

    title = factory.Sequence(lambda n: f'Event {n}')
    description = 'A test event description'
    organizer = factory.SubFactory(UserFactory)
    city = 'Abidjan'
    country = 'Côte d\'Ivoire'
    start_datetime = factory.LazyFunction(lambda: _future_dt(1))
    end_datetime = factory.LazyFunction(lambda: _future_dt(3))
    category = 'cultural'
    is_online = False


# ─── Fixtures ─────────────────────────────────────────────────────────────────

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


def event_payload(**kwargs):
    base = {
        'title': 'Fête de l\'indépendance',
        'description': 'Grande fête nationale',
        'city': 'Paris',
        'country': 'France',
        'start_datetime': (_future_dt(2)).isoformat(),
        'end_datetime': (_future_dt(5)).isoformat(),
        'category': 'cultural',
        'is_online': False,
    }
    base.update(kwargs)
    return base


# ─── EventViewSet tests ───────────────────────────────────────────────────────

@pytest.mark.django_db
class TestEventViewSet:

    def test_list_events_authenticated(self, auth_client):
        EventFactory.create_batch(3)
        res = auth_client.get('/api/events/events/')
        assert res.status_code == 200
        assert res.data['count'] >= 3

    def test_list_events_unauthenticated_returns_401(self, api_client):
        res = api_client.get('/api/events/events/')
        assert res.status_code == 401

    def test_create_event(self, auth_client, user):
        res = auth_client.post('/api/events/events/', event_payload(), format='json')
        assert res.status_code == 201
        assert res.data['title'] == "Fête de l'indépendance"
        assert res.data['organizer']['id'] == user.id

    def test_create_event_sets_organizer(self, auth_client, user):
        res = auth_client.post('/api/events/events/', event_payload(), format='json')
        assert res.status_code == 201
        event = Event.objects.get(id=res.data['id'])
        assert event.organizer == user

    def test_create_event_unauthenticated_returns_401(self, api_client):
        res = api_client.post('/api/events/events/', event_payload(), format='json')
        assert res.status_code == 401

    def test_retrieve_event(self, auth_client):
        event = EventFactory()
        res = auth_client.get(f'/api/events/events/{event.id}/')
        assert res.status_code == 200
        assert res.data['id'] == event.id
        assert res.data['title'] == event.title

    def test_filter_by_category(self, auth_client, user):
        EventFactory(organizer=user, category='cultural')
        EventFactory(organizer=user, category='sports')
        EventFactory(organizer=user, category='cultural')
        res = auth_client.get('/api/events/events/?category=cultural')
        assert res.status_code == 200
        assert res.data['count'] == 2

    def test_filter_by_city(self, auth_client, user):
        EventFactory(organizer=user, city='Paris')
        EventFactory(organizer=user, city='Lyon')
        res = auth_client.get('/api/events/events/?city=Paris')
        assert res.status_code == 200
        assert res.data['count'] == 1

    def test_filter_by_is_online(self, auth_client, user):
        EventFactory(organizer=user, is_online=True)
        EventFactory(organizer=user, is_online=False)
        EventFactory(organizer=user, is_online=True)
        res = auth_client.get('/api/events/events/?is_online=true')
        assert res.status_code == 200
        assert res.data['count'] == 2

    def test_rsvp_action_creates_rsvp(self, auth_client, user):
        other_user = UserFactory()
        event = EventFactory(organizer=other_user)
        res = auth_client.post(f'/api/events/events/{event.id}/rsvp/', {'status': 'going'}, format='json')
        assert res.status_code == 201
        assert res.data['status'] == 'going'
        assert RSVP.objects.filter(event=event, user=user, status='going').exists()

    def test_rsvp_action_updates_existing_rsvp(self, auth_client, user):
        other_user = UserFactory()
        event = EventFactory(organizer=other_user)
        RSVP.objects.create(event=event, user=user, status='going')
        res = auth_client.post(f'/api/events/events/{event.id}/rsvp/', {'status': 'maybe'}, format='json')
        assert res.status_code == 200
        assert res.data['status'] == 'maybe'
        assert RSVP.objects.filter(event=event, user=user, status='maybe').count() == 1

    def test_rsvp_unauthenticated_returns_401(self, api_client):
        other_user = UserFactory.build()
        res = api_client.post('/api/events/events/1/rsvp/', {'status': 'going'}, format='json')
        assert res.status_code == 401

    def test_attendee_count_increments_on_rsvp(self, auth_client, user):
        other_user = UserFactory()
        third_user = UserFactory()
        event = EventFactory(organizer=other_user)

        # Initially 0 attendees
        res = auth_client.get(f'/api/events/events/{event.id}/')
        assert res.data['attendee_count'] == 0

        # User RSVPs as going
        auth_client.post(f'/api/events/events/{event.id}/rsvp/', {'status': 'going'}, format='json')
        res = auth_client.get(f'/api/events/events/{event.id}/')
        assert res.data['attendee_count'] == 1

        # Third user RSVPs as going directly via model
        RSVP.objects.create(event=event, user=third_user, status='going')
        res = auth_client.get(f'/api/events/events/{event.id}/')
        assert res.data['attendee_count'] == 2

    def test_attendee_count_only_counts_going(self, auth_client, user):
        other_user = UserFactory()
        maybe_user = UserFactory()
        event = EventFactory(organizer=other_user)
        RSVP.objects.create(event=event, user=user, status='going')
        RSVP.objects.create(event=event, user=maybe_user, status='maybe')
        res = auth_client.get(f'/api/events/events/{event.id}/')
        assert res.data['attendee_count'] == 1

    def test_user_rsvp_status_returned(self, auth_client, user):
        other_user = UserFactory()
        event = EventFactory(organizer=other_user)
        RSVP.objects.create(event=event, user=user, status='going')
        res = auth_client.get(f'/api/events/events/{event.id}/')
        assert res.data['user_rsvp_status'] == 'going'

    def test_user_rsvp_status_none_when_not_rsvped(self, auth_client, user):
        other_user = UserFactory()
        event = EventFactory(organizer=other_user)
        res = auth_client.get(f'/api/events/events/{event.id}/')
        assert res.data['user_rsvp_status'] is None


# ─── RSVPViewSet tests ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRSVPViewSet:

    def test_list_rsvps_authenticated(self, auth_client, user):
        other_user = UserFactory()
        event = EventFactory(organizer=other_user)
        RSVP.objects.create(event=event, user=user, status='going')
        res = auth_client.get('/api/events/rsvps/')
        assert res.status_code == 200
        assert res.data['count'] >= 1

    def test_list_rsvps_filtered_by_event(self, auth_client, user):
        other_user = UserFactory()
        event1 = EventFactory(organizer=other_user)
        event2 = EventFactory(organizer=other_user)
        third = UserFactory()
        RSVP.objects.create(event=event1, user=user, status='going')
        RSVP.objects.create(event=event1, user=third, status='maybe')
        RSVP.objects.create(event=event2, user=user, status='going')
        res = auth_client.get(f'/api/events/rsvps/?event={event1.id}')
        assert res.status_code == 200
        assert res.data['count'] == 2

    def test_rsvp_list_unauthenticated_returns_401(self, api_client):
        res = api_client.get('/api/events/rsvps/')
        assert res.status_code == 401

    def test_rsvp_read_only_no_post(self, auth_client, user):
        other_user = UserFactory()
        event = EventFactory(organizer=other_user)
        res = auth_client.post('/api/events/rsvps/', {'event': event.id, 'status': 'going'}, format='json')
        assert res.status_code == 405
