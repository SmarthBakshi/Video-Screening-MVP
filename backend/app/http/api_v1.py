import mimetypes
from fastapi import Query, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse

from ..config import settings
from ..adapters.repos.inmemory import InMemoryInviteRepo, InMemoryVideoRepo
from ..adapters.repos.mongo import MongoInviteRepo, MongoVideoRepo
from ..adapters.storage.local_fs import LocalFSStorage
from ..services.invites import InviteService
from ..services.videos import VideoService
from .schemas import CreateInviteIn, InviteOut, UploadOut, TagIn, VideoOut
from ..domain.errors import InviteNotFound, InviteExpired, InvalidMime, VideoTooLarge


router = APIRouter()

if settings.DB_BACKEND == "mongo":
    _inv_repo = MongoInviteRepo(settings.MONGO_URL, settings.MONGO_DB)
    _vid_repo = MongoVideoRepo(settings.MONGO_URL, settings.MONGO_DB)
else:
    _inv_repo = InMemoryInviteRepo()
    _vid_repo = InMemoryVideoRepo()

print(f"[BOOT] DB_BACKEND={settings.DB_BACKEND} "
    f"repos={type(_inv_repo).__name__}/{type(_vid_repo).__name__}")


_storage = LocalFSStorage()
_inv_svc = InviteService(_inv_repo, token_ttl_min=settings.TOKEN_TTL_MIN)
_vid_svc = VideoService(
    _inv_repo, _vid_repo, _storage,
    max_mb=settings.MAX_UPLOAD_MB,
    allowed_mimes={"video/webm", "video/mp4", "video/quicktime"}
)

@router.post("/invites", response_model=InviteOut)
def create_invite(inp: CreateInviteIn):
    inv = _inv_svc.create_invite(inp.email)
    return inv

@router.get("/invites", response_model=list[InviteOut])
def list_invites():
    return _inv_repo.list_all()

@router.get("/invites/{token}")
def validate_token(token: str):
    inv = _inv_repo.get_by_token(token)
    if not inv:
        raise HTTPException(status_code=404, detail="invalid token")
    # expiry enforced during upload in service
    return {"ok": True, "inviteId": inv.id}

@router.post("/upload/{token}", response_model=UploadOut)
async def upload_video(token: str, file: UploadFile = File(...)):
    try:
        raw = await file.read()
        if not raw:
            raise HTTPException(400, detail="empty upload")
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
    mime, _ = mimetypes.guess_type(v.storage_key)   # <-- pick correct type (mp4/webm)
    return StreamingResponse(stream, media_type=mime or "application/octet-stream")

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

@router.get("/_debug/config")
def debug_config():
    return {
        "DB_BACKEND": settings.DB_BACKEND,
        "MONGO_URL": settings.MONGO_URL,
        "MONGO_DB": settings.MONGO_DB,
        "repos": {
            "invites": type(_inv_repo).__name__,
            "videos": type(_vid_repo).__name__,
        },
    }

def _video_out(v):
    return {
        "id": v.id,
        "inviteId": v.invite_id,
        "storageKey": v.storage_key,
        "originalName": v.original_name,
        "tag": v.tag,
    }

@router.get("/videos", response_model=list[VideoOut])
def list_videos(inviteId: str = Query(..., description="Invite ID to list")):
    vids = _vid_repo.list_by_invite(inviteId)
    return [_video_out(v) for v in vids]

@router.get("/videos/{video_id}", response_model=VideoOut)
def get_video(video_id: str):
    v = _vid_repo.get(video_id)
    if not v:
        raise HTTPException(404, detail="video not found")
    return _video_out(v)

@router.get("/invites/{invite_id}/videos/latest", response_model=VideoOut)
def latest_video_for_invite(invite_id: str):
    vids = _vid_repo.list_by_invite(invite_id)
    if not vids:
        raise HTTPException(404, detail="no video for invite")
    return _video_out(vids[-1]) 