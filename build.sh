#!/usr/bin/env bash
# exit on error
set -o errexit

# Instala as dependências
pip install -r requirements.txt

# Força a criação das pastas para evitar que o Django dê erro de diretório inexistente
mkdir -p staticfiles
mkdir -p glicemia/static

# Coleta os arquivos estáticos
python manage.py collectstatic --no-input

# Roda as migrações do banco de dados
python manage.py migrate