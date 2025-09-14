from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from pymongo import MongoClient, ASCENDING
from ...domain.models import Invite, Video

def _invite_from_doc(d: dict) -> Invite:
    return Invite(
        id=d["_id"],
        email=d["email"],
        token=d["token"],
        status=d["status"],
        created_at=d["created_at"],
        expires_at=d["expires_at"],
    )

def _invite_to_doc(inv: Invite) -> dict:
    return {
        "_id": inv.id,
        "email": inv.email,
        "token": inv.token,
        "status": inv.status,
        "created_at": inv.created_at,
        "expires_at": inv.expires_at,
    }

def _video_from_doc(d: dict) -> Video:
    return Video(
        id=d["_id"],
        invite_id=d["invite_id"],
        storage_key=d["storage_key"],
        original_name=d["original_name"],
        created_at=d["created_at"],
        tag=d.get("tag"),
    )

def _video_to_doc(v: Video) -> dict:
    return {
        "_id": v.id,
        "invite_id": v.invite_id,
        "storage_key": v.storage_key,
        "original_name": v.original_name,
        "created_at": v.created_at,
        "tag": v.tag,
    }

class MongoInviteRepo:
    def __init__(self, url: str, db_name: str):
        self.client = MongoClient(url)
        self.db = self.client[db_name]
        self.col = self.db["invites"]
        # indexes
        self.col.create_index([("token", ASCENDING)], unique=True)
        self.col.create_index([("created_at", ASCENDING)])

    def create(self, invite: Invite) -> Invite:
        self.col.insert_one(_invite_to_doc(invite))
        return invite

    def get_by_token(self, token: str) -> Optional[Invite]:
        d = self.col.find_one({"token": token})
        return _invite_from_doc(d) if d else None

    def list_all(self) -> List[Invite]:
        return [_invite_from_doc(d) for d in self.col.find().sort("created_at", ASCENDING)]

    def update(self, invite: Invite) -> None:
        self.col.replace_one({"_id": invite.id}, _invite_to_doc(invite), upsert=True)

class MongoVideoRepo:
    def __init__(self, url: str, db_name: str):
        self.client = MongoClient(url)
        self.db = self.client[db_name]
        self.col = self.db["videos"]
        # indexes
        self.col.create_index([("invite_id", ASCENDING)])
        self.col.create_index([("created_at", ASCENDING)])

    def create(self, video: Video) -> Video:
        self.col.insert_one(_video_to_doc(video))
        return video

    def get(self, vid: str) -> Optional[Video]:
        d = self.col.find_one({"_id": vid})
        return _video_from_doc(d) if d else None

    def list_by_invite(self, invite_id: str):
        return [_video_from_doc(d)
            for d in self.col.find({"invite_id": invite_id}).sort("created_at", 1)]

    def update(self, video: Video) -> None:
        self.col.replace_one({"_id": video.id}, _video_to_doc(video), upsert=True)
