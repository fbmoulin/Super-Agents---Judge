#!/usr/bin/env python3
"""
Brazilian Legal Entity Extractor (NER)
Extracts legal entities from Brazilian judicial texts using regex patterns.

Usage:
    python scripts/graph/entity_extractor.py --input data/stj_raw/documento.txt
    python scripts/graph/entity_extractor.py --text "Conforme Sumula 297 do STJ..."
    python scripts/graph/entity_extractor.py --batch data/stj_chunks/ --output entities.json

Resources:
    - LeNER-Br Dataset for Brazilian Legal NER
    - Pattern-based extraction for structured references
"""

import re
import json
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class Entity:
    """Represents an extracted legal entity."""
    type: str
    value: str
    tribunal: Optional[str]
    normalized_id: str
    start: int
    end: int
    context: str


class BrazilianLegalNER:
    """
    Named Entity Recognition for Brazilian Legal Texts.
    Uses regex patterns to extract structured legal references.
    """

    # Sumula patterns
    SUMULA_PATTERNS = [
        # "Sumula 297 do STJ", "Sumula n. 297/STJ", "Sumula Vinculante 61"
        r'[Ss][úu]mula\s+(?:[Vv]inculante\s+)?(?:n[º°\.]?\s*)?(\d+)\s*(?:(?:do|da|/)\s*(STJ|STF))?',
        # "Enunciado 297 da Sumula do STJ"
        r'[Ee]nunciado\s+(?:n[º°\.]?\s*)?(\d+)\s+d[ao]\s+[Ss][úu]mula\s+d[ao]\s+(STJ|STF)',
        # Back-reference "a referida sumula 297"
        r'(?:a\s+)?referida\s+[Ss][úu]mula\s+(?:n[º°\.]?\s*)?(\d+)',
    ]

    # Tema Repetitivo patterns
    TEMA_PATTERNS = [
        # "Tema 1368 do STJ", "Tema n. 622/STF", "Tema repetitivo 1368"
        r'[Tt]ema\s+(?:[Rr]epetitivo\s+)?(?:n[º°\.]?\s*)?(\d+)\s*(?:(?:do|da|/)\s*(STJ|STF))?',
        # "Recursos Repetitivos - Tema 1368"
        r'[Rr]ecursos?\s+[Rr]epetitivos?\s*[-–]\s*[Tt]ema\s+(\d+)',
        # "no julgamento do Tema 1368"
        r'julgamento\s+d[oa]\s+[Tt]ema\s+(?:n[º°\.]?\s*)?(\d+)',
    ]

    # Artigo patterns
    ARTIGO_PATTERNS = [
        # "art. 186 do CC", "artigo 927 do Codigo Civil", "art. 5o, LXIX da CF"
        r'[Aa]rt(?:igo)?\.?\s*(\d+)(?:[º°])?(?:,?\s*([IVXLCDM]+|\d+))?(?:\s+d[oa]\s+(CC|CDC|CPC|CF|LEF|CTN|CLT|ECA|Lei\s+[\d\.]+(?:/\d+)?))?',
        # "arts. 186 e 927 do CC"
        r'[Aa]rts?\.?\s*(\d+)\s+e\s+(\d+)(?:\s+d[oa]\s+(CC|CDC|CPC|CF))?',
        # "par. 6o do art. 37 da CF"
        r'[Pp]ar(?:[áa]grafo)?\.?\s*(?:([úu]nico|\d+)[º°]?)\s+d[oa]\s+[Aa]rt\.?\s*(\d+)',
    ]

    # Lei patterns
    LEI_PATTERNS = [
        # "Lei 8.078/90", "Lei n. 12.016/2009", "Lei Federal 8.080/1990"
        r'[Ll]ei\s+(?:[Ff]ederal\s+)?(?:n[º°\.]?\s*)?([\d\.]+)(?:/(\d{2,4}))?',
        # "Decreto-Lei 73/66", "DL 73/1966"
        r'(?:[Dd]ecreto-?[Ll]ei|DL)\s+(?:n[º°\.]?\s*)?(\d+)(?:/(\d{2,4}))?',
        # "MP 1.053/95", "Medida Provisoria 2.170-36"
        r'(?:[Mm]edida\s+[Pp]rovis[óo]ria|MP)\s+(?:n[º°\.]?\s*)?([\d\.-]+)(?:/(\d{2,4}))?',
    ]

    # Acordao/Processo patterns
    PROCESSO_PATTERNS = [
        # "REsp 1.234.567/SP", "AgRg no REsp 1234567", "RESP 1234567/RJ"
        r'((?:Ag(?:Rg|Int)?\s+(?:no|nos)\s+)?(?:REsp|RESP|AREsp|AgRg|AI|RE|ARE|ADI|ADC|ADPF|RHC|HC|MS))\s*(?:n[º°\.]?\s*)?([\d\.]+)(?:/([\w]{2}))?',
        # "Processo n. 0001234-56.2024.8.26.0100"
        r'[Pp]rocesso\s+(?:n[º°\.]?\s*)?([\d\.-]+)',
        # "Acao Civil Publica n. 12345"
        r'[Aa][çc][ãa]o\s+[Cc]ivil\s+[Pp][úu]blica\s+(?:n[º°\.]?\s*)?(\d+)',
    ]

    # Tribunal patterns
    TRIBUNAL_PATTERNS = [
        r'\b(STJ|STF|TJ[A-Z]{2}|TRF\d|TST|TSE|STM)\b',
        r'[Ss]uperior\s+[Tt]ribunal\s+de\s+[Jj]usti[çc]a',
        r'[Ss]upremo\s+[Tt]ribunal\s+[Ff]ederal',
    ]

    # Legal concept patterns
    CONCEITO_PATTERNS = [
        r'(dano\s+moral\s+in\s+re\s+ipsa)',
        r'(responsabilidade\s+(?:objetiva|subjetiva))',
        r'(venda\s+casada)',
        r'(anatocismo|capitaliza[çc][ãa]o\s+de\s+juros)',
        r'(direito\s+l[íi]quido\s+e\s+certo)',
        r'(fortuito\s+interno)',
        r'(boa-?f[ée](?:\s+objetiva)?)',
        r'(juros\s+(?:morat[óo]rios|compensat[óo]rios|remunerat[óo]rios))',
        r'(corre[çc][ãa]o\s+monet[áa]ria)',
        r'(SELIC|IPCA(?:-E)?|IGP-?M)',
    ]

    # Code normalization
    CODE_ALIASES = {
        'CC': 'CC',
        'CODIGO CIVIL': 'CC',
        'CÓDIGO CIVIL': 'CC',
        'CDC': 'CDC',
        'CODIGO DE DEFESA DO CONSUMIDOR': 'CDC',
        'CPC': 'CPC',
        'CODIGO DE PROCESSO CIVIL': 'CPC',
        'CF': 'CF',
        'CONSTITUICAO FEDERAL': 'CF',
        'CONSTITUIÇÃO FEDERAL': 'CF',
        'LEF': 'LEF',
        'CTN': 'CTN',
        'CLT': 'CLT',
        'ECA': 'ECA',
    }

    def __init__(self):
        """Initialize the NER extractor with compiled patterns."""
        self.patterns = {
            'sumula': [re.compile(p, re.IGNORECASE | re.UNICODE) for p in self.SUMULA_PATTERNS],
            'tema': [re.compile(p, re.IGNORECASE | re.UNICODE) for p in self.TEMA_PATTERNS],
            'artigo': [re.compile(p, re.IGNORECASE | re.UNICODE) for p in self.ARTIGO_PATTERNS],
            'lei': [re.compile(p, re.IGNORECASE | re.UNICODE) for p in self.LEI_PATTERNS],
            'processo': [re.compile(p, re.IGNORECASE | re.UNICODE) for p in self.PROCESSO_PATTERNS],
            'tribunal': [re.compile(p, re.IGNORECASE | re.UNICODE) for p in self.TRIBUNAL_PATTERNS],
            'conceito': [re.compile(p, re.IGNORECASE | re.UNICODE) for p in self.CONCEITO_PATTERNS],
        }

    def _get_context(self, text: str, start: int, end: int, window: int = 50) -> str:
        """Extract context around a match."""
        ctx_start = max(0, start - window)
        ctx_end = min(len(text), end + window)
        context = text[ctx_start:ctx_end]
        if ctx_start > 0:
            context = '...' + context
        if ctx_end < len(text):
            context = context + '...'
        return context.replace('\n', ' ').strip()

    def _normalize_tribunal(self, tribunal: Optional[str]) -> Optional[str]:
        """Normalize tribunal references."""
        if not tribunal:
            return None
        tribunal = tribunal.upper().strip()
        if tribunal in ['STJ', 'STF']:
            return tribunal
        return tribunal

    def _normalize_code(self, code: Optional[str]) -> Optional[str]:
        """Normalize legal code references."""
        if not code:
            return None
        code = code.upper().strip()
        return self.CODE_ALIASES.get(code, code)

    def extract_sumulas(self, text: str) -> List[Entity]:
        """Extract sumula references from text."""
        entities = []
        for pattern in self.patterns['sumula']:
            for match in pattern.finditer(text):
                groups = match.groups()
                numero = groups[0]
                tribunal = self._normalize_tribunal(groups[1] if len(groups) > 1 else None)

                # Default to STJ if no tribunal specified
                if not tribunal:
                    tribunal = 'STJ'

                normalized_id = f"{tribunal}_{numero}"

                entities.append(Entity(
                    type='Sumula',
                    value=f"Sumula {numero}/{tribunal}",
                    tribunal=tribunal,
                    normalized_id=normalized_id,
                    start=match.start(),
                    end=match.end(),
                    context=self._get_context(text, match.start(), match.end())
                ))

        return self._deduplicate(entities)

    def extract_temas(self, text: str) -> List[Entity]:
        """Extract tema repetitivo references from text."""
        entities = []
        for pattern in self.patterns['tema']:
            for match in pattern.finditer(text):
                groups = match.groups()
                numero = groups[0]
                tribunal = self._normalize_tribunal(groups[1] if len(groups) > 1 else None)

                # Default to STJ if no tribunal specified
                if not tribunal:
                    tribunal = 'STJ'

                normalized_id = f"TEMA_{numero}"

                entities.append(Entity(
                    type='Tema',
                    value=f"Tema {numero}/{tribunal}",
                    tribunal=tribunal,
                    normalized_id=normalized_id,
                    start=match.start(),
                    end=match.end(),
                    context=self._get_context(text, match.start(), match.end())
                ))

        return self._deduplicate(entities)

    def extract_artigos(self, text: str) -> List[Entity]:
        """Extract article references from text."""
        entities = []
        for pattern in self.patterns['artigo']:
            for match in pattern.finditer(text):
                groups = match.groups()

                # Handle different pattern formats
                if len(groups) >= 3:
                    numero = groups[0]
                    inciso = groups[1]
                    codigo = self._normalize_code(groups[2])
                elif len(groups) >= 2:
                    numero = groups[0]
                    inciso = None
                    codigo = self._normalize_code(groups[1])
                else:
                    numero = groups[0]
                    inciso = None
                    codigo = None

                # Build normalized ID
                if codigo:
                    if inciso:
                        normalized_id = f"ARTIGO_{codigo}_Art{numero}_{inciso}"
                        value = f"Art. {numero}, {inciso} do {codigo}"
                    else:
                        normalized_id = f"ARTIGO_{codigo}_Art{numero}"
                        value = f"Art. {numero} do {codigo}"
                else:
                    normalized_id = f"ARTIGO_Art{numero}"
                    value = f"Art. {numero}"

                entities.append(Entity(
                    type='Artigo',
                    value=value,
                    tribunal=None,
                    normalized_id=normalized_id,
                    start=match.start(),
                    end=match.end(),
                    context=self._get_context(text, match.start(), match.end())
                ))

        return self._deduplicate(entities)

    def extract_leis(self, text: str) -> List[Entity]:
        """Extract law references from text."""
        entities = []
        for pattern in self.patterns['lei']:
            for match in pattern.finditer(text):
                groups = match.groups()
                numero = groups[0].replace('.', '')
                ano = groups[1] if len(groups) > 1 and groups[1] else None

                # Normalize year to 4 digits
                if ano and len(ano) == 2:
                    ano = '19' + ano if int(ano) > 50 else '20' + ano

                if ano:
                    normalized_id = f"LEI_{numero}_{ano}"
                    value = f"Lei {numero}/{ano}"
                else:
                    normalized_id = f"LEI_{numero}"
                    value = f"Lei {numero}"

                entities.append(Entity(
                    type='Lei',
                    value=value,
                    tribunal=None,
                    normalized_id=normalized_id,
                    start=match.start(),
                    end=match.end(),
                    context=self._get_context(text, match.start(), match.end())
                ))

        return self._deduplicate(entities)

    def extract_processos(self, text: str) -> List[Entity]:
        """Extract case/process references from text."""
        entities = []
        for pattern in self.patterns['processo']:
            for match in pattern.finditer(text):
                groups = match.groups()

                if len(groups) >= 2:
                    tipo = groups[0].upper().replace(' ', '_')
                    numero = groups[1].replace('.', '').replace('-', '')
                    uf = groups[2].upper() if len(groups) > 2 and groups[2] else None
                else:
                    tipo = 'PROCESSO'
                    numero = groups[0].replace('.', '').replace('-', '')
                    uf = None

                if uf:
                    normalized_id = f"{tipo}_{numero}_{uf}"
                    value = f"{tipo} {numero}/{uf}"
                else:
                    normalized_id = f"{tipo}_{numero}"
                    value = f"{tipo} {numero}"

                entities.append(Entity(
                    type='Processo',
                    value=value,
                    tribunal=None,
                    normalized_id=normalized_id,
                    start=match.start(),
                    end=match.end(),
                    context=self._get_context(text, match.start(), match.end())
                ))

        return self._deduplicate(entities)

    def extract_conceitos(self, text: str) -> List[Entity]:
        """Extract legal concept references from text."""
        entities = []
        for pattern in self.patterns['conceito']:
            for match in pattern.finditer(text):
                value = match.group(1).lower().strip()
                normalized_id = f"CONCEITO_{value.replace(' ', '_').replace('-', '_')}"

                entities.append(Entity(
                    type='Conceito',
                    value=value,
                    tribunal=None,
                    normalized_id=normalized_id,
                    start=match.start(),
                    end=match.end(),
                    context=self._get_context(text, match.start(), match.end())
                ))

        return self._deduplicate(entities)

    def _deduplicate(self, entities: List[Entity]) -> List[Entity]:
        """Remove duplicate entities based on normalized_id and position overlap."""
        if not entities:
            return []

        # Sort by start position
        entities.sort(key=lambda e: (e.start, -e.end))

        # Remove overlapping/duplicate entities
        result = []
        seen_ids = set()
        last_end = -1

        for entity in entities:
            # Skip if overlapping with previous
            if entity.start < last_end:
                continue

            # Skip if same normalized ID already seen
            if entity.normalized_id in seen_ids:
                continue

            seen_ids.add(entity.normalized_id)
            result.append(entity)
            last_end = entity.end

        return result

    def extract_entities(self, text: str) -> Dict[str, List[Entity]]:
        """
        Extract all legal entities from text.

        Args:
            text: Input text to analyze

        Returns:
            Dictionary with entity types as keys and lists of entities as values
        """
        return {
            'sumulas': self.extract_sumulas(text),
            'temas': self.extract_temas(text),
            'artigos': self.extract_artigos(text),
            'leis': self.extract_leis(text),
            'processos': self.extract_processos(text),
            'conceitos': self.extract_conceitos(text)
        }

    def extract_all(self, text: str) -> List[Entity]:
        """Extract all entities as a flat list, sorted by position."""
        entities = self.extract_entities(text)
        all_entities = []
        for entity_list in entities.values():
            all_entities.extend(entity_list)
        return sorted(all_entities, key=lambda e: e.start)


