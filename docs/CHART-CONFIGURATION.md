# Mermaid Chart Configuration

## How Parameters Work (No Conflicts!)

**Short answer: NO, these parameters do NOT conflict with each other.**

### Parameter Explanation

1. **`--mermaid-horizontal-width`** (default: 1600px)
   - Only applies to **horizontal charts** (wide charts like sequence diagrams)
   - Sets maximum width - if chart is wider, it scales down
   - Does NOT affect vertical charts
   - Increased significantly for much better readability

2. **`--mermaid-vertical-width`** (default: 250px)
   - Only applies to **vertical charts** (tall charts like flowcharts)
   - Sets maximum width - if chart is wider, it scales down
   - Does NOT affect horizontal charts
   - Reduced significantly to make vertical charts way smaller

3. **`--mermaid-max-height`** (default: 200px)
   - Only applies to **vertical charts** (prevents them from spanning multiple pages)
   - Horizontal charts are NOT height-constrained
   - Works together with `vertical-width` to keep vertical charts compact
   - Reduced significantly to make vertical charts way smaller

4. **`--mermaid-resolution`** (default: 3, range: 1-4)
   - **Does NOT change the visual size or shape of charts**
   - Only affects PNG image quality (sharpness)
   - Higher = sharper images but larger file size
   - Example: 800px visual chart with resolution 3 = 2400px PNG file, but still displays as 800px

### How It Works

The system automatically detects chart orientation using two methods:

**For Flowcharts:**
- Detects based on direction keyword in the code:
  - `flowchart TD` or `flowchart TB` (Top-Down) = **Vertical**
  - `flowchart LR` (Left-Right) = **Horizontal**
  - `flowchart RL` (Right-Left) = **Horizontal**
  - `flowchart BT` (Bottom-Top) = **Vertical**

**For Other Chart Types** (sequenceDiagram, gantt, classDiagram, etc.):
- Detects based on rendered dimensions (aspect ratio):
  - Width > 1.2× height = **Horizontal**
  - Height > width = **Vertical**

**Then applies sizing:**
- **Horizontal charts**: Uses `horizontal-width` only (no height constraint)
- **Vertical charts**: Uses `vertical-width` AND `max-height` (prevents multi-page)

**Resolution multiplies the PNG quality, not the visual size.**

## Persistent Configuration

### Option 1: Config File (Recommended - Persistent)

Create a `markpdf.config.json` file:

```json
{
  "mermaid": {
    "horizontal_width": 1000,
    "vertical_width": 600,
    "max_height": 500,
    "resolution": 3
  }
}
```

Then use it:
```bash
markpdf file.md --config-file markpdf.config.json
```

### Option 2: CLI Flags (One-time, Not Persistent)

```bash
# These settings only apply to this single run
markpdf file.md --mermaid-horizontal-width 1000 --mermaid-resolution 4
```

**CLI flags are NOT persistent** - you need to specify them each time, or use a config file.

### Option 3: Front Matter (Per-Document)

Add to your Markdown file:

```markdown
---
mermaid:
  horizontal_width: 1000
  vertical_width: 600
  max_height: 500
  resolution: 3
---

# Your Document
```

## Examples

```bash
# Use persistent config file
markpdf file.md --config-file markpdf.config.json

# One-time override (not saved)
markpdf file.md --mermaid-horizontal-width 1000

# Combine: use config file but override one setting
markpdf file.md --config-file markpdf.config.json --mermaid-resolution 4
```

## Configuration Priority

1. Default values (if nothing specified)
2. Config file (`--config-file`)
3. Front matter (in Markdown file)
4. CLI flags (highest priority - overrides everything)
