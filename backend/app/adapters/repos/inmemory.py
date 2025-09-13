from __future__ import annotations
from typing import Optional, List
from ...domain.models import Invite, Video


class InMemoryInviteRepo:
    def __init__(self):
        self._by_id: dict[str, Invite] = {}
        self._by_token: dict[str, Invite] = {}


    def create(self, invite: Invite) -> Invite:
        self._by_id[invite.id] = invite
        self._by_token[invite.token] = invite
        return invite


    def get_by_token(self, token: str) -> Optional[Invite]:
        return self._by_token.get(token)


    def list_all(self) -> List[Invite]:
        return list(self._by_id.values())


    def update(self, invite: Invite) -> None:
        self._by_id[invite.id] = invite
        self._by_token[invite.token] = invite


class InMemoryVideoRepo:
    def __init__(self):
        self._by_id: dict[str, Video] = {}
        self._by_invite: dict[str, list[Video]] = {}


    def create(self, video: Video) -> Video:
        self._by_id[video.id] = video
        self._by_invite.setdefault(video.invite_id, []).append(video)
        return video


    def get(self, vid: str) -> Optional[Video]:
        return self._by_id.get(vid)


    def list_by_invite(self, invite_id: str) -> List[Video]:
        return self._by_invite.get(invite_id, [])


    def update(self, video: Video) -> None:
        self._by_id[video.id] = video