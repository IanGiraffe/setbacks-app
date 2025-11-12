"""
Standalone test for Municode client.
Run this from the src directory: python -m modules.municode.standalone_test
"""
import sys
import io

# Fix encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from modules.municode.client import MunicodeClient
from modules.municode.models import MunicodeRequestParams


def test_municode_client():
    """Test the Municode client with a simple API call."""
    print("\n" + "="*60)
    print("MUNICODE CLIENT TEST")
    print("="*60 + "\n")

    # Initialize client
    client = MunicodeClient()
    print("✓ Client initialized")

    # Test 1: Fetch chapter content
    print("\n--- Test 1: Fetching Chapter Content ---")
    params = MunicodeRequestParams(
        job_id=463918,
        node_id='TIT25LADE_CH25-2ZO',
        product_id=15302
    )

    try:
        response = client.get_chapter_content(params)
        print(f"✓ Successfully fetched {len(response.Docs)} documents")

        if response.Docs:
            first_doc = response.Docs[0]
            print(f"  First document: {first_doc.Title}")
            print(f"  Node depth: {first_doc.NodeDepth}")
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

    # Test 2: Build node ID
    print("\n--- Test 2: Building Node ID ---")
    node_id = MunicodeClient.build_node_id('25LADE', '25-2ZO')
    print(f"✓ Built node ID: {node_id}")

    # Test 3: Search sections
    print("\n--- Test 3: Searching for 'setback' ---")
    setback_sections = MunicodeClient.search_sections(response.Docs, 'setback')
    print(f"✓ Found {len(setback_sections)} sections containing 'setback'")

    if setback_sections:
        print(f"  Example: {setback_sections[0].Title}")

    # Test 4: Filter by depth
    print("\n--- Test 4: Filtering by Depth ---")
    depth_4 = MunicodeClient.get_sections_by_depth(response.Docs, 4)
    print(f"✓ Found {len(depth_4)} sections at depth 4")

    # Test 5: Clean content
    print("\n--- Test 5: Cleaning HTML Content ---")
    if response.Docs and response.Docs[1].Content:
        dirty_content = response.Docs[1].Content[:100]
        clean_content = MunicodeClient.get_clean_content(response.Docs[1].Content)[:100]
        print(f"✓ Cleaned content (first 100 chars):")
        print(f"  Before: {dirty_content}...")
        print(f"  After: {clean_content}...")

    print("\n" + "="*60)
    print("ALL TESTS PASSED!")
    print("="*60 + "\n")
    return True


if __name__ == '__main__':
    success = test_municode_client()
    exit(0 if success else 1)
