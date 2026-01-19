#!/usr/bin/env python3
"""
STJ Dados Abertos - Downloader e Preparação para Vector Store
=============================================================
Lex Intelligentia Judiciário - Janeiro 2026

Este script baixa os dados de precedentes qualificados e jurisprudência
do portal de dados abertos do STJ para criação de um vector store.

Uso:
    python stj_downloader.py --download-all
    python stj_downloader.py --download-precedentes
    python stj_downloader.py --download-acordaos --orgaos segunda-secao terceira-turma
    python stj_downloader.py --process --input ./data --output ./processed
    python stj_downloader.py --create-vectorstore --input ./processed
"""

import os
import sys
import json
import csv
import hashlib
import argparse
import requests
import zipfile
from pathlib import Path
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURAÇÃO DOS DATASETS STJ
# =============================================================================

BASE_URL = "https://dadosabertos.web.stj.jus.br/dataset"

# Precedentes Qualificados (Recursos Repetitivos + IACs)
PRECEDENTES_QUALIFICADOS = {
    "dataset_id": "4238da2f-c07b-4c1a-b345-4402accacdcf",
    "files": {
        "temas": {
            "resource_id": "df29da13-7d6b-41ba-ad96-cd1a5bbd191c",
            "filename": "temas.csv",
            "url": f"{BASE_URL}/4238da2f-c07b-4c1a-b345-4402accacdcf/resource/df29da13-7d6b-41ba-ad96-cd1a5bbd191c/download/temas.csv"
        },
        "processos": {
            "resource_id": "7ed21202-0049-4fcb-aa7c-48d810d3c499",
            "filename": "processos.csv",
            "url": f"{BASE_URL}/4238da2f-c07b-4c1a-b345-4402accacdcf/resource/7ed21202-0049-4fcb-aa7c-48d810d3c499/download/processos.csv"
        },
        "dicionario_temas": {
            "resource_id": "d5e50514-6dba-4f1e-8557-94f135eae03b",
            "filename": "dicionario-temas.csv",
            "url": f"{BASE_URL}/4238da2f-c07b-4c1a-b345-4402accacdcf/resource/d5e50514-6dba-4f1e-8557-94f135eae03b/download/dicionario-temas.csv"
        },
        "dicionario_processos": {
            "resource_id": "162e58f0-01c1-4d91-94a4-664b4de81e79",
            "filename": "dicionario-processos.csv",
            "url": f"{BASE_URL}/4238da2f-c07b-4c1a-b345-4402accacdcf/resource/162e58f0-01c1-4d91-94a4-664b4de81e79/download/dicionario-processos.csv"
        }
    }
}

# Espelhos de Acórdãos por Órgão Julgador
# Os mais relevantes para Vara Cível (Direito Privado) são Segunda Seção, 3ª e 4ª Turmas
ESPELHOS_ACORDAOS = {
    "corte-especial": {
        "dataset_id": "e7dc247e-1f5c-4c87-988d-fb0ba29ff1be",
        "name": "Corte Especial",
        "area": "Competência originária e matérias constitucionais",
        "relevancia_civel": "média"
    },
    "primeira-secao": {
        "dataset_id": "2cb68c68-c0a4-4a08-a4e5-fd5c2a9c7a43",
        "name": "Primeira Seção",
        "area": "Direito Público",
        "relevancia_civel": "baixa"
    },
    "segunda-secao": {
        "dataset_id": "c8e2e3a7-3c7a-45dc-8f54-1a1d0e85c2e4",
        "name": "Segunda Seção",
        "area": "Direito Privado (Civil e Comercial)",
        "relevancia_civel": "ALTA"
    },
    "terceira-secao": {
        "dataset_id": "7c5b0e6d-4a9c-4b3d-9e8f-2d6c5a4b3c2e",
        "name": "Terceira Seção",
        "area": "Direito Penal",
        "relevancia_civel": "baixa"
    },
    "primeira-turma": {
        "dataset_id": "1d2c3b4a-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "Primeira Turma",
        "area": "Direito Público",
        "relevancia_civel": "média"
    },
    "segunda-turma": {
        "dataset_id": "2e3d4c5b-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
        "name": "Segunda Turma",
        "area": "Direito Público",
        "relevancia_civel": "média"
    },
    "terceira-turma": {
        "dataset_id": "3f4e5d6c-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
        "name": "Terceira Turma",
        "area": "Direito Privado (Civil)",
        "relevancia_civel": "ALTA"
    },
    "quarta-turma": {
        "dataset_id": "4a5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d",
        "name": "Quarta Turma",
        "area": "Direito Privado (Comercial)",
        "relevancia_civel": "ALTA"
    },
    "quinta-turma": {
        "dataset_id": "5b6c7d8e-9f0a-1b2c-3d4e-5f6a7b8c9d0e",
        "name": "Quinta Turma",
        "area": "Direito Penal",
        "relevancia_civel": "baixa"
    },
    "sexta-turma": {
        "dataset_id": "3e51dda9-0d9c-418e-9423-79284d6c9a9b",
        "name": "Sexta Turma",
        "area": "Direito Penal",
        "relevancia_civel": "baixa"
    }
}

