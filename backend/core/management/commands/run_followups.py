from django.core.management.base import BaseCommand

from outcomes.services import run_followups


class Command(BaseCommand):
    help = "Send due follow-ups. Schedule daily with cron or Windows Task Scheduler."

    def handle(self, *args, **opts):
        self.stdout.write(str(run_followups()))
