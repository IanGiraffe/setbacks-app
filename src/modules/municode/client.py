from typing import List, Optional, Dict, Any
import urllib.request
import urllib.parse
import json
import re

from .models import MunicodeRequestParams, MunicodeResponse, MunicodeDoc


class MunicodeClient:
    """Client for interacting with the Municode API to fetch and process municipal code content."""

    def __init__(self, base_url: str = 'https://api.municode.com'):
        self.base_url = base_url

    def get_available_chapters(self, job_id: int, product_id: int, root_node_id: str) -> List[Dict[str, Any]]:
        """
        Discovers available chapters by querying the root node content.

        Args:
            job_id: The Municode job ID
            product_id: The Municode product ID
            root_node_id: The root node ID (e.g. 'TIT25LADE')

        Returns:
            List of chapter information including IDs and metadata
        """
        query_params = {
            'jobId': str(job_id),
            'nodeId': root_node_id,
            'productId': str(product_id),
        }

        url = f"{self.base_url}/CodesContent?{urllib.parse.urlencode(query_params)}"

        with urllib.request.urlopen(url) as response:
            if response.status != 200:
                raise Exception(f"Municode API error: {response.status} {response.reason}")

            data = json.loads(response.read().decode('utf-8'))
            return data.get('Docs', [])

    def get_chapter_content(self, params: MunicodeRequestParams) -> MunicodeResponse:
        """
        Fetches chapter content from the Municode API.

        Args:
            params: Request parameters including job_id, node_id, and product_id

        Returns:
            MunicodeResponse containing chapter documents

        Raises:
            Exception: If the API request fails
        """
        query_params = {
            'jobId': str(params.job_id),
            'nodeId': params.node_id,
            'productId': str(params.product_id),
        }

        url = f"{self.base_url}/CodesContent?{urllib.parse.urlencode(query_params)}"

        with urllib.request.urlopen(url) as response:
            if response.status != 200:
                raise Exception(f"Municode API error: {response.status} {response.reason}")

            data = json.loads(response.read().decode('utf-8'))
            docs = []
            for doc_data in data['Docs']:
                doc = MunicodeDoc(
                    DocType=doc_data.get('DocType', 0),
                    IsAmended=doc_data.get('IsAmended', False),
                    IsUpdated=doc_data.get('IsUpdated', False),
                    CompareStatus=doc_data.get('CompareStatus', 0),
                    DocOrderId=doc_data.get('DocOrderId', 0),
                    AmendedBy=doc_data.get('AmendedBy', []),
                    Notes=doc_data.get('Notes', []),
                    Drafts=doc_data.get('Drafts', []),
                    ChunkGroupStartingNodeId=doc_data.get('ChunkGroupStartingNodeId', ''),
                    NodeDepth=doc_data.get('NodeDepth', 0),
                    TitleHtml=doc_data.get('TitleHtml', ''),
                    Id=doc_data.get('Id', ''),
                    Title=doc_data.get('Title', ''),
                    Content=doc_data.get('Content', ''),
                    SortDate=doc_data.get('SortDate'),
                    Footnotes=doc_data.get('Footnotes')
                )
                docs.append(doc)
            return MunicodeResponse(Docs=docs)

    @staticmethod
    def build_node_id(title: str, chapter: str, subchapter: Optional[str] = None, article: Optional[str] = None) -> str:
        """
        Constructs a nodeId string for identifying specific chapters and sections.
        
        Args:
            title: The title identifier (e.g. "25LADE")
            chapter: The chapter identifier (e.g. "25-2ZO")
            subchapter: Optional subchapter identifier
            article: Optional article identifier
            
        Returns:
            Formatted nodeId string
        """
        node_id = f"TIT{title}_CH{chapter}"
        if subchapter:
            node_id += f"_{subchapter}"
        if article:
            node_id += f"_{article}"
        return node_id

    @staticmethod
    def search_sections(docs: List[MunicodeDoc], query: str) -> List[MunicodeDoc]:
        """
        Searches for sections containing the given query in title or content.

        Args:
            docs: List of MunicodeDoc objects to search through
            query: Search term to look for

        Returns:
            List of matching MunicodeDoc objects
        """
        search_term = query.lower()
        return [
            doc for doc in docs
            if search_term in (doc.Title or '').lower() or search_term in (doc.Content or '').lower()
        ]

    @staticmethod
    def get_section_by_id(docs: List[MunicodeDoc], id: str) -> Optional[MunicodeDoc]:
        """
        Retrieves a specific section by its ID.
        
        Args:
            docs: List of MunicodeDoc objects to search through
            id: ID of the section to find
            
        Returns:
            Matching MunicodeDoc or None if not found
        """
        return next((doc for doc in docs if doc.Id == id), None)

    @staticmethod
    def get_sections_by_depth(docs: List[MunicodeDoc], depth: int) -> List[MunicodeDoc]:
        """
        Filters sections by their depth in the document hierarchy.
        
        Args:
            docs: List of MunicodeDoc objects to filter
            depth: Depth level to filter by
            
        Returns:
            List of MunicodeDoc objects at the specified depth
        """
        return [doc for doc in docs if doc.NodeDepth == depth]

    @staticmethod
    def get_clean_content(content: Optional[str]) -> str:
        """
        Cleans HTML content from a section while preserving structure.
        
        Args:
            content: Raw HTML content string or None
            
        Returns:
            Cleaned text content with preserved line breaks
        """
        if not content:
            return ""
            
        # Remove HTML tags but keep line breaks
        content = re.sub(r'<div[^>]*>', '\n', content)
        content = content.replace('</div>', '')
        content = re.sub(r'<br\s*/?>', '\n', content)
        content = re.sub(r'<[^>]*>', '', content)
        
        # Clean up special characters and whitespace
        content = content.replace('&nbsp;', ' ')
        
        # Handle escaped quotes and newlines carefully
        # First preserve legitimate quoted single characters (like "P", "C", "X")
        content = re.sub(r'\\\"([A-Z])\\\"', '"\1"', content)  # Convert \\"P\\" to "P"
        content = re.sub(r'\\"([A-Z])\\"', '"\1"', content)    # Convert \"P\" to "P"
        
        # Then handle other escaped characters
        content = content.replace('\\n', '\n')  # Convert raw newline strings to actual newlines
        content = content.replace('\\"', '"')   # Convert remaining escaped quotes
        
        # Normalize spaces and newlines
        content = re.sub(r'\s+', ' ', content)  # Collapse multiple spaces
        content = re.sub(r'\n\s*\n+', '\n\n', content)  # Collapse multiple newlines
        
        # Clean up the final string
        lines = [line.strip() for line in content.split('\n')]
        content = '\n'.join(line for line in lines if line)
        
        return content.strip() 