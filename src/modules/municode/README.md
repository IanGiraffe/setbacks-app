# Municode Client

A Python client for fetching and processing municipal code content from the Municode API.

## Features

- Fetch chapter content from Municode API
- Search sections by keywords
- Filter sections by depth
- Clean HTML content
- Build node IDs for specific chapters

## Requirements

- Python 3.7+
- No external dependencies (uses standard library only)

## Usage

### Basic Example

```python
from modules.municode.client import MunicodeClient
from modules.municode.models import MunicodeRequestParams

# Initialize client
client = MunicodeClient()

# Create request parameters
params = MunicodeRequestParams(
    job_id=463918,
    node_id='TIT25LADE_CH25-2ZO',
    product_id=15302
)

# Fetch chapter content
response = client.get_chapter_content(params)

# Access documents
for doc in response.Docs:
    print(doc.Title)
```

### Search Sections

```python
# Search for sections containing "setback"
setback_sections = MunicodeClient.search_sections(response.Docs, 'setback')
for doc in setback_sections:
    print(doc.Title)
```

### Filter by Depth

```python
# Get sections at depth 4
depth_4 = MunicodeClient.get_sections_by_depth(response.Docs, 4)
```

### Clean HTML Content

```python
# Clean HTML from content
clean_text = MunicodeClient.get_clean_content(doc.Content)
```

### Build Node IDs

```python
# Build a node ID
node_id = MunicodeClient.build_node_id('25LADE', '25-2ZO', 'SUBCHAPTER', 'ARTICLE')
# Result: TIT25LADE_CH25-2ZO_SUBCHAPTER_ARTICLE
```

## Testing

Run the standalone test:

```bash
cd src
python -m modules.municode.standalone_test
```

Run the original test:

```bash
cd src
python -m modules.municode.test
```

## API Parameters

### MunicodeRequestParams

- `job_id` (int): The Municode job ID
- `node_id` (str): The node ID identifying the chapter/section
- `product_id` (int): The Municode product ID

### MunicodeDoc

- `Title` (str): Document title
- `Content` (str): HTML content
- `NodeDepth` (int): Depth in document hierarchy
- `Id` (str): Document ID
- And more...

## Notes

- The client uses Python's standard library `urllib` for HTTP requests
- No external dependencies required
- Works independently from the main JavaScript/Node.js project
