#!/usr/bin/env python3
"""
Graph Enrichment from Extracted Entities
Adds new nodes and edges to legal_graph.json based on entity extraction.

Usage:
    python scripts/graph/enrich_graph.py --entities data/extracted_entities.json
    python scripts/graph/enrich_graph.py --entities data/extracted_entities.json --dry-run
    python scripts/graph/enrich_graph.py --stats
"""

import json
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple
from datetime import datetime
from collections import defaultdict

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
GRAPH_PATH = PROJECT_ROOT / "knowledge_base" / "legal_graph.json"
BACKUP_DIR = PROJECT_ROOT / "archive" / "knowledge_base"


class GraphEnricher:
    """Enriches the legal knowledge graph with extracted entities."""

    def __init__(self, graph_path: Path = GRAPH_PATH):
        self.graph_path = graph_path
        self.graph = self._load_graph()
        self.existing_node_ids = {n['id'] for n in self.graph['nodes']}
        self.existing_edges = {
            (e['source'], e['target'], e['type'])
            for e in self.graph['edges']
        }
        self.new_nodes = []
        self.new_edges = []

    def _load_graph(self) -> Dict:
        """Load the knowledge graph."""
        if self.graph_path.exists():
            with open(self.graph_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"nodes": [], "edges": [], "metadata": {}}

    def _backup_graph(self):
        """Create backup of current graph."""
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = BACKUP_DIR / f"legal_graph_backup_{timestamp}.json"

        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(self.graph, f, indent=2, ensure_ascii=False)

        logger.info(f"Backup saved to: {backup_path}")
        return backup_path

    def add_node(self, node: Dict) -> bool:
        """Add a node if it doesn't exist."""
        if node['id'] in self.existing_node_ids:
            return False

        self.new_nodes.append(node)
        self.existing_node_ids.add(node['id'])
        return True

    def add_edge(self, source: str, target: str, edge_type: str,
                 properties: Dict = None) -> bool:
        """Add an edge if it doesn't exist."""
        edge_key = (source, target, edge_type)
        if edge_key in self.existing_edges:
            return False

        # Verify both nodes exist
        if source not in self.existing_node_ids:
            logger.warning(f"Source node not found: {source}")
            return False
        if target not in self.existing_node_ids:
            logger.warning(f"Target node not found: {target}")
            return False

        edge = {
            "source": source,
            "target": target,
            "type": edge_type,
            "properties": properties or {}
        }

        self.new_edges.append(edge)
        self.existing_edges.add(edge_key)
        return True

    def enrich_from_entities(self, entities_file: Path) -> Dict[str, int]:
        """Enrich graph from extracted entities file."""
        with open(entities_file, 'r', encoding='utf-8') as f:
            extracted = json.load(f)

        stats = defaultdict(int)

        for chunk in extracted:
            source_id = chunk.get('chunk_id', '')
            entities = chunk.get('entities', {})

            # Process each entity type
            for entity in entities.get('sumulas', []):
                if self._add_sumula_from_entity(entity):
                    stats['sumulas_added'] += 1

            for entity in entities.get('temas', []):
                if self._add_tema_from_entity(entity):
                    stats['temas_added'] += 1

            for entity in entities.get('artigos', []):
                if self._add_artigo_from_entity(entity):
                    stats['artigos_added'] += 1

            for entity in entities.get('leis', []):
                if self._add_lei_from_entity(entity):
                    stats['leis_added'] += 1

            for entity in entities.get('conceitos', []):
                if self._add_conceito_from_entity(entity):
                    stats['conceitos_added'] += 1

            # Create co-occurrence edges between entities in same chunk
            self._create_cooccurrence_edges(chunk, stats)

        return dict(stats)

    def _add_sumula_from_entity(self, entity: Dict) -> bool:
        """Add súmula node from extracted entity."""
        normalized_id = entity['normalized_id']

        # Convert to graph node format (STJ_297 format)
        if not normalized_id.startswith('STJ_') and not normalized_id.startswith('STF_'):
            normalized_id = f"STJ_{normalized_id}"

        node = {
            "id": normalized_id,
            "type": "Sumula",
            "numero": int(entity['value'].split()[1].replace('/', ' ').split()[0]),
            "tribunal": entity.get('tribunal', 'STJ'),
            "texto": entity.get('context', ''),
            "extracted": True,
            "extraction_context": entity.get('context', '')
        }

        return self.add_node(node)

    def _add_tema_from_entity(self, entity: Dict) -> bool:
        """Add tema node from extracted entity."""
        normalized_id = entity['normalized_id']

        # Extract number from "Tema 1368/STJ"
        value_parts = entity['value'].replace('/', ' ').split()
        numero = int(value_parts[1]) if len(value_parts) > 1 else 0

        node = {
            "id": normalized_id,
            "type": "Tema",
            "numero": numero,
            "tribunal": entity.get('tribunal', 'STJ'),
            "tese": "",
            "extracted": True,
            "extraction_context": entity.get('context', '')
        }

        return self.add_node(node)

    def _add_artigo_from_entity(self, entity: Dict) -> bool:
        """Add artigo node from extracted entity."""
        normalized_id = entity['normalized_id']

        node = {
            "id": normalized_id,
            "type": "Artigo",
            "value": entity['value'],
            "extracted": True,
            "extraction_context": entity.get('context', '')
        }

        return self.add_node(node)

    def _add_lei_from_entity(self, entity: Dict) -> bool:
        """Add lei node from extracted entity."""
        normalized_id = entity['normalized_id']

        node = {
            "id": normalized_id,
            "type": "Lei",
            "value": entity['value'],
            "extracted": True,
            "extraction_context": entity.get('context', '')
        }

        return self.add_node(node)

    def _add_conceito_from_entity(self, entity: Dict) -> bool:
        """Add conceito node from extracted entity."""
        normalized_id = entity['normalized_id']

        node = {
            "id": normalized_id,
            "type": "Conceito",
            "nome": entity['value'],
            "extracted": True,
            "extraction_context": entity.get('context', '')
        }

        return self.add_node(node)

    def _create_cooccurrence_edges(self, chunk: Dict, stats: Dict):
        """Create edges between entities that co-occur in the same text."""
        entities = chunk.get('entities', {})

        # Collect all entity IDs from this chunk
        entity_ids = []

        for sumula in entities.get('sumulas', []):
            entity_ids.append(('Sumula', sumula['normalized_id']))
        for tema in entities.get('temas', []):
            entity_ids.append(('Tema', tema['normalized_id']))
        for artigo in entities.get('artigos', []):
            entity_ids.append(('Artigo', artigo['normalized_id']))
        for conceito in entities.get('conceitos', []):
            entity_ids.append(('Conceito', conceito['normalized_id']))

        # Create RELATED_TO edges between co-occurring entities
        for i, (type1, id1) in enumerate(entity_ids):
            for type2, id2 in entity_ids[i+1:]:
                # Skip self-references
                if id1 == id2:
                    continue

                # Determine edge type based on entity types
                if type1 == 'Sumula' and type2 == 'Artigo':
                    if self.add_edge(id1, id2, 'CITES'):
                        stats['edges_cites'] += 1
                elif type1 == 'Tema' and type2 == 'Sumula':
                    if self.add_edge(id1, id2, 'MODIFIES'):
                        stats['edges_modifies'] += 1
                elif type1 == 'Sumula' and type2 == 'Conceito':
                    if self.add_edge(id1, id2, 'GOVERNS'):
                        stats['edges_governs'] += 1
                else:
                    if self.add_edge(id1, id2, 'RELATED_TO'):
                        stats['edges_related'] += 1

    def save(self, dry_run: bool = False) -> Dict:
        """Save enriched graph."""
        if dry_run:
            return {
                "dry_run": True,
                "new_nodes": len(self.new_nodes),
                "new_edges": len(self.new_edges),
                "preview_nodes": self.new_nodes[:5],
                "preview_edges": self.new_edges[:5]
            }

        # Backup current graph
        self._backup_graph()

        # Merge new nodes and edges
        self.graph['nodes'].extend(self.new_nodes)
        self.graph['edges'].extend(self.new_edges)

        # Update metadata
        self.graph['metadata']['enriched_at'] = datetime.now().isoformat()
        self.graph['metadata']['enrichment_stats'] = {
            "nodes_added": len(self.new_nodes),
            "edges_added": len(self.new_edges)
        }

        # Update statistics
        stats = self.graph.get('statistics', {})
        stats['total_nodes'] = len(self.graph['nodes'])
        stats['total_edges'] = len(self.graph['edges'])

        # Count by type
        node_types = defaultdict(int)
        for node in self.graph['nodes']:
            node_types[node.get('type', 'Unknown')] += 1
        stats['nodes_by_type'] = dict(node_types)

        edge_types = defaultdict(int)
        for edge in self.graph['edges']:
            edge_types[edge.get('type', 'Unknown')] += 1
        stats['edges_by_type'] = dict(edge_types)

        self.graph['statistics'] = stats

        # Save
        with open(self.graph_path, 'w', encoding='utf-8') as f:
            json.dump(self.graph, f, indent=2, ensure_ascii=False)

        logger.info(f"Graph saved to: {self.graph_path}")
        logger.info(f"Total nodes: {stats['total_nodes']}")
        logger.info(f"Total edges: {stats['total_edges']}")

        return stats


