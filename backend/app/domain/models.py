from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Literal


InviteStatus = Literal["OPEN", "UPLOADED"]
TagType = Literal["advance", "pass", "review", "pending"]


@dataclass
class Invite:
    id: str
    email: str
    token: str
    status: InviteStatus
    created_at: datetime
    expires_at: datetime


@dataclass
class Video:
    id: str
    invite_id: str
    storage_key: str
    original_name: str
    created_at: datetime
    tag: Optional[TagType] = None