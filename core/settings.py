"""
Django settings for core project.
"""

from pathlib import Path
import os  # <-- IMPORTANTE: Colocamos o 'import os' aqui no topo!
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'sua-chave-secreta-local-padrao')

# SECURITY WARNING: don't run with debug turned on in production!
# Em ambiente local (sem a variável RENDER), o DEBUG fica True para carregar o CSS. 
# Em produção (no Render), ficará False automaticamente.
DEBUG = 'RENDER' not in os.environ

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'medidor-glicemia.onrender.com']
CSRF_TRUSTED_ORIGINS = ['https://medidor-glicemia.onrender.com']

# Origens confiáveis para CSRF (garanta que está exatamente assim)
CSRF_TRUSTED_ORIGINS = ['https://medidor-glicemia.onrender.com', 'http://localhost:5173', 'http://127.0.0.1:5173']

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://medidor-glicemia.onrender.com"
]

# Segurança extra para Cookies em Produção
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'cloudinary_storage',
    'cloudinary',
    'glicemia',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Servidor de arquivos estáticos
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',  # Essencial para o login funcionar!
    'django.contrib.messages.middleware.MessageMiddleware',     # Essencial para mensagens de erro/sucesso
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


    # Banco de dados de Produção (Configuração direta e testada)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'pterodactyl',
        'PASSWORD': 'Pl3453Ch4n63M3!',
        'HOST': 'host.borkcloud.com.br',
        'PORT': '25577',
        'OPTIONS': {
            'sslmode': 'disable',
        }
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator' },
]

# Internationalization
LANGUAGE_CODE = 'pt-br' # Aproveitei e mudei para português para o seu sistema e datas ficarem no nosso formato!
TIME_ZONE = 'America/Sao_Paulo' # Ajustado para o fuso horário do Brasil
USE_I18N = True
USE_TZ = True

# Arquivos Estáticos (CSS, JavaScript, Imagens)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Remova o STATICFILES_DIRS antigo se ele estiver apontando para caminhos internos duplicados
# Vamos deixar apenas a diretriz padrão de busca automática de aplicativos ativa
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# Configuração estável de produção (sem o Manifest rígido que causa Erro 500)
# Detecta se o Cloudinary está configurado por qualquer uma das variáveis
_USE_CLOUDINARY = bool(os.environ.get('CLOUDINARY_URL') or os.environ.get('CLOUDINARY_CLOUD_NAME'))

STORAGES = {
    "default": {
        # Em produção (Render), usa Cloudinary para armazenar uploads permanentemente
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage" if _USE_CLOUDINARY else "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# Configuração do Cloudinary (credenciais lidas das variáveis de ambiente no Render)
# O try/except garante que o servidor local não quebre caso o cloudinary não esteja instalado
try:
    import cloudinary  # type: ignore[import]
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
        api_key=os.environ.get('CLOUDINARY_API_KEY', ''),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET', ''),
        secure=True,
    )
except ImportError:
    pass  # Em desenvolvimento local sem cloudinary instalado, ignora

# Configurações de E-mail (Recuperação de Senha)
if os.environ.get('EMAIL_HOST_USER'):
    # Produção (Render)
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
    EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
    EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'False') == 'True'
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
else:
    # Desenvolvimento Local (imprime o e-mail no terminal para facilitar os testes)
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Configuração de arquivos de mídia (Uploads como fotos de perfil)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# 🌟 Libere para o React conseguir fazer requisições para o Django
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Porta padrão do Vite/React
    "http://127.0.0.1:5173",
]

# Permite o envio de cookies de sessão nas requisições CORS
CORS_ALLOW_CREDENTIALS = True

# Como estamos em HTTP local (localhost), NÃO use 'None' se você não tiver HTTPS ativo.
# Para HTTP local puro entre portas diferentes, o correto é manter o padrão ou usar estas regras:
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# Garanta que o Django NÃO exija HTTPS para trafegar os cookies no seu computador
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# IMPORTANTE: Garanta que o cookie de sessão seja visível para o domínio localhost
SESSION_COOKIE_DOMAIN = None  # Deixe None para que ele se ajuste ao localhost automaticamente

# Permita que o Netlify acesse sua API
CORS_ALLOWED_ORIGINS = [
    "https://medidorglicemia.netlify.app",
]

# Como agora estamos na internet real (HTTPS), ative a segurança máxima dos cookies:
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SAMESITE = 'None'