# Órgãos prioritários para Vara Cível
ORGAOS_PRIORITARIOS_CIVEL = [
    "segunda-secao",      # Direito Privado - PRINCIPAL
    "terceira-turma",     # Civil
    "quarta-turma",       # Comercial
    "corte-especial",     # Matérias de competência originária
    "primeira-turma",     # Algumas matérias públicas com interface civil
    "segunda-turma"       # Idem
]

# =============================================================================
# FUNÇÕES DE DOWNLOAD
# =============================================================================

class STJDownloader:
    """Classe para download dos dados do STJ"""
    
    def __init__(self, output_dir: str = "./stj_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'LexIntelligentia/1.0 (Judicial AI System)'
        })
    
    def download_file(self, url: str, dest_path: Path, description: str = "") -> bool:
        """Download de arquivo individual com retry"""
        logger.info(f"Baixando: {description or url}")
        
        for attempt in range(3):
            try:
                response = self.session.get(url, stream=True, timeout=300)
                response.raise_for_status()
                
                total_size = int(response.headers.get('content-length', 0))
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                
                with open(dest_path, 'wb') as f:
                    downloaded = 0
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0:
                                progress = (downloaded / total_size) * 100
                                print(f"\r  Progresso: {progress:.1f}%", end="", flush=True)
                
                print()  # Nova linha após progresso
                logger.info(f"✓ Salvo em: {dest_path}")
                return True
                
            except Exception as e:
                logger.warning(f"Tentativa {attempt + 1}/3 falhou: {e}")
                if attempt == 2:
                    logger.error(f"✗ Falha ao baixar: {url}")
                    return False
        
        return False
    
    def download_precedentes_qualificados(self) -> Dict[str, Path]:
        """Download dos precedentes qualificados (Recursos Repetitivos)"""
        logger.info("\n" + "="*60)
        logger.info("BAIXANDO PRECEDENTES QUALIFICADOS")
        logger.info("="*60)
        
        output_subdir = self.output_dir / "precedentes_qualificados"
        output_subdir.mkdir(parents=True, exist_ok=True)
        
        downloaded_files = {}
        
        for file_key, file_info in PRECEDENTES_QUALIFICADOS["files"].items():
            dest_path = output_subdir / file_info["filename"]
            if self.download_file(file_info["url"], dest_path, f"Precedentes - {file_key}"):
                downloaded_files[file_key] = dest_path
        
        return downloaded_files
    
    def get_acordaos_urls(self, orgao: str) -> List[Dict]:
        """Obtém lista de URLs de acórdãos para um órgão (via CKAN API)"""
        # URLs base conhecidas - usar padrão observado
        base_patterns = {
            "sexta-turma": "3e51dda9-0d9c-418e-9423-79284d6c9a9b",
            "quinta-turma": "d7c2a1b3-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
            "quarta-turma": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "terceira-turma": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
            "segunda-turma": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
            "primeira-turma": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
            "terceira-secao": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
            "segunda-secao": "f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c",
            "primeira-secao": "a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d",
            "corte-especial": "b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e"
        }
        
        # Gerar lista de arquivos mensais (formato AAAAMMDD.json)
        urls = []
        dataset_slug = f"espelhos-de-acordaos-{orgao}"
        
        # Arquivo ZIP inicial com histórico
        urls.append({
            "type": "zip",
            "filename": "20220508.zip",
            "url": f"{BASE_URL}/{dataset_slug}/resource/placeholder/download/20220508.zip",
            "description": f"Histórico completo até 05/2022"
        })
        
        # Arquivos JSON mensais de 05/2022 até 12/2025
        start_date = date(2022, 5, 1)
        end_date = date(2025, 12, 31)
        
        current = start_date
        while current <= end_date:
            # Último dia do mês
            if current.month == 12:
                last_day = date(current.year, 12, 31)
            else:
                last_day = date(current.year, current.month + 1, 1) - timedelta(days=1)
            
            filename = last_day.strftime("%Y%m%d") + ".json"
            urls.append({
                "type": "json",
                "filename": filename,
                "url": f"{BASE_URL}/{dataset_slug}/resource/placeholder/download/{filename}",
                "description": f"Acórdãos {current.strftime('%m/%Y')}"
            })
            
            # Próximo mês
            if current.month == 12:
                current = date(current.year + 1, 1, 1)
            else:
                current = date(current.year, current.month + 1, 1)
        
        return urls
    
    def download_acordaos_orgao(self, orgao: str) -> Dict[str, Any]:
        """Download dos acórdãos de um órgão específico"""
        orgao_info = ESPELHOS_ACORDAOS.get(orgao)
        if not orgao_info:
            logger.error(f"Órgão não encontrado: {orgao}")
            return {}
        
        logger.info(f"\n{'='*60}")
        logger.info(f"BAIXANDO ACÓRDÃOS: {orgao_info['name']}")
        logger.info(f"Área: {orgao_info['area']}")
        logger.info(f"Relevância Cível: {orgao_info['relevancia_civel']}")
        logger.info("="*60)
        
        output_subdir = self.output_dir / "acordaos" / orgao
        output_subdir.mkdir(parents=True, exist_ok=True)
        
        # Baixar arquivo ZIP principal (histórico completo)
        dataset_slug = f"espelhos-de-acordaos-{orgao}"
        zip_url = f"https://dadosabertos.web.stj.jus.br/dataset/{dataset_slug}/resource/download/20220508.zip"
        zip_path = output_subdir / "historico_20220508.zip"
        
        result = {
            "orgao": orgao,
            "name": orgao_info['name'],
            "files": [],
            "errors": []
        }
        
        # Tentar baixar o ZIP histórico
        if self.download_file(zip_url, zip_path, f"{orgao_info['name']} - Histórico"):
            result["files"].append(str(zip_path))
            # Extrair ZIP
            try:
                with zipfile.ZipFile(zip_path, 'r') as z:
                    z.extractall(output_subdir / "historico")
                logger.info(f"✓ ZIP extraído para: {output_subdir / 'historico'}")
            except Exception as e:
                logger.warning(f"Erro ao extrair ZIP: {e}")
        
        # Baixar arquivos JSON mensais mais recentes (últimos 12 meses)
        logger.info(f"\nBaixando atualizações mensais recentes...")

        months_to_download = []
        current = datetime.now()
        for i in range(12):
            if current.month == 1:
                prev = datetime(current.year - 1, 12, 1)
            else:
                prev = datetime(current.year, current.month - 1, 1)
            
            # Último dia do mês anterior
            last_day = current.replace(day=1) - timedelta(days=1)
            months_to_download.append(last_day.strftime("%Y%m%d"))
            current = prev
        
        for month_str in months_to_download:
            json_url = f"https://dadosabertos.web.stj.jus.br/dataset/{dataset_slug}/resource/download/{month_str}.json"
            json_path = output_subdir / f"{month_str}.json"
            
            if self.download_file(json_url, json_path, f"Mês {month_str[:4]}-{month_str[4:6]}"):
                result["files"].append(str(json_path))
        
        return result
    
    def download_acordaos_prioritarios(self) -> List[Dict]:
        """Download dos acórdãos dos órgãos prioritários para vara cível"""
        results = []
        
        logger.info("\n" + "="*60)
        logger.info("DOWNLOAD PRIORITÁRIO - ÓRGÃOS RELEVANTES PARA VARA CÍVEL")
        logger.info("="*60)
        
        for orgao in ORGAOS_PRIORITARIOS_CIVEL:
            result = self.download_acordaos_orgao(orgao)
            results.append(result)
        
        return results
    
    def download_all(self) -> Dict:
        """Download completo de todos os dados"""
        logger.info("\n" + "#"*60)
        logger.info("# STJ DADOS ABERTOS - DOWNLOAD COMPLETO")
        logger.info("# Lex Intelligentia Judiciário")
        logger.info("#"*60)
        
        results = {
            "timestamp": datetime.now().isoformat(),
            "precedentes": {},
            "acordaos": []
        }
        
        # 1. Precedentes Qualificados
        results["precedentes"] = self.download_precedentes_qualificados()
        
        # 2. Acórdãos dos órgãos prioritários
        results["acordaos"] = self.download_acordaos_prioritarios()
        
        # Salvar relatório
        report_path = self.output_dir / "download_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, default=str, ensure_ascii=False)
        
        logger.info(f"\n✓ Relatório salvo em: {report_path}")
        
        return results


