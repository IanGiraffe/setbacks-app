from dataclasses import dataclass
from typing import List, Optional, Any


@dataclass
class MunicodeDoc:
    """Represents a document from the Municode API."""
    DocType: int
    IsAmended: bool
    IsUpdated: bool
    CompareStatus: int
    DocOrderId: int
    AmendedBy: List[Any]
    Notes: List[Any]
    Drafts: List[Any]
    ChunkGroupStartingNodeId: str
    NodeDepth: int
    TitleHtml: str
    Id: str
    Title: str
    Content: str
    SortDate: Optional[str]
    Footnotes: Optional[Any]


@dataclass
class MunicodeResponse:
    """Response from the Municode API containing documents."""
    Docs: List[MunicodeDoc]


@dataclass
class MunicodeRequestParams:
    """Parameters for making a request to the Municode API."""
    job_id: int
    node_id: str
    product_id: int 