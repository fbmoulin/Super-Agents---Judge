#!/usr/bin/env python3
"""
LLM-Assisted Relationship Discovery
Discovers implicit relationships between legal entities using LLM analysis.

Usage:
    python scripts/graph/discover_relationships.py --analyze
    python scripts/graph/discover_relationships.py --sample 10
    python scripts/graph/discover_relationships.py --apply
"""

import json
import argparse
import logging
import os
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime
from collections import defaultdict
import re

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
GRAPH_PATH = PROJECT_ROOT / "knowledge_base" / "legal_graph.json"
SUMULAS_PATH = PROJECT_ROOT / "knowledge_base" / "sumulas.json"
TEMAS_PATH = PROJECT_ROOT / "knowledge_base" / "temas_repetitivos.json"
RELATIONSHIPS_PATH = PROJECT_ROOT / "knowledge_base" / "discovered_relationships.json"

# Known relationship patterns (heuristic-based discovery)
RELATIONSHIP_PATTERNS = {
    # Súmulas that modify or supersede others
    "supersession": [
        # Tema 1368 supersedes parts of Súmula 54
        {"from": "TEMA_1368", "to": "STJ_54", "type": "MODIFIES",
         "reason": "Tema 1368 unifica correção monetária, superando parcialmente Súmula 54"},
    ],

    # Súmulas that are related by subject matter
    "subject_clusters": {
        "bancario_juros": ["STJ_30", "STJ_379", "STJ_382", "STJ_472", "STJ_539", "STJ_541"],
        "bancario_cdc": ["STJ_297", "STJ_381"],
        "dano_moral": ["STJ_362", "STJ_387", "STJ_388", "TEMA_1368"],
        "responsabilidade_objetiva": ["STJ_479", "STJ_523", "STJ_595"],
        "plano_saude": ["STJ_302", "STJ_608", "STJ_609"],
        "execucao_fiscal": ["STJ_392", "STJ_393", "STJ_409", "STJ_452", "STJ_559"],
    },

    # Cross-references in texts
    "text_references": []  # To be populated by analysis
}

# Legal concept keywords and their associated súmulas
CONCEPT_MAPPINGS = {
    "anatocismo": {
        "sumulas": ["STJ_472", "STJ_539", "STJ_541"],
        "concept_id": "CONCEITO_capitalização_de_juros"
    },
    "dano_moral_in_re_ipsa": {
        "sumulas": ["STJ_387", "STJ_388", "STJ_403"],
        "concept_id": "CONCEITO_dano_moral_in_re_ipsa"
    },
    "fortuito_interno": {
        "sumulas": ["STJ_479"],
        "concept_id": "CONCEITO_fortuito_interno"
    },
    "correção_monetária": {
        "sumulas": ["STJ_30", "STJ_362", "STJ_54"],
        "temas": ["TEMA_1368"],
        "concept_id": "CONCEITO_correção_monetária"
    },
    "responsabilidade_objetiva": {
        "sumulas": ["STJ_479", "STJ_523", "STJ_595", "STJ_643"],
        "concept_id": "CONCEITO_responsabilidade_objetiva"
    },
    "selic": {
        "temas": ["TEMA_1368"],
        "concept_id": "CONCEITO_selic"
    }
}


