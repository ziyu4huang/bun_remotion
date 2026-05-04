# background-removal — rembg Post-Processing

Remove backgrounds from generated images using [rembg](https://github.com/danielgatis/rembg). Required for transparent character sprites since AI models cannot produce transparent backgrounds.

## One-time Setup

```bash
pip3 install --break-system-packages "rembg[cpu]"
```

## Single Image

```bash
python3 -c "
from rembg import remove
from PIL import Image
img = Image.open('input.png')
result = remove(img)
result.save('output.png')
print('Done')
"
```

## Batch Removal

```python
from rembg import remove
from PIL import Image
import os

files = ['file1.png', 'file2.png', 'file3.png']  # or glob.glob('./output/mflux/*.png')
for f in files:
    img = Image.open(f)
    result = remove(img)
    result.save(f)  # overwrite
    print(f'{f}: background removed')
```

## Verify Transparency

```python
from PIL import Image
import numpy as np

img = np.array(Image.open('output.png'))
transparent = (img[:,:,3] == 0).sum()
total = img.shape[0] * img.shape[1]
print(f'Transparent pixels: {transparent}/{total} ({100*transparent/total:.1f}%)')
```

If transparent count is 0, the background was not removed successfully — try:
1. Use a solid magenta `#FF00FF` background in the prompt
2. Re-run rembg
3. Try `rembg` with a different model: `remove(img, session=new_session("isnet-general-use"))`

## Tips

- Solid magenta `#FF00FF` background makes rembg separation cleaner
- Always verify transparency after removal — don't assume it worked
- For game sprites: verify character faces LEFT after processing
- rembg works best with half-body or full-body portraits on solid backgrounds
- Complex backgrounds or multi-character scenes may have edge artifacts