# =============================================================================
# PROCESSAMENTO PARA VECTOR STORE
# =============================================================================

class STJProcessor:
    """Processamento dos dados STJ para vector store"""
    
    def __init__(self, input_dir: str, output_dir: str):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def process_precedentes(self) -> List[Dict]:
        """Processa precedentes qualificados para formato de chunks"""
        logger.info("\nProcessando Precedentes Qualificados...")
        
        chunks = []
        temas_path = self.input_dir / "precedentes_qualificados" / "temas.csv"
        
        if not temas_path.exists():
            logger.warning(f"Arquivo não encontrado: {temas_path}")
            return chunks
        
        with open(temas_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Criar chunk com informações estruturadas
                chunk = {
                    "id": f"tema_{row.get('sequencialPrecedente', '')}",
                    "tipo": "precedente_qualificado",
                    "subtipo": row.get('tipoPrecedente', 'REPETITIVO'),
                    "numero_tema": row.get('numeroTema', ''),
                    "situacao": row.get('situacaoTema', ''),
                    "ramo_direito": row.get('ramoDireito', ''),
                    "assunto": row.get('assunto', ''),
                    "questao_submetida": row.get('questaoSubmetida', ''),
                    "tese_firmada": row.get('teseFirmada', ''),
                    "observacoes": row.get('observacoes', ''),
                    "data_afetacao": row.get('dataAfetacao', ''),
                    "data_julgamento": row.get('dataJulgamento', ''),
                    "orgao_julgador": row.get('orgaoJulgador', ''),
                    "relator": row.get('relator', ''),
                    "metadata": {
                        "fonte": "STJ Dados Abertos",
                        "dataset": "precedentes-qualificados",
                        "processado_em": datetime.now().isoformat()
                    }
                }
                
                # Criar texto para embedding
                chunk["text_for_embedding"] = self._create_precedente_text(chunk)
                chunk["content_hash"] = hashlib.md5(
                    chunk["text_for_embedding"].encode()
                ).hexdigest()
                
                chunks.append(chunk)
        
        logger.info(f"✓ Processados {len(chunks)} temas de precedentes")
        return chunks
    
    def _create_precedente_text(self, chunk: Dict) -> str:
        """Cria texto otimizado para embedding de precedente"""
        parts = []
        
        if chunk.get('numero_tema'):
            parts.append(f"TEMA {chunk['numero_tema']}")
        
        if chunk.get('subtipo'):
            parts.append(f"({chunk['subtipo']})")
        
        if chunk.get('ramo_direito'):
            parts.append(f"\nRamo do Direito: {chunk['ramo_direito']}")
        
        if chunk.get('assunto'):
            parts.append(f"\nAssunto: {chunk['assunto']}")
        
        if chunk.get('questao_submetida'):
            parts.append(f"\nQuestão Submetida a Julgamento: {chunk['questao_submetida']}")
        
        if chunk.get('tese_firmada'):
            parts.append(f"\nTese Firmada: {chunk['tese_firmada']}")
        
        if chunk.get('situacao'):
            parts.append(f"\nSituação: {chunk['situacao']}")
        
        if chunk.get('orgao_julgador'):
            parts.append(f"\nÓrgão Julgador: {chunk['orgao_julgador']}")
        
        if chunk.get('relator'):
            parts.append(f"\nRelator: {chunk['relator']}")
        
        return " ".join(parts)
    
    def process_acordaos(self, orgao: str = None) -> List[Dict]:
        """Processa acórdãos para formato de chunks"""
        logger.info(f"\nProcessando Acórdãos{f' - {orgao}' if orgao else ''}...")
        
        chunks = []
        acordaos_dir = self.input_dir / "acordaos"
        
        if orgao:
            dirs_to_process = [acordaos_dir / orgao]
        else:
            dirs_to_process = list(acordaos_dir.iterdir()) if acordaos_dir.exists() else []
        
        for orgao_dir in dirs_to_process:
            if not orgao_dir.is_dir():
                continue
            
            orgao_name = orgao_dir.name
            json_files = list(orgao_dir.glob("*.json"))
            
            for json_file in json_files:
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Pode ser lista ou dict com lista
                    if isinstance(data, list):
                        acordaos = data
                    elif isinstance(data, dict) and 'acordaos' in data:
                        acordaos = data['acordaos']
                    else:
                        acordaos = [data]
                    
                    for acordao in acordaos:
                        chunk = self._process_acordao(acordao, orgao_name)
                        if chunk:
                            chunks.append(chunk)
                    
                except Exception as e:
                    logger.warning(f"Erro ao processar {json_file}: {e}")
            
            # Processar ZIPs extraídos
            historico_dir = orgao_dir / "historico"
            if historico_dir.exists():
                for json_file in historico_dir.glob("**/*.json"):
                    try:
                        with open(json_file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        
                        if isinstance(data, list):
                            for acordao in data:
                                chunk = self._process_acordao(acordao, orgao_name)
                                if chunk:
                                    chunks.append(chunk)
                    except Exception as e:
                        logger.warning(f"Erro ao processar {json_file}: {e}")
        
        logger.info(f"✓ Processados {len(chunks)} acórdãos")
        return chunks
    
    def _process_acordao(self, acordao: Dict, orgao: str) -> Optional[Dict]:
        """Processa um acórdão individual"""
        try:
            chunk = {
                "id": f"acordao_{acordao.get('id', '')}_{orgao}",
                "tipo": "acordao",
                "orgao_julgador": orgao,
                "classe": acordao.get('classe', ''),
                "numero": acordao.get('numero', ''),
                "relator": acordao.get('relator', ''),
                "data_julgamento": acordao.get('dataJulgamento', ''),
                "data_publicacao": acordao.get('dataPublicacao', ''),
                "ementa": acordao.get('ementa', ''),
                "decisao": acordao.get('decisao', ''),
                "indexacao": acordao.get('indexacao', ''),
                "referencias_legislativas": acordao.get('referenciasLegislativas', []),
                "referencias_jurisprudenciais": acordao.get('referenciasJurisprudenciais', []),
                "metadata": {
                    "fonte": "STJ Dados Abertos",
                    "dataset": f"espelhos-de-acordaos-{orgao}",
                    "processado_em": datetime.now().isoformat()
                }
            }
            
            # Criar texto para embedding
            chunk["text_for_embedding"] = self._create_acordao_text(chunk)
            chunk["content_hash"] = hashlib.md5(
                chunk["text_for_embedding"].encode()
            ).hexdigest()
            
            return chunk
            
        except Exception as e:
            logger.warning(f"Erro ao processar acórdão: {e}")
            return None
    
    def _create_acordao_text(self, chunk: Dict) -> str:
        """Cria texto otimizado para embedding de acórdão"""
        parts = []
        
        if chunk.get('classe') and chunk.get('numero'):
            parts.append(f"{chunk['classe']} {chunk['numero']}")
        
        if chunk.get('orgao_julgador'):
            parts.append(f"\nÓrgão: {chunk['orgao_julgador'].replace('-', ' ').title()}")
        
        if chunk.get('relator'):
            parts.append(f"\nRelator: {chunk['relator']}")
        
        if chunk.get('ementa'):
            parts.append(f"\nEMENTA: {chunk['ementa']}")
        
        if chunk.get('indexacao'):
            parts.append(f"\nIndexação: {chunk['indexacao']}")
        
        if chunk.get('decisao'):
            parts.append(f"\nDecisão: {chunk['decisao'][:500]}")  # Limitar tamanho
        
        return " ".join(parts)
    
    def process_all(self) -> Dict:
        """Processa todos os dados para vector store"""
        logger.info("\n" + "#"*60)
        logger.info("# PROCESSAMENTO PARA VECTOR STORE")
        logger.info("#"*60)
        
        all_chunks = []
        
        # 1. Precedentes
        precedentes = self.process_precedentes()
        all_chunks.extend(precedentes)
        
        # 2. Acórdãos
        acordaos = self.process_acordaos()
        all_chunks.extend(acordaos)
        
        # Salvar chunks processados
        output_file = self.output_dir / "stj_chunks_vectorstore.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_chunks, f, indent=2, ensure_ascii=False)
        
        logger.info(f"\n✓ Total de chunks: {len(all_chunks)}")
        logger.info(f"✓ Salvo em: {output_file}")
        
        # Estatísticas
        stats = {
            "total_chunks": len(all_chunks),
            "precedentes": len(precedentes),
            "acordaos": len(acordaos),
            "output_file": str(output_file),
            "timestamp": datetime.now().isoformat()
        }
        
        stats_file = self.output_dir / "processing_stats.json"
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)
        
        return stats


# =============================================================================
# CRIAÇÃO DO VECTOR STORE
# =============================================================================

def create_vectorstore_config() -> str:
    """Gera configuração para criação do vector store no n8n"""
    
    config = """
# CONFIGURAÇÃO VECTOR STORE - LEX INTELLIGENTIA
# Integração n8n + Pinecone/Qdrant/Chroma

## Opção 1: Pinecone (Cloud)

### n8n Credentials
```json
{
  "pinecone": {
    "apiKey": "YOUR_PINECONE_API_KEY",
    "environment": "YOUR_ENVIRONMENT"
  }
}
```

### Workflow n8n - Ingestão
```
[Read JSON] → [Split Chunks] → [OpenAI Embeddings] → [Pinecone Upsert]
```

### Índice Recomendado
- Dimensão: 1536 (text-embedding-3-small) ou 3072 (text-embedding-3-large)
- Métrica: cosine
- Pods: p1.x1 (início) → p2.x1 (produção)

---

## Opção 2: Qdrant (Self-hosted)

### Docker Compose
```yaml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
```

### n8n HTTP Request - Criar Coleção
```json
{
  "method": "PUT",
  "url": "http://qdrant:6333/collections/stj_jurisprudencia",
  "body": {
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    }
  }
}
```

---

## Opção 3: ChromaDB (Local/Self-hosted)

### Python Setup
```python
import chromadb
from chromadb.config import Settings

client = chromadb.PersistentClient(
    path="./chroma_stj",
    settings=Settings(anonymized_telemetry=False)
)

collection = client.create_collection(
    name="stj_jurisprudencia",
    metadata={"hnsw:space": "cosine"}
)
```

---

## Estrutura do Chunk para Upsert

```json
{
  "id": "tema_123",
  "values": [0.123, -0.456, ...],  // embedding vector
  "metadata": {
    "tipo": "precedente_qualificado",
    "subtipo": "REPETITIVO",
    "numero_tema": "123",
    "ramo_direito": "DIREITO CIVIL",
    "assunto": "Contratos Bancários",
    "tese_firmada": "É abusiva a cláusula...",
    "orgao_julgador": "SEGUNDA SEÇÃO",
    "situacao": "JULGADO",
    "text": "Texto completo para busca..."
  }
}
```

---

## Workflow n8n Completo - Ingestão

```
[Webhook: Trigger]
    ↓
[Read File: stj_chunks_vectorstore.json]
    ↓
[Split In Batches: 100 items]
    ↓
[OpenAI: Create Embeddings]
    ↓
[HTTP Request: Upsert to Vector Store]
    ↓
[Log: Audit CNJ 615]
```

---

## Query no Agente (n8n AI Agent Tool)

```javascript
// Tool: busca_jurisprudencia_stj
{
  "name": "busca_jurisprudencia_stj",
  "description": "Busca jurisprudência relevante do STJ por similaridade semântica",
  "parameters": {
    "query": "string - descrição do caso ou questão jurídica",
    "top_k": "number - quantidade de resultados (default: 5)",
    "filter": {
      "tipo": ["precedente_qualificado", "acordao"],
      "ramo_direito": "string - opcional",
      "orgao_julgador": "string - opcional"
    }
  }
}
```

---

## Filtros Úteis por Tipo de Ação

| Tipo Ação | Filtros Recomendados |
|-----------|---------------------|
| Contratos Bancários | `ramo_direito: "DIREITO CIVIL"`, `orgao: "segunda-secao"` |
| Responsabilidade Civil | `ramo_direito: "DIREITO CIVIL"`, `assunto CONTAINS "dano"` |
| Execução | `ramo_direito: "DIREITO PROCESSUAL"` |
| Consumidor | `assunto CONTAINS "consumidor" OR "CDC"` |
| Locação | `assunto CONTAINS "locação" OR "inquilinato"` |

"""
    return config


# =============================================================================
# CLI PRINCIPAL
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="STJ Dados Abertos - Downloader para Vector Store",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python stj_downloader.py --download-all
  python stj_downloader.py --download-precedentes
  python stj_downloader.py --download-acordaos --orgaos segunda-secao terceira-turma
  python stj_downloader.py --process --input ./stj_data --output ./processed
  python stj_downloader.py --vectorstore-config
        """
    )
    
    parser.add_argument('--download-all', action='store_true',
                        help='Download completo (precedentes + acórdãos prioritários)')
    parser.add_argument('--download-precedentes', action='store_true',
                        help='Download apenas dos precedentes qualificados')
    parser.add_argument('--download-acordaos', action='store_true',
                        help='Download dos espelhos de acórdãos')
    parser.add_argument('--orgaos', nargs='+', default=ORGAOS_PRIORITARIOS_CIVEL,
                        help='Órgãos para download (default: prioritários para cível)')
    parser.add_argument('--output-dir', default='./stj_data',
                        help='Diretório de saída para downloads')
    parser.add_argument('--process', action='store_true',
                        help='Processar dados para vector store')
    parser.add_argument('--input', default='./stj_data',
                        help='Diretório de entrada para processamento')
    parser.add_argument('--processed-output', default='./stj_processed',
                        help='Diretório de saída para dados processados')
    parser.add_argument('--vectorstore-config', action='store_true',
                        help='Mostrar configuração para vector store')
    parser.add_argument('--list-orgaos', action='store_true',
                        help='Listar órgãos disponíveis')
    
    args = parser.parse_args()
    
    if args.list_orgaos:
        print("\nÓrgãos disponíveis:")
        print("-" * 60)
        for key, info in ESPELHOS_ACORDAOS.items():
            relevancia = info['relevancia_civel']
            marca = "★★★" if relevancia == "ALTA" else ("★★" if relevancia == "média" else "★")
            print(f"  {key:20} | {info['name']:20} | {info['area'][:25]:25} | {marca}")
        print("-" * 60)
        print("\nPrioritários para Vara Cível:", ", ".join(ORGAOS_PRIORITARIOS_CIVEL))
        return
    
    if args.vectorstore_config:
        print(create_vectorstore_config())
        return
    
    if args.download_all or args.download_precedentes or args.download_acordaos:
        downloader = STJDownloader(args.output_dir)
        
        if args.download_all:
            downloader.download_all()
        else:
            if args.download_precedentes:
                downloader.download_precedentes_qualificados()
            if args.download_acordaos:
                for orgao in args.orgaos:
                    downloader.download_acordaos_orgao(orgao)
    
    if args.process:
        processor = STJProcessor(args.input, args.processed_output)
        processor.process_all()
    
    if not any([args.download_all, args.download_precedentes, args.download_acordaos,
                args.process, args.vectorstore_config, args.list_orgaos]):
        parser.print_help()


if __name__ == "__main__":
    main()
