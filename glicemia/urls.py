from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('cadastro/', views.cadastro_view, name='cadastro'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('nova-medicao/', views.nova_medicao_view, name='nova_medicao'),
    path('logout/', views.logout_view, name='logout'),
    path('exportar-pdf/', views.exportar_pdf_view, name='exportar_pdf'),
    path('apagar-medicao/<int:id>/', views.apagar_medicao_view, name='apagar_medicao'),
]