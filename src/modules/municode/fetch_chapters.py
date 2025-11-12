import asyncio
import json
import os
from pathlib import Path
from typing import Dict, Any, List
from dataclasses import asdict
from datetime import datetime
import logging
import re

from .client import MunicodeClient
from .models import MunicodeResponse, MunicodeRequestParams
from .config import AUSTIN_CONFIG


class MunicodeFetcher:
    """
    Fetches and stores Municode chapter content as JSON files.
    
    This class handles fetching content from the Municode API and storing it in a structured
    JSON format for later use. It includes functionality for discovering available chapters,
    fetching individual chapters, and bulk fetching of all chapters.

    Attributes:
        client (MunicodeClient): Client for making API requests to Municode
        date_str (str): Current date string used for organizing output files
        base_output_dir (Path): Base directory for storing output files
        logger (Logger): Logger instance for tracking operations
    """
    
    def __init__(self):
        """
        Initializes the MunicodeFetcher with required client and logging setup.
        Creates output directory structure if it doesn't exist.
        """
        self.client = MunicodeClient(base_url=AUSTIN_CONFIG['base_url'])
        self.date_str = datetime.now().strftime('%Y-%m-%d')
        self.base_output_dir = Path(f"vectordb/data/city_code/ldc/{self.date_str}")
        self.base_output_dir.mkdir(parents=True, exist_ok=True)
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.base_output_dir / 'fetch.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def _save_json(self, data: Dict[str, Any], filepath: Path) -> None:
        """
        Saves data as a JSON file with proper formatting.

        Args:
            data: Dictionary containing data to save
            filepath: Path where the JSON file should be saved
        """
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    async def discover_chapters(self) -> List[Dict[str, Any]]:
        """
        Discovers available chapters from the API.

        Returns:
            List of dictionaries containing chapter information

        Raises:
            Exception: If chapter discovery fails
        """
        self.logger.info("Discovering available chapters...")
        try:
            chapters = await self.client.get_available_chapters(
                job_id=AUSTIN_CONFIG['job_id'],
                product_id=AUSTIN_CONFIG['product_id'],
                root_node_id=AUSTIN_CONFIG['root_node_id']
            )
            self.logger.info(f"Found {len(chapters)} chapters")
            return chapters
        except Exception as e:
            self.logger.error(f"Error discovering chapters: {str(e)}")
            raise
    
    async def fetch_and_store_chapter(
        self,
        job_id: int,
        title: str,
        chapter: str,
        product_id: int,
        subchapter: str = None,
        article: str = None
    ) -> None:
        """
        Fetches a single chapter and stores its content as JSON files.
        
        Args:
            job_id: The Municode job ID
            title: The title identifier (e.g. "25LADE")
            chapter: The chapter identifier (e.g. "25-2ZO")
            product_id: The Municode product ID
            subchapter: Optional subchapter identifier
            article: Optional article identifier

        Raises:
            Exception: If fetching or storing the chapter fails
        """
        try:
            # Build the node ID
            node_id = chapter  # Use the node ID directly from the API
            
            # Fetch the content
            params = MunicodeRequestParams(
                job_id=job_id,
                node_id=node_id,
                product_id=product_id
            )
            response = await self.client.get_chapter_content(params)
            
            # Process and save sections
            sections_data = []
            for doc in response.Docs:
                section_data = {
                    'id': doc.Id,
                    'title': doc.Title,
                    'depth': doc.NodeDepth,
                    'content': MunicodeClient.get_clean_content(doc.Content),
                    'is_amended': doc.IsAmended,
                    'is_updated': doc.IsUpdated,
                    'doc_order_id': doc.DocOrderId
                }
                sections_data.append(section_data)
            
            # Save to chapter-specific JSON file
            output_data = {
                'chapter': chapter,
                'node_id': node_id,
                'sections': sections_data
            }
            
            # Use a safe filename based on the chapter number
            safe_filename = re.sub(r'[^\w\-]', '_', chapter) + '.json'
            output_file = self.base_output_dir / safe_filename
            self._save_json(output_data, output_file)
            
            self.logger.info(f"Successfully stored chapter {chapter} data")
            
        except Exception as e:
            self.logger.error(f"Error fetching chapter {chapter}: {str(e)}")
            raise

    async def fetch_all_austin_chapters(self) -> None:
        """
        Fetches all chapters of the Austin municipal code.
        
        This method:
        1. Discovers all available chapters
        2. Saves the chapter structure for reference
        3. Fetches each unique chapter and saves its content
        4. Handles duplicate chapters and maintains proper organization

        Raises:
            Exception: If the bulk fetch operation fails
        """
        self.logger.info("Starting bulk fetch of Austin municipal code chapters")
        
        try:
            # First discover available chapters
            chapters = await self.discover_chapters()
            
            # Save the chapter structure for reference
            self._save_json(
                {'chapters': chapters},
                self.base_output_dir / 'chapter_structure.json'
            )
            
            # Group chapters by their base chapter ID to avoid duplicates
            processed_chapters = set()
            
            # Fetch each chapter
            for chapter in chapters:
                try:
                    node_id = chapter.get('Id', '')
                    if not node_id:
                        continue
                    
                    # Extract the base chapter ID (e.g., TIT25LADE_CH25-1GEREPR from TIT25LADE_CH25-1GEREPR_ART1GEPR)
                    base_chapter = '_'.join(node_id.split('_')[:2])  # Take only title and chapter parts
                    
                    # Skip if we've already processed this base chapter
                    if base_chapter in processed_chapters:
                        continue
                        
                    # Skip if this isn't a base chapter node (has more than 2 parts)
                    if len(node_id.split('_')) > 2:
                        continue
                    
                    self.logger.info(f"Fetching chapter {base_chapter}...")
                    await self.fetch_and_store_chapter(
                        job_id=AUSTIN_CONFIG['job_id'],
                        title=AUSTIN_CONFIG['title'],
                        chapter=base_chapter,
                        product_id=AUSTIN_CONFIG['product_id']
                    )
                    processed_chapters.add(base_chapter)
                    
                    # Add a small delay between requests to be nice to the API
                    await asyncio.sleep(1)
                except Exception as e:
                    self.logger.error(f"Failed to fetch chapter {node_id}: {str(e)}")
                    continue
            
            self.logger.info(f"Processed {len(processed_chapters)} unique chapters")
            
        except Exception as e:
            self.logger.error(f"Error in bulk fetch: {str(e)}")
            raise
            
        self.logger.info("Completed bulk fetch of Austin municipal code chapters")


async def main():
    """
    Main function to fetch all Austin chapters.
    
    Creates a MunicodeFetcher instance and runs the bulk fetch operation.
    """
    fetcher = MunicodeFetcher()
    await fetcher.fetch_all_austin_chapters()


if __name__ == '__main__':
    asyncio.run(main()) 