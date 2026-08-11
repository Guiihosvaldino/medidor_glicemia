import string

path = 'frontend/eas-build-log.txt'
with open(path, 'rb') as f:
    data = f.read()

def get_strings(data, min_len=4):
    result = []
    current = []
    for b in data:
        char = chr(b)
        if char in string.printable and b >= 32 and b <= 126:
            current.append(char)
        else:
            if len(current) >= min_len:
                result.append("".join(current))
            current = []
    if len(current) >= min_len:
        result.append("".join(current))
    return result

printable_strings = get_strings(data)
with open('frontend/extracted_strings.txt', 'w', encoding='utf-8') as out_f:
    out_f.write('\n'.join(printable_strings))

print(f"Extracted {len(printable_strings)} strings.")
