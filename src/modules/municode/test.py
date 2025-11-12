from .client import MunicodeClient
from .models import MunicodeRequestParams


def main():
    client = MunicodeClient()

    try:
        # Test basic chapter fetch
        params = MunicodeRequestParams(
            job_id=463918,
            node_id=MunicodeClient.build_node_id('25LADE', '25-2ZO', 'SUBCHAPTER', 'CUSDERE_ART2PRUSDERE'),
            product_id=15302
        )
        response = client.get_chapter_content(params)

        print('\n=== Municode API Test Results ===\n')
        print('Successfully fetched chapter content')
        print('Number of docs:', len(response.Docs))
        
        # Display first document details
        if response.Docs:
            first_doc = response.Docs[0]
            print('\nFirst document:')
            print('Title:', first_doc.Title)
            print('NodeDepth:', first_doc.NodeDepth)
            print('DocOrderId:', first_doc.DocOrderId)
            print('\nContent:')
            print(first_doc.Content)

        # Example 1: Search for sections containing "permitted"
        print('\n=== Searching for "permitted" ===\n')
        permitted_sections = MunicodeClient.search_sections(response.Docs, 'permitted')
        for doc in permitted_sections:
            print('Title:', doc.Title)
            clean_content = MunicodeClient.get_clean_content(doc.Content)
            print('Clean Content:', clean_content[:200] + '...\n')

        # Example 2: Get sections at depth 3 and 4
        print('\n=== Sections at Depth 5 ===\n')
        depth5_sections = MunicodeClient.get_sections_by_depth(response.Docs, 5)
        for doc in depth5_sections:
            print('Title:', doc.Title)
            print('ID:', doc.Id + '\n')

        print('\n=== Main Sections (Depth 4) ===\n')
        main_sections = MunicodeClient.get_sections_by_depth(response.Docs, 4)
        for doc in main_sections:
            print('Title:', doc.Title)
            print('ID:', doc.Id + '\n')

        # Example 3: Get a specific section by ID
        if response.Docs:
            sample_id = response.Docs[0].Id
            print(f'\n=== Section Details using section ID {sample_id} ===\n')
            section = MunicodeClient.get_section_by_id(response.Docs, sample_id)
            if section:
                print('Title:', section.Title)
                clean_content = MunicodeClient.get_clean_content(section.Content)
                print('Clean Content:', clean_content[:200] + '...\n')
        
    except Exception as error:
        print('Error running tests:', str(error))
        raise


if __name__ == '__main__':
    main() 