class RelationshipDiscoverer:
    """Discovers relationships between legal entities."""

    def __init__(self, graph_path: Path = GRAPH_PATH):
        self.graph_path = graph_path
        self.graph = self._load_graph()
        self.sumulas = self._load_sumulas()
        self.temas = self._load_temas()
        self.discovered_relationships = []

    def _load_graph(self) -> Dict:
        """Load the knowledge graph."""
        if self.graph_path.exists():
            with open(self.graph_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"nodes": [], "edges": [], "metadata": {}}

    def _load_sumulas(self) -> Dict:
        """Load súmulas data."""
        if SUMULAS_PATH.exists():
            with open(SUMULAS_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Flatten to dict by id
                result = {}
                for tribunal, items in data.get("sumulas", {}).items():
                    for num, info in items.items():
                        result[f"{tribunal}_{num}"] = {**info, "numero": num, "tribunal": tribunal}
                return result
        return {}

    def _load_temas(self) -> Dict:
        """Load temas data."""
        if TEMAS_PATH.exists():
            with open(TEMAS_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                result = {}
                for num, info in data.get("temas", {}).items():
                    result[f"TEMA_{num}"] = {**info, "numero": num}
                return result
        return {}

    def _get_existing_edges(self) -> set:
        """Get set of existing edges."""
        return {
            (e['source'], e['target'], e['type'])
            for e in self.graph['edges']
        }

    def _get_existing_nodes(self) -> set:
        """Get set of existing node IDs."""
        return {n['id'] for n in self.graph['nodes']}

    def discover_subject_clusters(self) -> List[Dict]:
        """Discover RELATED_TO edges from subject clusters."""
        relationships = []
        existing = self._get_existing_edges()
        nodes = self._get_existing_nodes()

        for cluster_name, sumula_ids in RELATIONSHIP_PATTERNS["subject_clusters"].items():
            # Filter to only existing nodes
            valid_ids = [sid for sid in sumula_ids if sid in nodes]

            # Create RELATED_TO edges between all pairs
            for i, sid1 in enumerate(valid_ids):
                for sid2 in valid_ids[i+1:]:
                    if (sid1, sid2, "RELATED_TO") not in existing:
                        relationships.append({
                            "source": sid1,
                            "target": sid2,
                            "type": "RELATED_TO",
                            "properties": {
                                "cluster": cluster_name,
                                "discovered_by": "subject_analysis"
                            }
                        })

        return relationships

    def discover_concept_relationships(self) -> List[Dict]:
        """Discover relationships between concepts and súmulas/temas."""
        relationships = []
        existing = self._get_existing_edges()
        nodes = self._get_existing_nodes()

        for concept_name, mapping in CONCEPT_MAPPINGS.items():
            concept_id = mapping.get("concept_id")
            if not concept_id or concept_id not in nodes:
                continue

            # Link súmulas to concepts
            for sumula_id in mapping.get("sumulas", []):
                if sumula_id in nodes:
                    if (sumula_id, concept_id, "GOVERNS") not in existing:
                        relationships.append({
                            "source": sumula_id,
                            "target": concept_id,
                            "type": "GOVERNS",
                            "properties": {
                                "concept": concept_name,
                                "discovered_by": "concept_mapping"
                            }
                        })

            # Link temas to concepts
            for tema_id in mapping.get("temas", []):
                if tema_id in nodes:
                    if (tema_id, concept_id, "APPLIES_TO") not in existing:
                        relationships.append({
                            "source": tema_id,
                            "target": concept_id,
                            "type": "APPLIES_TO",
                            "properties": {
                                "concept": concept_name,
                                "discovered_by": "concept_mapping"
                            }
                        })

        return relationships

    def discover_supersession(self) -> List[Dict]:
        """Discover MODIFIES relationships (súmulas/temas that modify others)."""
        relationships = []
        existing = self._get_existing_edges()
        nodes = self._get_existing_nodes()

        for pattern in RELATIONSHIP_PATTERNS["supersession"]:
            source = pattern["from"]
            target = pattern["to"]

            if source in nodes and target in nodes:
                if (source, target, pattern["type"]) not in existing:
                    relationships.append({
                        "source": source,
                        "target": target,
                        "type": pattern["type"],
                        "properties": {
                            "reason": pattern["reason"],
                            "discovered_by": "supersession_analysis"
                        }
                    })

        return relationships

    def discover_text_references(self) -> List[Dict]:
        """Analyze súmula texts for cross-references."""
        relationships = []
        existing = self._get_existing_edges()
        nodes = self._get_existing_nodes()

        # Patterns to find references
        sumula_ref = re.compile(r'[Ss][úu]mula\s+(?:n[º°\.]?\s*)?(\d+)', re.IGNORECASE)
        tema_ref = re.compile(r'[Tt]ema\s+(?:n[º°\.]?\s*)?(\d+)', re.IGNORECASE)
        artigo_ref = re.compile(r'[Aa]rt\.?\s*(\d+)\s+d[oa]\s+(CC|CDC|CPC|CF)', re.IGNORECASE)

        for sumula_id, sumula_data in self.sumulas.items():
            texto = sumula_data.get("texto", "")

            # Find súmula references
            for match in sumula_ref.finditer(texto):
                ref_num = match.group(1)
                ref_id = f"STJ_{ref_num}"
                if ref_id in nodes and ref_id != sumula_id:
                    if (sumula_id, ref_id, "CITES") not in existing:
                        relationships.append({
                            "source": sumula_id,
                            "target": ref_id,
                            "type": "CITES",
                            "properties": {
                                "context": texto[max(0, match.start()-30):match.end()+30],
                                "discovered_by": "text_analysis"
                            }
                        })

            # Find tema references
            for match in tema_ref.finditer(texto):
                ref_num = match.group(1)
                ref_id = f"TEMA_{ref_num}"
                if ref_id in nodes:
                    if (sumula_id, ref_id, "RELATED_TO") not in existing:
                        relationships.append({
                            "source": sumula_id,
                            "target": ref_id,
                            "type": "RELATED_TO",
                            "properties": {
                                "context": texto[max(0, match.start()-30):match.end()+30],
                                "discovered_by": "text_analysis"
                            }
                        })

            # Find artigo references
            for match in artigo_ref.finditer(texto):
                art_num = match.group(1)
                codigo = match.group(2).upper()
                ref_id = f"ARTIGO_{codigo}_Art{art_num}"
                if ref_id in nodes:
                    if (sumula_id, ref_id, "CITES") not in existing:
                        relationships.append({
                            "source": sumula_id,
                            "target": ref_id,
                            "type": "CITES",
                            "properties": {
                                "context": texto[max(0, match.start()-30):match.end()+30],
                                "discovered_by": "text_analysis"
                            }
                        })

        return relationships

    def discover_all(self) -> List[Dict]:
        """Run all discovery methods."""
        all_relationships = []

        logger.info("Discovering subject cluster relationships...")
        clusters = self.discover_subject_clusters()
        all_relationships.extend(clusters)
        logger.info(f"  Found {len(clusters)} cluster relationships")

        logger.info("Discovering concept relationships...")
        concepts = self.discover_concept_relationships()
        all_relationships.extend(concepts)
        logger.info(f"  Found {len(concepts)} concept relationships")

        logger.info("Discovering supersession relationships...")
        supersessions = self.discover_supersession()
        all_relationships.extend(supersessions)
        logger.info(f"  Found {len(supersessions)} supersession relationships")

        logger.info("Discovering text reference relationships...")
        text_refs = self.discover_text_references()
        all_relationships.extend(text_refs)
        logger.info(f"  Found {len(text_refs)} text reference relationships")

        self.discovered_relationships = all_relationships
        return all_relationships

    def save_discoveries(self, output_path: Path = RELATIONSHIPS_PATH):
        """Save discovered relationships to file."""
        output = {
            "discovered_at": datetime.now().isoformat(),
            "total_relationships": len(self.discovered_relationships),
            "by_type": defaultdict(int),
            "by_discovery_method": defaultdict(int),
            "relationships": self.discovered_relationships
        }

        for rel in self.discovered_relationships:
            output["by_type"][rel["type"]] += 1
            method = rel.get("properties", {}).get("discovered_by", "unknown")
            output["by_discovery_method"][method] += 1

        output["by_type"] = dict(output["by_type"])
        output["by_discovery_method"] = dict(output["by_discovery_method"])

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved {len(self.discovered_relationships)} discoveries to: {output_path}")
        return output

    def apply_to_graph(self, dry_run: bool = False) -> Dict:
        """Apply discovered relationships to the graph."""
        if not self.discovered_relationships:
            logger.warning("No relationships to apply. Run discover_all() first.")
            return {}

        if dry_run:
            by_type = defaultdict(int)
            for rel in self.discovered_relationships:
                by_type[rel["type"]] += 1
            return {
                "dry_run": True,
                "relationships_to_add": len(self.discovered_relationships),
                "by_type": dict(by_type)
            }

        # Add to graph
        added = 0
        for rel in self.discovered_relationships:
            self.graph['edges'].append(rel)
            added += 1

        # Update metadata
        self.graph['metadata']['relationships_discovered_at'] = datetime.now().isoformat()
        self.graph['metadata']['relationships_added'] = added

        # Update statistics
        stats = self.graph.get('statistics', {})
        stats['total_edges'] = len(self.graph['edges'])

        edge_types = defaultdict(int)
        for edge in self.graph['edges']:
            edge_types[edge.get('type', 'Unknown')] += 1
        stats['edges_by_type'] = dict(edge_types)

        self.graph['statistics'] = stats

        # Save
        with open(self.graph_path, 'w', encoding='utf-8') as f:
            json.dump(self.graph, f, indent=2, ensure_ascii=False)

        logger.info(f"Applied {added} relationships to graph")
        logger.info(f"Total edges now: {stats['total_edges']}")

        return {
            "relationships_added": added,
            "total_edges": stats['total_edges'],
            "edges_by_type": stats['edges_by_type']
        }


def main():
    parser = argparse.ArgumentParser(description="Discover relationships in legal knowledge graph")
    parser.add_argument("--analyze", action="store_true", help="Run relationship discovery")
    parser.add_argument("--sample", type=int, help="Show sample of N discoveries")
    parser.add_argument("--apply", action="store_true", help="Apply discoveries to graph")
    parser.add_argument("--dry-run", action="store_true", help="Preview without applying")
    args = parser.parse_args()

    discoverer = RelationshipDiscoverer()

    if args.analyze or args.sample or args.apply:
        relationships = discoverer.discover_all()

        print(f"\n{'='*60}")
        print(f"RELATIONSHIP DISCOVERY RESULTS")
        print(f"{'='*60}")
        print(f"Total relationships discovered: {len(relationships)}")

        by_type = defaultdict(int)
        for rel in relationships:
            by_type[rel["type"]] += 1

        print("\nBy type:")
        for t, count in sorted(by_type.items(), key=lambda x: -x[1]):
            print(f"  {t}: {count}")

        if args.sample:
            print(f"\nSample of {args.sample} discoveries:")
            for rel in relationships[:args.sample]:
                print(f"  {rel['source']} --[{rel['type']}]--> {rel['target']}")
                if rel.get('properties', {}).get('discovered_by'):
                    print(f"    (discovered by: {rel['properties']['discovered_by']})")

        # Save discoveries
        discoverer.save_discoveries()

        if args.apply:
            result = discoverer.apply_to_graph(dry_run=args.dry_run)
            if args.dry_run:
                print(f"\n[DRY RUN] Would add {result['relationships_to_add']} relationships")
            else:
                print(f"\n Applied {result['relationships_added']} relationships!")
                print(f"Total edges: {result['total_edges']}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
