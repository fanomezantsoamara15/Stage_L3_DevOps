#!/usr/bin/env python3
"""
Configuration de sécurité pour la protection contre les téléchargeurs automatiques
Modifiez ces paramètres selon vos besoins de sécurité
"""

import os

# Configuration générale
SECURITY_CONFIG = {
    # Niveau de protection (LOW, MEDIUM, HIGH, PARANOID)
    'SECURITY_LEVEL': 'HIGH',

    # Logging
    'LOG_SECURITY_EVENTS': True,
    'LOG_FILE': 'security.log',
    'LOG_LEVEL': 'WARNING',

    # Détection des téléchargeurs
    'BLOCK_DOWNLOAD_MANAGERS': True,
    'STRICT_USER_AGENT_CHECK': True,

    # Protection côté client
    'DISABLE_RIGHT_CLICK': True,
    'DISABLE_KEYBOARD_SHORTCUTS': True,
    'DETECT_DEVTOOLS': True,

    # Limites de débit
    'RATE_LIMITING': {
        'ENABLED': True,
        'REQUESTS_PER_MINUTE': 30,
        'BURST_LIMIT': 10
    },

    # Alertes
    'ALERT_THRESHOLDS': {
        'MAX_VIOLATIONS_PER_HOUR': 5,
        'MAX_REQUESTS_PER_MINUTE': 20,
        'SUSPICIOUS_PATTERNS_THRESHOLD': 3
    },

    # Liste des téléchargeurs à bloquer
    'BLOCKED_DOWNLOADERS': [
        # Gestionnaires de téléchargement populaires
        'idm', 'internet download manager', 'idm/', 'idman',
        'jdownloader', 'jdownloader2', 'jdownloader/',
        'eagleget', 'eagleget/',
        'flashget', 'flashget/',
        'orbit downloader', 'orbit/',
        'free download manager', 'fdm/',
        'wget', 'wget/',
        'curl', 'curl/',
        'aria2', 'aria2/',
        'axel', 'axel/',
        'httrack', 'httrack/',
        'teleport', 'teleport/',
        'webcopier', 'webcopier/',
        'offline explorer', 'offline/',
        'mass downloader', 'mass/',
        'download accelerator', 'dap/',
        'getright', 'getright/',
        'goclone', 'goclone/',

        # Bots et scrapers
        'sqlmap', 'sqlmap/',
        'nikto', 'nikto/',
        'nessus', 'nessus/',
        'openvas', 'openvas/',
        'nmap', 'nmap/',
        'masscan', 'masscan/',
        'zgrab', 'zgrab/',
        'gobuster', 'gobuster/',
        'dirbuster', 'dirbuster/',
        'dirb', 'dirb/',
        'owasp', 'owasp/',

        # User-Agents suspects
        'python-requests', 'requests/',
        'scrapy', 'scrapy/',
        'beautifulsoup', 'beautifulsoup/',
        'selenium', 'selenium/',
        'phantomjs', 'phantomjs/',
        'headless', 'headlesschrome', 'headlessfirefox',
        'bot', 'spider', 'crawler', 'scraper',
        'harvest', 'harvest/',
        'collect', 'collect/',
        'archive', 'archive/',
        'backup', 'backup/',
    ],

    # Patterns suspects dans les User-Agents
    'SUSPICIOUS_PATTERNS': [
        r'download.*manager',
        r'wget\/\d+\.\d+',
        r'curl\/\d+\.\d+',
        r'python.*requests',
        r'java\/\d+\.\d+',
        r'go-http-client',
        r'okhttp\/\d+\.\d+',
        r'libcurl\/\d+\.\d+',
        r'bot\/\d+\.\d+',
        r'spider\/\d+\.\d+',
        r'scraper\/\d+\.\d+',
    ],

    # Headers de sécurité
    'SECURITY_HEADERS': {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },

    # Configuration PDF.js
    'PDFJS_CONFIG': {
        'WORKER_URL': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
        'CMAP_URL': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        'DISABLE_AUTO_FETCH': True,
        'DISABLE_STREAM': True,
        'DISABLE_RANGE': False,
    }
}

def get_security_level_config():
    """Retourne la configuration selon le niveau de sécurité"""
    level = SECURITY_CONFIG['SECURITY_LEVEL'].upper()

    if level == 'PARANOID':
        return {
            'block_all_bots': True,
            'require_captcha': True,
            'session_timeout': 300,  # 5 minutes
            'max_file_size': 5 * 1024 * 1024,  # 5MB
            'allowed_origins': [],  # Aucun origine externe
        }
    elif level == 'HIGH':
        return {
            'block_all_bots': True,
            'require_captcha': False,
            'session_timeout': 1800,  # 30 minutes
            'max_file_size': 50 * 1024 * 1024,  # 50MB
            'allowed_origins': ['localhost', '127.0.0.1'],
        }
    elif level == 'MEDIUM':
        return {
            'block_all_bots': False,
            'require_captcha': False,
            'session_timeout': 3600,  # 1 heure
            'max_file_size': 100 * 1024 * 1024,  # 100MB
            'allowed_origins': ['*'],
        }
    else:  # LOW
        return {
            'block_all_bots': False,
            'require_captcha': False,
            'session_timeout': 7200,  # 2 heures
            'max_file_size': 500 * 1024 * 1024,  # 500MB
            'allowed_origins': ['*'],
        }

def load_config_from_env():
    """Charge la configuration depuis les variables d'environnement"""
    if 'SECURITY_LEVEL' in os.environ:
        SECURITY_CONFIG['SECURITY_LEVEL'] = os.environ['SECURITY_LEVEL']

    if 'BLOCK_DOWNLOAD_MANAGERS' in os.environ:
        SECURITY_CONFIG['BLOCK_DOWNLOAD_MANAGERS'] = os.environ['BLOCK_DOWNLOAD_MANAGERS'].lower() == 'true'

    if 'LOG_LEVEL' in os.environ:
        SECURITY_CONFIG['LOG_LEVEL'] = os.environ['LOG_LEVEL'].upper()

# Charger la configuration depuis l'environnement au démarrage
load_config_from_env()

if __name__ == "__main__":
    print("Configuration de sécurité actuelle:")
    print(f"Niveau de sécurité: {SECURITY_CONFIG['SECURITY_LEVEL']}")
    print(f"Blocage des téléchargeurs: {SECURITY_CONFIG['BLOCK_DOWNLOAD_MANAGERS']}")
    print(f"Nombre de téléchargeurs bloqués: {len(SECURITY_CONFIG['BLOCKED_DOWNLOADERS'])}")
    print(f"Nombre de patterns suspects: {len(SECURITY_CONFIG['SUSPICIOUS_PATTERNS'])}")

    level_config = get_security_level_config()
    print(f"\nConfiguration du niveau {SECURITY_CONFIG['SECURITY_LEVEL']}:")
    for key, value in level_config.items():
        print(f"  {key}: {value}")
