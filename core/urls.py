from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('glicemia.urls')),
]

# ESTAS LINHAS SÃO CRUCIAIS PARA O RECONHECIMENTO DO CSS EM PRODUÇÃO:
if not settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)