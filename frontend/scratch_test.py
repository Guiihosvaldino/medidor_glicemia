import gzip
import zlib
import lzma

path = 'eas-build-log.txt'
with open(path, 'rb') as f:
    raw = f.read()

print("File size:", len(raw))
print("First 20 bytes:", list(raw[:20]))

try:
    res = gzip.decompress(raw)
    print("Gzip success! Length:", len(res))
except Exception as e:
    print("Gzip error:", e)

try:
    res = zlib.decompress(raw)
    print("Zlib success! Length:", len(res))
except Exception as e:
    print("Zlib error:", e)

try:
    res = lzma.decompress(raw)
    print("Lzma success! Length:", len(res))
except Exception as e:
    print("Lzma error:", e)
