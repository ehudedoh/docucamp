from pathlib import Path

def extension(filename):
    return Path(filename).suffix.lower()
