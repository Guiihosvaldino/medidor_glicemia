from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),  # <-- Certifique-se de que tem o 's' no final aqui!
    path('', include('glicemia.urls')),
]