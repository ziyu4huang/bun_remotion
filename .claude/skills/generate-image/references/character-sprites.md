# Character Sprites (Galgame / Visual Novel)

## ALL character images MUST face LEFT

Consistent base direction makes Remotion flip logic deterministic:
- Raw image → faces LEFT
- `side="left"` → `scaleX(-1)` flips to face RIGHT
- `side="right"` → no flip

**Warning:** AI models often ignore "facing LEFT" — emphasize strongly in prompt with multiple mentions:
```
...the character is positioned facing toward the LEFT side, looking to the left,
face turned LEFT direction, facing LEFT...
```

## AI CANNOT produce transparent backgrounds

Post-process with rembg:

```bash
pip3 install --break-system-packages "rembg[cpu]"

python3 -c "
from rembg import remove
from PIL import Image
img = Image.open('character.png')
result = remove(img)
result.save('character.png')
print('Done')
"
```

Use **solid magenta `#FF00FF`** background in prompt for cleanest rembg results.

Verify transparency:
```python
from PIL import Image; import numpy as np
a = np.array(Image.open('character.png'))
print(f'Transparent: {(a[:,:,3]==0).sum()}/{a[:,:,3].size}')
```

## Prompt templates

**Normal sprite:**
```
anime style [gender] character, [appearance], [outfit],
facing LEFT, the character is looking toward the left side of the image,
half-body portrait waist up, solid magenta #FF00FF background,
no background detail, high quality anime illustration
```

**Chibi (Q版):**
```
chibi SD super deformed anime style [description],
facing LEFT, very round head tiny body, chibi proportions,
half-body portrait, solid magenta #FF00FF background,
no background detail, high quality chibi anime illustration
```

**Background (full scene):**
```
anime style [scene description], xianxia atmosphere,
dark palette with [color] highlights, cinematic wide shot
```

**Naming convention:**
- Normal: `<name>.png` | Chibi: `<name>-chibi.png` | Pose: `<name>-<pose>.png`
- Backgrounds: descriptive e.g. `forge-interior.png`, `cave.png`