def process_file(file_path: Path, extractor: BrazilianLegalNER) -> Dict[str, Any]:
    """Process a single file and extract entities."""
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    entities = extractor.extract_entities(text)

    return {
        'file': str(file_path),
        'entities': {
            k: [asdict(e) for e in v]
            for k, v in entities.items()
        },
        'stats': {
            k: len(v)
            for k, v in entities.items()
        }
    }


def process_batch(input_dir: Path, extractor: BrazilianLegalNER) -> List[Dict[str, Any]]:
    """Process all JSON files in a directory."""
    results = []

    # Look for JSON chunk files
    json_files = list(input_dir.glob('*.json'))

    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Handle both array and single object
            chunks = data if isinstance(data, list) else [data]

            for chunk in chunks:
                text = chunk.get('text_for_embedding', chunk.get('text', ''))
                if not text:
                    continue

                entities = extractor.extract_entities(text)

                results.append({
                    'source_file': str(json_file),
                    'chunk_id': chunk.get('id', ''),
                    'entities': {
                        k: [asdict(e) for e in v]
                        for k, v in entities.items()
                    },
                    'stats': {
                        k: len(v)
                        for k, v in entities.items()
                    }
                })

        except Exception as e:
            logger.error(f"Error processing {json_file}: {e}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Extract legal entities from Brazilian texts")
    parser.add_argument("--input", type=str, help="Input file path")
    parser.add_argument("--text", type=str, help="Direct text input")
    parser.add_argument("--batch", type=str, help="Input directory for batch processing")
    parser.add_argument("--output", type=str, help="Output JSON file")
    parser.add_argument("--pretty", action="store_true", help="Pretty print JSON output")
    args = parser.parse_args()

    extractor = BrazilianLegalNER()

    if args.text:
        # Process direct text input
        entities = extractor.extract_entities(args.text)
        result = {
            'entities': {k: [asdict(e) for e in v] for k, v in entities.items()},
            'stats': {k: len(v) for k, v in entities.items()}
        }

    elif args.input:
        # Process single file
        result = process_file(Path(args.input), extractor)

    elif args.batch:
        # Batch processing
        result = process_batch(Path(args.batch), extractor)

    else:
        # Demo with example text
        example_text = """
        Conforme estabelece a Sumula 297 do STJ, o Codigo de Defesa do Consumidor
        e aplicavel as instituicoes financeiras. Ademais, o Tema 1368 do STJ
        determinou que a taxa SELIC deve ser aplicada como indice unico de
        atualizacao monetaria, nos termos do art. 406 do Codigo Civil.

        A responsabilidade objetiva das instituicoes financeiras, nos termos do
        art. 14 do CDC, implica em dano moral in re ipsa quando ha fraude bancaria,
        conforme Sumula 479/STJ.

        No REsp 1.234.567/SP, o Superior Tribunal de Justica reafirmou esse
        entendimento com base na Lei 8.078/90.
        """
        entities = extractor.extract_entities(example_text)
        result = {
            'example': True,
            'text_preview': example_text[:200] + '...',
            'entities': {k: [asdict(e) for e in v] for k, v in entities.items()},
            'stats': {k: len(v) for k, v in entities.items()}
        }

    # Output
    indent = 2 if args.pretty else None
    output = json.dumps(result, ensure_ascii=False, indent=indent)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output)
        logger.info(f"Results saved to {args.output}")
    else:
        print(output)


if __name__ == "__main__":
    main()
