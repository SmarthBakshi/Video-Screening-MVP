from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from ..config import settings
from ..adapters.repos.inmemory import InMemoryInviteRepo, InMemoryVideoRepo
from ..adapters.storage.local_fs import LocalFSStorage
from ..services.invites import InviteService
from ..services.videos import VideoService
from .schemas import CreateInviteIn, InviteOut, UploadOut, TagIn, VideoOut
from ..domain.errors import InviteNotFound, InviteExpired, InvalidMime, VideoTooLarge


router = APIRouter()


# singletons for MVP
_inv_repo = InMemoryInviteRepo()
_vid_repo = InMemoryVideoRepo()
_storage = LocalFSStorage()
_inv_svc = InviteService(_inv_repo, token_ttl_min=settings.TOKEN_TTL_MIN)
_vid_svc = VideoService(
_inv_repo, _vid_repo, _storage,
max_mb=settings.MAX_UPLOAD_MB,
allowed_mimes={"video/webm", "video/mp4"}
)


@router.post("/invites", response_model=InviteOut)
def create_invite(inp: CreateInviteIn):
    inv = _inv_svc.create_invite(inp.email)
    return inv # Pydantic aliasing maps keys


@router.get("/invites", response_model=list[InviteOut])
def list_invites():
    return _inv_repo.list_all()


@router.get("/invites/{token}")
def validate_token(token: str):
    inv = _inv_repo.get_by_token(token)
    if not inv:
        raise HTTPException(status_code=404, detail="invalid token")
    if inv.expires_at.isoformat() < inv.created_at.isoformat():
    # placeholder; real expiry check handled in service during upload
        pass
    return {"ok": True, "inviteId": inv.id}


@router.post("/upload/{token}", response_model=UploadOut)
def upload_video(token: str, file: UploadFile = File(...)):
    try:
        raw = file.file.read()
        v = _vid_svc.upload_for_token(token, file.filename, file.content_type or "", raw)
        return {"videoId": v.id}
    except InviteNotFound:
        raise HTTPException(404, detail="invite not found")
    except InviteExpired:
        raise HTTPException(410, detail="invite expired")
    except InvalidMime:
        raise HTTPException(415, detail="invalid mime type")
    except VideoTooLarge:
        raise HTTPException(413, detail="file too large")


@router.get("/videos/{video_id}/stream")
def stream_video(video_id: str):
    v = _vid_repo.get(video_id)
    if not v:
        raise HTTPException(404, detail="video not found")
    stream = _storage.get_stream(v.storage_key)
    return StreamingResponse(stream, media_type="video/webm")


@router.post("/videos/{video_id}/tag", response_model=VideoOut)
def tag_video(video_id: str, inp: TagIn):
    v = _vid_svc.tag_video(video_id, inp.tag)
    return {
    "id": v.id,
    "inviteId": v.invite_id,
    "storageKey": v.storage_key,
    "originalName": v.original_name,
    "tag": v.tag,
    }