from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User


def recalculate_trust_score(user_pk: int) -> None:
    try:
        user = User.objects.get(pk=user_pk)
    except User.DoesNotExist:
        return

    score = 0

    if user.is_verified:
        score += 5

    profile_fields = [user.first_name, user.last_name, user.bio, user.city, user.country_of_residence]
    if sum(1 for f in profile_fields if f and str(f).strip()) >= 4:
        score += 10

    if user.avatar:
        score += 2

    if user.phone:
        score += 1

    # Community contributions (imported lazily to avoid circular imports)
    try:
        from django.apps import apps
        Post = apps.get_model('community', 'Post')
        post_count = Post.objects.filter(author_id=user_pk).count()
        score += min(post_count, 20)
    except Exception:
        pass

    try:
        Listing = apps.get_model('marketplace', 'Listing')
        listing_count = Listing.objects.filter(seller_id=user_pk, is_active=True).count()
        score += min(listing_count * 2, 10)
    except Exception:
        pass

    User.objects.filter(pk=user_pk).update(trust_score=score)


@receiver(post_save, sender=User)
def user_post_save_trust(sender, instance, **kwargs):
    update_fields = kwargs.get('update_fields')
    if update_fields is not None and 'trust_score' in update_fields:
        return
    recalculate_trust_score(instance.pk)
