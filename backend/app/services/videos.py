import uuid
from pathlib import Path
from datetime import datetime
from ..domain.models import Video
from ..domain.errors import InviteNotFound, InviteExpired, InvalidMime, VideoTooLarge
from ..ports.repos import InviteRepoPort, VideoRepoPort
from ..ports.storage import StoragePort


class VideoService:
    def __init__(self, invites: InviteRepoPort, videos: VideoRepoPort, storage: StoragePort,
        max_mb: int, allowed_mimes: set[str]):
        self.invites = invites
        self.videos = videos
        self.storage = storage
        self.max_bytes = max_mb * 1024 * 1024
        self.allowed_mimes = allowed_mimes


    def upload_for_token(self, token: str, filename: str, content_type: str, data: bytes) -> Video:
        inv = self.invites.get_by_token(token)
        if not inv:
            raise InviteNotFound()
        if inv.expires_at < datetime.utcnow():
            raise InviteExpired()

        # --- MIME/ext normalization (more tolerant) ---
        mime = (content_type or "").lower()
        base = mime.split(";", 1)[0].strip()  # e.g. "video/webm" from "video/webm;codecs=vp9"
        ext = Path(filename).suffix.lower()   # ".webm", ".mp4", ".mov", ".m4v"

        allowed_exts = {".webm", ".mp4", ".mov", ".m4v"}
        looks_like_video = base.startswith("video/") or ext in allowed_exts

        if not (base in self.allowed_mimes or looks_like_video):
            # still reject truly unknown types
            raise InvalidMime()

        if not data or len(data) == 0:
            # guard against empty upload
            raise VideoTooLarge()  # or HTTP 400 in the route if you prefer

        if len(data) > self.max_bytes:
            raise VideoTooLarge()

        # --- rest of your existing code ---
        vid = Video(
            id=str(uuid.uuid4()),
            invite_id=inv.id,
            storage_key=f"{inv.id}/{uuid.uuid4().hex}-{filename}",
            original_name=filename,
            created_at=datetime.utcnow(),
            tag=None,
        )
        self.storage.put_object(vid.storage_key, data, base or "application/octet-stream")

        inv.status = "UPLOADED"
        self.videos.create(vid)
        self.invites.update(inv)
        return vid

    def tag_video(self, video_id: str, tag: str) -> Video:
        v = self.videos.get(video_id)
        if not v:
            raise FileNotFoundError()
        v.tag = tag # trust FE to send allowed values; validated at API level
        self.videos.update(v)
        return v