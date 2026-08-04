from django.urls import path
from . import views, api_views

urlpatterns = [
    # Rota de Login que o React chama em /api/login/
    path('login/', api_views.api_login, name='api_login'),
    # Rotas de cadastro via API
    path('cadastro/', api_views.api_cadastro_paciente, name='api_cadastro_paciente'),
    path('cadastro-medico/', api_views.api_cadastro_medico, name='api_cadastro_medico'),
    # Rota que o React chama para puxar os dados do painel do paciente
    path('dashboard-paciente/', views.dashboard_view, name='api_dashboard_paciente'),
    path('perfil-paciente/', api_views.api_perfil_paciente, name='api_perfil_paciente'),
    path('perfil-medico/', api_views.api_perfil_medico, name='api_perfil_medico'),
    path('dashboard-medico/', api_views.api_dashboard_medico, name='api_dashboard_medico'),
    path('autorizacoes-paciente/', api_views.api_autorizacoes_paciente, name='api_autorizacoes_paciente'),
    path('autorizacoes-paciente/<int:id>/responder/', api_views.api_autorizacao_responder, name='api_autorizacao_responder'),
    path('pacientes-autorizados/', api_views.api_pacientes_autorizados, name='api_pacientes_autorizados'),
    path('medicacoes-paciente/', api_views.api_medicacoes_paciente, name='api_medicacoes_paciente'),
    path('medicacoes-paciente/<int:id>/', api_views.api_medicacao_paciente_detail, name='api_medicacao_paciente_detail'),
    path('medicoes/<int:id>/', api_views.api_medicao_detail, name='api_medicao_detail'),
    path('taxas-paciente/', api_views.api_taxas_paciente, name='api_taxas_paciente'),
    path('taxas-paciente/<int:id>/', api_views.api_taxa_paciente_detail, name='api_taxa_paciente_detail'),
    path('nova-medicao/', views.nova_medicao_view, name='api_nova_medicao'),
    path('gerar-pdf-paciente/', views.exportar_pdf_view, name='api_exportar_pdf'),
]