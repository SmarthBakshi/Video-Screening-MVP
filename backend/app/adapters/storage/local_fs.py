from pathlib import Path
from typing import BinaryIO
from ...config import settings


class LocalFSStorage:
    def __init__(self, root: str | None = None):
        self.root = Path(root or settings.UPLOAD_DIR)
        self.root.mkdir(parents=True, exist_ok=True)


    def put_object(self, key: str, file_bytes: bytes, content_type: str) -> None:
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(path.suffix + ".part")
        with open(tmp, "wb") as f:
            f.write(file_bytes)
        tmp.replace(path)


    def get_stream(self, key: str) -> BinaryIO:
        path = self.root / key
        return open(path, "rb")