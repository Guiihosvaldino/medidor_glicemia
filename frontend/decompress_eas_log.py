import gzip
import zlib
import lzma
import sys
path = 'eas-build-log.txt'

def try_gzip(b):
    try:
        return gzip.decompress(b).decode('utf-8', errors='replace')
    except Exception:
        return None

def try_zlib(b):
    try:
        return zlib.decompress(b).decode('utf-8', errors='replace')
    except Exception:
        return None

def try_lzma(b):
    try:
        return lzma.decompress(b).decode('utf-8', errors='replace')
    except Exception:
        return None

def try_brotli(b):
    try:
        import brotli
        return brotli.decompress(b).decode('utf-8', errors='replace')
    except Exception:
        return None

with open(path, 'rb') as f:
    raw = f.read()

decompressed_text = None
for fn in (try_gzip, try_brotli, try_zlib, try_lzma):
    res = fn(raw)
    if res:
        decompressed_text = res
        break

if not decompressed_text:
    decompressed_text = raw.decode('latin-1', errors='replace')

with open('decompressed_log.txt', 'w', encoding='utf-8') as out_f:
    out_f.write(decompressed_text)

print("Saved decompressed log to decompressed_log.txt")