def print_stats(graph_path: Path = GRAPH_PATH):
    """Print current graph statistics."""
    if not graph_path.exists():
        print("Graph file not found!")
        return

    with open(graph_path, 'r', encoding='utf-8') as f:
        graph = json.load(f)

    print("\n" + "="*60)
    print("LEGAL KNOWLEDGE GRAPH STATISTICS")
    print("="*60)

    nodes = graph.get('nodes', [])
    edges = graph.get('edges', [])

    print(f"\nTotal Nodes: {len(nodes)}")
    print(f"Total Edges: {len(edges)}")

    # Count by type
    node_types = defaultdict(int)
    for node in nodes:
        node_types[node.get('type', 'Unknown')] += 1

    print("\nNodes by Type:")
    for t, count in sorted(node_types.items(), key=lambda x: -x[1]):
        print(f"  {t}: {count}")

    edge_types = defaultdict(int)
    for edge in edges:
        edge_types[edge.get('type', 'Unknown')] += 1

    print("\nEdges by Type:")
    for t, count in sorted(edge_types.items(), key=lambda x: -x[1]):
        print(f"  {t}: {count}")

    # Metadata
    metadata = graph.get('metadata', {})
    if metadata:
        print(f"\nLast Updated: {metadata.get('enriched_at', metadata.get('created_at', 'Unknown'))}")

    print("\n" + "="*60)


