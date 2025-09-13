import uuid
from datetime import datetime, timedelta
from ..domain.models import Invite
from ..ports.repos import InviteRepoPort


class InviteService:
    def __init__(self, invites: InviteRepoPort, token_ttl_min: int):
        self.invites = invites
        self.token_ttl_min = token_ttl_min


    def create_invite(self, email: str) -> Invite:
        now = datetime.utcnow()
        inv = Invite(
        id=str(uuid.uuid4()),
        email=email,
        token=uuid.uuid4().hex,
        status="OPEN",
        created_at=now,
        expires_at=now + timedelta(minutes=self.token_ttl_min),
        )
        return self.invites.create(inv)