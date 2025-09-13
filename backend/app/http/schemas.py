from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional


TagType = Literal["advance", "pass", "review", "pending"]


class CreateInviteIn(BaseModel):
    email: EmailStr


class InviteOut(BaseModel):
    inviteId: str = Field(alias="id")
    email: EmailStr
    token: str
    status: Literal["OPEN", "UPLOADED"]


class UploadOut(BaseModel):
    videoId: str


class TagIn(BaseModel):
    tag: TagType


class VideoOut(BaseModel):
    id: str
    inviteId: str
    storageKey: str
    originalName: str
    tag: Optional[TagType] = None