def main():
    parser = argparse.ArgumentParser(description="Enrich legal knowledge graph from extracted entities")
    parser.add_argument("--entities", type=str, help="Path to extracted entities JSON file")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without saving")
    parser.add_argument("--stats", action="store_true", help="Print current graph statistics")
    parser.add_argument("--graph", type=str, default=str(GRAPH_PATH), help="Path to knowledge graph")
    args = parser.parse_args()

    if args.stats:
        print_stats(Path(args.graph))
        return

    if not args.entities:
        parser.print_help()
        return

    entities_path = Path(args.entities)
    if not entities_path.exists():
        logger.error(f"Entities file not found: {entities_path}")
        return

    enricher = GraphEnricher(Path(args.graph))

    logger.info(f"Loading entities from: {entities_path}")
    enrichment_stats = enricher.enrich_from_entities(entities_path)

    logger.info(f"\nEnrichment Results:")
    for key, value in enrichment_stats.items():
        logger.info(f"  {key}: {value}")

    result = enricher.save(dry_run=args.dry_run)

    if args.dry_run:
        print("\n[DRY RUN] Changes that would be made:")
        print(f"  New nodes: {result['new_nodes']}")
        print(f"  New edges: {result['new_edges']}")
        if result['preview_nodes']:
            print("\n  Sample new nodes:")
            for node in result['preview_nodes']:
                print(f"    - {node['id']} ({node['type']})")
        if result['preview_edges']:
            print("\n  Sample new edges:")
            for edge in result['preview_edges']:
                print(f"    - {edge['source']} --[{edge['type']}]--> {edge['target']}")
    else:
        print("\nGraph enrichment complete!")
        print_stats(Path(args.graph))


if __name__ == "__main__":
    main()
