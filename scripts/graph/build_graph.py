#!/usr/bin/env python3
"""
Legal Knowledge Graph Builder
Builds and maintains the legal_graph.json from knowledge base files.

Usage:
    python scripts/graph/build_graph.py
    python scripts/graph/build_graph.py --source knowledge_base/ --output knowledge_base/legal_graph.json
    python scripts/graph/build_graph.py --stats
    python scripts/graph/build_graph.py --validate

Requirements:
    pip install python-dotenv
"""

import json
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple
from datetime import datetime
from dataclasses import dataclass, asdict, field
from collections import defaultdict

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
DEFAULT_KB_PATH = Path(__file__).parent.parent.parent / "knowledge_base"
DEFAULT_OUTPUT = DEFAULT_KB_PATH / "legal_graph.json"


@dataclass
class Node:
    """Represents a graph node."""
    id: str
    type: str
    properties: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Edge:
    """Represents a graph edge."""
    source: str
    target: str
    type: str
    properties: Dict[str, Any] = field(default_factory=dict)


class LegalGraphBuilder:
    """Builds the legal knowledge graph from structured knowledge base files."""

    NODE_TYPES = ['Sumula', 'Tema', 'Dominio', 'Artigo', 'Conceito']
    EDGE_TYPES = ['GOVERNS', 'CITES', 'MODIFIES', 'APPLIES_TO', 'REQUIRES', 'RELATED_TO']

    def __init__(self, kb_path: Path):
        self.kb_path = kb_path
        self.nodes: Dict[str, Dict] = {}
        self.edges: List[Dict] = []
        self.errors: List[str] = []

    def load_sumulas(self) -> int:
        """Load sumulas from sumulas.json."""
        sumulas_file = self.kb_path / "sumulas.json"
        if not sumulas_file.exists():
            logger.warning(f"Sumulas file not found: {sumulas_file}")
            return 0

        with open(sumulas_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        count = 0
        for tribunal, sumulas in data.get('sumulas', {}).items():
            for numero, info in sumulas.items():
                node_id = f"{tribunal}_{numero}"
                self.nodes[node_id] = {
                    'id': node_id,
                    'type': 'Sumula',
                    'tribunal': tribunal,
                    'numero': int(numero),
                    'texto': self._normalize_text(info.get('texto', '')),
                    'domains': info.get('domains', []),
                    'keywords': info.get('keywords', [])
                }
                count += 1

        logger.info(f"Loaded {count} sumulas")
        return count

    def load_temas(self) -> int:
        """Load temas from temas_repetitivos.json."""
        temas_file = self.kb_path / "temas_repetitivos.json"
        if not temas_file.exists():
            logger.warning(f"Temas file not found: {temas_file}")
            return 0

        with open(temas_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        count = 0
        for numero, info in data.get('temas', {}).items():
            node_id = f"TEMA_{numero}"

            node = {
                'id': node_id,
                'type': 'Tema',
                'tribunal': info.get('tribunal', 'STJ'),
                'numero': int(numero),
                'situacao': info.get('situacao', 'AFETADO'),
                'tese': self._normalize_text(info.get('tese', '')),
                'domains': info.get('domains', []),
                'keywords': info.get('keywords', []),
                'aplicacao': info.get('aplicacao', '')
            }

            # Add scenario details if present
            detalhamento = info.get('detalhamento', {})
            if detalhamento:
                if 'cenarios' in detalhamento:
                    node['cenarios'] = detalhamento['cenarios']
                if 'vedacoes' in detalhamento:
                    node['vedacoes'] = detalhamento['vedacoes']
                if 'requisitos' in detalhamento:
                    node['requisitos'] = detalhamento['requisitos']
                if 'efeitos' in detalhamento:
                    node['efeitos'] = detalhamento['efeitos']

            self.nodes[node_id] = node
            count += 1

        logger.info(f"Loaded {count} temas")
        return count

    def load_domains(self) -> int:
        """Load domains from domain_mapping.json."""
        domains_file = self.kb_path / "domain_mapping.json"
        if not domains_file.exists():
            logger.warning(f"Domains file not found: {domains_file}")
            return 0

        with open(domains_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        count = 0
        for domain_name, info in data.get('domains', {}).items():
            node_id = f"DOMINIO_{domain_name}"
            self.nodes[node_id] = {
                'id': node_id,
                'type': 'Dominio',
                'nome': domain_name.replace('_', ' ').title(),
                'agente': info.get('agente_especializado', ''),
                'keywords': info.get('keywords', []),
                'base_legal': info.get('base_legal', [])
            }

            # Create REQUIRES edges for sumulas_principais
            for i, sumula_ref in enumerate(info.get('sumulas_principais', []), 1):
                sumula_id = self._normalize_sumula_ref(sumula_ref)
                if sumula_id:
                    self.edges.append({
                        'source': node_id,
                        'target': sumula_id,
                        'type': 'REQUIRES',
                        'properties': {
                            'obrigatoriedade': 'SEMPRE',
                            'prioridade': i
                        }
                    })

            # Create REQUIRES edges for temas_principais
            for i, tema_ref in enumerate(info.get('temas_principais', []), 1):
                tema_id = f"TEMA_{tema_ref}"
                self.edges.append({
                    'source': node_id,
                    'target': tema_id,
                    'type': 'REQUIRES',
                    'properties': {
                        'obrigatoriedade': 'QUANDO_APLICAVEL',
                        'prioridade': i
                    }
                })

            count += 1

        logger.info(f"Loaded {count} domains")
        return count

    def _normalize_sumula_ref(self, ref: str) -> str:
        """Normalize sumula reference to node ID format."""
        ref = str(ref).strip()

        # Handle "297" -> "STJ_297"
        if ref.isdigit():
            return f"STJ_{ref}"

        # Handle "297-STF" or "STF-297"
        if '-' in ref:
            parts = ref.split('-')
            if parts[0].isdigit():
                return f"{parts[1]}_{parts[0]}"
            else:
                return f"{parts[0]}_{parts[1]}"

        # Handle "SV-61" (Sumula Vinculante)
        if ref.upper().startswith('SV'):
            numero = ref.replace('SV', '').replace('-', '').strip()
            return f"STF_SV{numero}"

        return f"STJ_{ref}"

    def _normalize_text(self, text: str) -> str:
        """Normalize text by removing accents for better matching."""
        import unicodedata
        # NFD normalization separates accents from base characters
        nfkd = unicodedata.normalize('NFD', text)
        # Remove combining characters (accents)
        return ''.join(c for c in nfkd if not unicodedata.combining(c))

    def create_artigo_nodes(self) -> int:
        """Create Artigo nodes for common legal articles."""
        artigos = [
            {'codigo': 'CC', 'numero': '186', 'texto': 'Aquele que, por acao ou omissao voluntaria, negligencia ou imprudencia, violar direito e causar dano a outrem, ainda que exclusivamente moral, comete ato ilicito'},
            {'codigo': 'CC', 'numero': '187', 'texto': 'Tambem comete ato ilicito o titular de um direito que, ao exerce-lo, excede manifestamente os limites impostos pelo seu fim economico ou social, pela boa-fe ou pelos bons costumes'},
            {'codigo': 'CC', 'numero': '927', 'texto': 'Aquele que, por ato ilicito, causar dano a outrem, fica obrigado a repara-lo'},
            {'codigo': 'CC', 'numero': '406', 'texto': 'Quando os juros moratorios nao forem convencionados, ou o forem sem taxa estipulada, ou quando provierem de determinacao da lei, serao fixados segundo a taxa que estiver em vigor para a mora do pagamento de impostos devidos a Fazenda Nacional'},
            {'codigo': 'CDC', 'numero': '6', 'texto': 'Sao direitos basicos do consumidor: [...] VI - a efetiva prevencao e reparacao de danos patrimoniais e morais, individuais, coletivos e difusos'},
            {'codigo': 'CDC', 'numero': '14', 'texto': 'O fornecedor de servicos responde, independentemente da existencia de culpa, pela reparacao dos danos causados aos consumidores por defeitos relativos a prestacao dos servicos'},
            {'codigo': 'CF', 'numero': '196', 'texto': 'A saude e direito de todos e dever do Estado, garantido mediante politicas sociais e economicas que visem a reducao do risco de doenca e de outros agravos e ao acesso universal e igualitario as acoes e servicos para sua promocao, protecao e recuperacao'},
            {'codigo': 'CF', 'numero': '5, LXIX', 'texto': 'Conceder-se-a mandado de seguranca para proteger direito liquido e certo, nao amparado por habeas corpus ou habeas data, quando o responsavel pela ilegalidade ou abuso de poder for autoridade publica ou agente de pessoa juridica no exercicio de atribuicoes do Poder Publico'},
        ]

        count = 0
        for artigo in artigos:
            node_id = f"ARTIGO_{artigo['codigo']}_Art{artigo['numero'].replace(', ', '_')}"
            self.nodes[node_id] = {
                'id': node_id,
                'type': 'Artigo',
                'codigo': artigo['codigo'],
                'numero': artigo['numero'],
                'texto': artigo['texto']
            }
            count += 1

        logger.info(f"Created {count} artigo nodes")
        return count

    def create_conceito_nodes(self) -> int:
        """Create Conceito nodes for common legal concepts."""
        conceitos = [
            {'nome': 'Dano Moral In Re Ipsa', 'descricao': 'Dano moral presumido que decorre da propria natureza do ato ilicito, dispensando prova do efetivo prejuizo', 'exemplos': ['negativacao indevida', 'devolucao indevida de cheque', 'uso nao autorizado de imagem']},
            {'nome': 'Responsabilidade Objetiva', 'descricao': 'Responsabilidade civil que independe de culpa, baseada na teoria do risco', 'exemplos': ['relacoes de consumo', 'atividades de risco', 'responsabilidade do Estado']},
            {'nome': 'Venda Casada', 'descricao': 'Pratica abusiva que condiciona a aquisicao de um produto ou servico a aquisicao de outro', 'exemplos': ['seguro em financiamento', 'pacote de servicos bancarios']},
            {'nome': 'Anatocismo', 'descricao': 'Capitalizacao de juros, cobranca de juros sobre juros', 'exemplos': ['juros compostos em contratos bancarios']},
            {'nome': 'Direito Liquido e Certo', 'descricao': 'Direito que pode ser comprovado de plano, mediante prova pre-constituida, sem necessidade de dilacao probatoria', 'exemplos': ['direito a nomeacao em concurso publico dentro das vagas', 'direito a posse em cargo publico']},
        ]

        count = 0
        for conceito in conceitos:
            node_id = f"CONCEITO_{conceito['nome'].lower().replace(' ', '_')}"
            self.nodes[node_id] = {
                'id': node_id,
                'type': 'Conceito',
                'nome': conceito['nome'],
                'descricao': conceito['descricao'],
                'exemplos': conceito['exemplos']
            }
            count += 1

        logger.info(f"Created {count} conceito nodes")
        return count

    def create_governs_edges(self) -> int:
        """Create GOVERNS edges from sumulas/temas to domains."""
        count = 0

        for node_id, node in self.nodes.items():
            if node['type'] not in ['Sumula', 'Tema']:
                continue

            domains = node.get('domains', [])
            for domain in domains:
                domain_id = f"DOMINIO_{domain}"
                if domain_id in self.nodes:
                    self.edges.append({
                        'source': node_id,
                        'target': domain_id,
                        'type': 'GOVERNS',
                        'properties': {
                            'descricao': f"{node['type']} {node.get('numero', '')} governa o dominio {domain}"
                        }
                    })
                    count += 1

        logger.info(f"Created {count} GOVERNS edges")
        return count

    def create_related_edges(self) -> int:
        """Create RELATED_TO edges between sumulas/temas with similar domains or keywords."""
        count = 0
        nodes_list = [(k, v) for k, v in self.nodes.items() if v['type'] in ['Sumula', 'Tema']]

        for i, (id1, node1) in enumerate(nodes_list):
            for id2, node2 in nodes_list[i+1:]:
                # Check for shared domains
                domains1 = set(node1.get('domains', []))
                domains2 = set(node2.get('domains', []))
                shared_domains = domains1 & domains2

                # Check for shared keywords
                keywords1 = set(node1.get('keywords', []))
                keywords2 = set(node2.get('keywords', []))
                shared_keywords = keywords1 & keywords2

                # Create edge if significant overlap
                if len(shared_domains) >= 1 and len(shared_keywords) >= 2:
                    self.edges.append({
                        'source': id1,
                        'target': id2,
                        'type': 'RELATED_TO',
                        'properties': {
                            'shared_domains': list(shared_domains),
                            'shared_keywords': list(shared_keywords)[:5]
                        }
                    })
                    count += 1

        logger.info(f"Created {count} RELATED_TO edges")
        return count

    def create_modifies_edges(self) -> int:
        """Create MODIFIES edges for temas that supersede sumulas."""
        count = 0

        # Known modifications
        modifications = [
            {'source': 'TEMA_1368', 'target': 'STJ_54', 'tipo': 'SUPERA_PARCIALMENTE', 'descricao': 'Tema 1368 modifica aplicacao da Sumula 54 para juros'},
        ]

        for mod in modifications:
            if mod['source'] in self.nodes and mod['target'] in self.nodes:
                self.edges.append({
                    'source': mod['source'],
                    'target': mod['target'],
                    'type': 'MODIFIES',
                    'properties': {
                        'tipo': mod['tipo'],
                        'descricao': mod['descricao']
                    }
                })
                count += 1

        logger.info(f"Created {count} MODIFIES edges")
        return count

    def create_applies_to_edges(self) -> int:
        """Create APPLIES_TO edges from sumulas/temas to concepts."""
        count = 0

        # Known concept applications
        applications = [
            {'source': 'STJ_479', 'target': 'CONCEITO_responsabilidade_objetiva', 'contexto': 'fraude bancaria'},
            {'source': 'STJ_388', 'target': 'CONCEITO_dano_moral_in_re_ipsa', 'contexto': 'devolucao indevida de cheque'},
            {'source': 'STJ_403', 'target': 'CONCEITO_dano_moral_in_re_ipsa', 'contexto': 'uso nao autorizado de imagem'},
            {'source': 'TEMA_972', 'target': 'CONCEITO_venda_casada', 'contexto': 'seguro em financiamento'},
            {'source': 'STJ_539', 'target': 'CONCEITO_anatocismo', 'contexto': 'capitalizacao no SFN'},
            {'source': 'DOMINIO_mandado_seguranca', 'target': 'CONCEITO_direito_liquido_e_certo', 'contexto': 'requisito do MS'},
        ]

        for app in applications:
            if app['source'] in self.nodes and app['target'] in self.nodes:
                self.edges.append({
                    'source': app['source'],
                    'target': app['target'],
                    'type': 'APPLIES_TO',
                    'properties': {
                        'contexto': app['contexto']
                    }
                })
                count += 1

        logger.info(f"Created {count} APPLIES_TO edges")
        return count

    def create_cites_edges(self) -> int:
        """Create CITES edges from sumulas to artigos."""
        count = 0

        # Known citations
        citations = [
            {'source': 'STJ_297', 'target': 'ARTIGO_CDC_Art6'},
            {'source': 'STJ_297', 'target': 'ARTIGO_CDC_Art14'},
            {'source': 'STJ_469', 'target': 'ARTIGO_CDC_Art6'},
            {'source': 'STJ_362', 'target': 'ARTIGO_CC_Art186'},
            {'source': 'TEMA_1368', 'target': 'ARTIGO_CC_Art406'},
            {'source': 'TEMA_1062', 'target': 'ARTIGO_CC_Art186'},
        ]

        for cit in citations:
            if cit['source'] in self.nodes and cit['target'] in self.nodes:
                self.edges.append({
                    'source': cit['source'],
                    'target': cit['target'],
                    'type': 'CITES',
                    'properties': {
                        'tipo': 'BASE_LEGAL'
                    }
                })
                count += 1

        logger.info(f"Created {count} CITES edges")
        return count

    def build(self) -> Dict[str, Any]:
        """Build the complete knowledge graph."""
        logger.info("Building legal knowledge graph...")

        # Load source data
        self.load_sumulas()
        self.load_temas()
        self.load_domains()

        # Create additional nodes
        self.create_artigo_nodes()
        self.create_conceito_nodes()

        # Create edges
        self.create_governs_edges()
        self.create_related_edges()
        self.create_modifies_edges()
        self.create_applies_to_edges()
        self.create_cites_edges()

        # Build final graph structure
        graph = {
            'metadata': {
                'version': '1.0.0',
                'created': datetime.now().strftime('%Y-%m-%d'),
                'lastUpdate': datetime.now().strftime('%Y-%m-%d'),
                'description': 'Legal Knowledge Graph for Brazilian Judicial System',
                'nodeTypes': self.NODE_TYPES,
                'edgeTypes': self.EDGE_TYPES,
                'stats': self._compute_stats()
            },
            'nodes': list(self.nodes.values()),
            'edges': self.edges
        }

        return graph

    def _compute_stats(self) -> Dict[str, Any]:
        """Compute graph statistics."""
        nodes_by_type = defaultdict(int)
        for node in self.nodes.values():
            nodes_by_type[node['type']] += 1

        edges_by_type = defaultdict(int)
        for edge in self.edges:
            edges_by_type[edge['type']] += 1

        return {
            'totalNodes': len(self.nodes),
            'totalEdges': len(self.edges),
            'nodesByType': dict(nodes_by_type),
            'edgesByType': dict(edges_by_type)
        }

    def validate(self) -> List[str]:
        """Validate the graph for consistency."""
        errors = []

        # Check for dangling edges
        node_ids = set(self.nodes.keys())
        for edge in self.edges:
            if edge['source'] not in node_ids:
                errors.append(f"Dangling edge source: {edge['source']}")
            if edge['target'] not in node_ids:
                errors.append(f"Dangling edge target: {edge['target']}")

        # Check for duplicate edges
        edge_keys = set()
        for edge in self.edges:
            key = (edge['source'], edge['target'], edge['type'])
            if key in edge_keys:
                errors.append(f"Duplicate edge: {key}")
            edge_keys.add(key)

        # Check required fields
        for node_id, node in self.nodes.items():
            if not node.get('id'):
                errors.append(f"Node missing id: {node}")
            if not node.get('type'):
                errors.append(f"Node missing type: {node_id}")
            if node['type'] not in self.NODE_TYPES:
                errors.append(f"Invalid node type: {node['type']} for {node_id}")

        return errors


def main():
    parser = argparse.ArgumentParser(description="Build legal knowledge graph")
    parser.add_argument("--source", type=str, default=str(DEFAULT_KB_PATH),
                        help="Knowledge base directory")
    parser.add_argument("--output", type=str, default=str(DEFAULT_OUTPUT),
                        help="Output JSON file")
    parser.add_argument("--stats", action="store_true",
                        help="Only show statistics")
    parser.add_argument("--validate", action="store_true",
                        help="Validate existing graph")
    parser.add_argument("--pretty", action="store_true",
                        help="Pretty print JSON")
    args = parser.parse_args()

    kb_path = Path(args.source)
    output_path = Path(args.output)

    if args.validate:
        # Load and validate existing graph
        if not output_path.exists():
            logger.error(f"Graph file not found: {output_path}")
            return

        with open(output_path, 'r', encoding='utf-8') as f:
            graph = json.load(f)

        builder = LegalGraphBuilder(kb_path)
        builder.nodes = {n['id']: n for n in graph['nodes']}
        builder.edges = graph['edges']

        errors = builder.validate()
        if errors:
            logger.error(f"Validation failed with {len(errors)} errors:")
            for err in errors[:10]:
                logger.error(f"  - {err}")
        else:
            logger.info("Validation passed!")
        return

    # Build graph
    builder = LegalGraphBuilder(kb_path)
    graph = builder.build()

    # Validate
    errors = builder.validate()
    if errors:
        logger.warning(f"Graph has {len(errors)} validation warnings")
        for err in errors[:5]:
            logger.warning(f"  - {err}")

    if args.stats:
        # Only show stats
        print("\n=== Legal Knowledge Graph Statistics ===\n")
        print(f"Total Nodes: {graph['metadata']['stats']['totalNodes']}")
        print(f"Total Edges: {graph['metadata']['stats']['totalEdges']}\n")

        print("Nodes by Type:")
        for node_type, count in sorted(graph['metadata']['stats']['nodesByType'].items(), key=lambda x: -x[1]):
            print(f"  {node_type}: {count}")

        print("\nEdges by Type:")
        for edge_type, count in sorted(graph['metadata']['stats']['edgesByType'].items(), key=lambda x: -x[1]):
            print(f"  {edge_type}: {count}")
    else:
        # Write graph to file
        indent = 2 if args.pretty else None
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(graph, f, ensure_ascii=False, indent=indent)

        logger.info(f"Graph saved to {output_path}")
        print(f"\nGenerated graph with:")
        print(f"  - {graph['metadata']['stats']['totalNodes']} nodes")
        print(f"  - {graph['metadata']['stats']['totalEdges']} edges")


if __name__ == "__main__":
    main()
